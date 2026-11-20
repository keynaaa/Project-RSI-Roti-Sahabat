import { prisma } from '../db';
import { PenjualanRepository } from '../repositories/PenjualanRepository';
import { PersediaanRepository } from '../repositories/PersediaanRepository';
import { PesananRepository } from '../repositories/PesananRepository';
import { PengirimanRepository } from '../repositories/PengirimanRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { SesiPengguna } from './AuthService';
import { ValidasiError, KonflikError, TidakDitemukanError, TransaksiError, StokTidakCukupError } from '../errors/AppError';
import { MetodePembayaranFactory } from '../domain/MetodePembayaran';
import { Diskon, DiskonNominal, DiskonPersen, TanpaDiskon } from '../domain/Diskon';
import { Penjualan, DetailPenjualan } from '../domain/Penjualan';
import { Pengguna } from '../domain/Pengguna';
import { KirimKurir, AmbilDiToko } from '../domain/SerahTerima';

export interface ItemTransaksiInput {
  idVarian: number;
  qty: number;
}

export interface SimpanTransaksiInput {
  idPesanan?: number | null;
  items: ItemTransaksiInput[];
  idMetodePembayaran: number;
  uangDiterima?: number;
  tipeDiskon?: 'nominal' | 'persen' | 'tanpa';
  nilaiDiskon?: number;
  kirim?: boolean;
  ongkir?: number;
  idKurir?: number;
  namaPenerima?: string;
  teleponPenerima?: string;
  alamatPenerima?: string;
  kotaPenerima?: string;
}

export class TransaksiService {
  constructor(
    private readonly penjualanRepo: PenjualanRepository = new PenjualanRepository(),
    private readonly persediaanRepo: PersediaanRepository = new PersediaanRepository(),
    private readonly pesananRepo: PesananRepository = new PesananRepository(),
    private readonly pengirimanRepo: PengirimanRepository = new PengirimanRepository(),
    private readonly auditRepo: AuditRepository = new AuditRepository()
  ) {}

  async simpanTransaksi(input: SimpanTransaksiInput, kasirSesi: SesiPengguna) {
    if (!input.items || input.items.length === 0) {
      throw new ValidasiError("ERR-TRX-02", "Daftar item transaksi tidak boleh kosong");
    }

    const defaultCabangId = Number(process.env.DEFAULT_CABANG_ID) || 1;

    // 1. Sort items by idVarian ascending to prevent database deadlocks (PRD 12.6)
    const urutkanItem = [...input.items].sort((a, b) => a.idVarian - b.idVarian);

    // 2. Setup domain entities
    const kasirDomain = new Pengguna(
      kasirSesi.id,
      kasirSesi.nama,
      kasirSesi.username,
      kasirSesi.email,
      '',
      kasirSesi.peran
    );

    const kodePenjualan = `PJ-${Date.now().toString().slice(-8)}`;
    const penjualanDomain = new Penjualan(kodePenjualan, kasirDomain, input.idPesanan);

    // 3. Ambil data varian dan harga aktif
    const detailItemsSimpan: { idVarian: number; jumlah: number; hargaSatuan: number; namaProduk: string }[] = [];

    for (const it of urutkanItem) {
      const varian = await prisma.varianProduk.findUnique({
        where: { Id_Varian: it.idVarian },
        include: {
          Produk: true,
          HargaProduk: { orderBy: { Id_Harga_Produk: 'desc' }, take: 1 },
          Persediaan: true,
        },
      });

      if (!varian || !varian.Status_Aktif || varian.Produk.Status_Produk !== 'Aktif') {
        throw new TidakDitemukanError("ERR-PRD-02", `Produk varian #${it.idVarian} tidak tersedia`);
      }

      const hargaSatuan = varian.HargaProduk[0]?.Harga_Jual ? Number(varian.HargaProduk[0].Harga_Jual) : 0;
      const namaProduk = varian.Produk.Nama_Produk;

      penjualanDomain.tambahItem(new DetailPenjualan(it.idVarian, it.qty, hargaSatuan, 0, namaProduk));
      detailItemsSimpan.push({
        idVarian: it.idVarian,
        jumlah: it.qty,
        hargaSatuan,
        namaProduk,
      });
    }

    // 4. Terapkan diskon
    let diskonObj: Diskon = new TanpaDiskon();
    if (input.tipeDiskon === 'nominal' && typeof input.nilaiDiskon === 'number') {
      diskonObj = new DiskonNominal(input.nilaiDiskon);
    } else if (input.tipeDiskon === 'persen' && typeof input.nilaiDiskon === 'number') {
      diskonObj = new DiskonPersen(input.nilaiDiskon);
    }
    penjualanDomain.terapkanDiskon(diskonObj);

    // 5. Terapkan ongkir
    if (input.kirim) {
      penjualanDomain.setOngkir(input.ongkir || 0);
      const serah = new KirimKurir({
        nama: input.namaPenerima || '',
        telepon: input.teleponPenerima || '',
        alamat: input.alamatPenerima || '',
        kota: input.kotaPenerima || '',
        ongkir: input.ongkir,
        idKurir: input.idKurir,
      });
      serah.validasi();
    } else {
      const serah = new AmbilDiToko();
      serah.validasi();
    }

    // 6. Polimorfisme Metode Pembayaran (PRD 12.3 & 12.4)
    const metode = MetodePembayaranFactory.dari(input.idMetodePembayaran);
    const hasilBayar = metode.proses(penjualanDomain.total, input.uangDiterima);

    // 7. Atomic Multi-Step Database Transaction (PRD 11.4)
    try {
      const hasil = await prisma.$transaction(
        async (tx) => {
          // A. Verifikasi status pesanan jika berasal dari pesanan (harus 'Baru')
          if (input.idPesanan) {
            const pesanan = await tx.pesanan.findUnique({
              where: { Id_Pesanan: input.idPesanan },
            });
            if (!pesanan) {
              throw new TidakDitemukanError("ERR-ORD-02", "Pesanan asal tidak ditemukan");
            }
            if (pesanan.Status_Pesanan !== 'Baru') {
              throw new KonflikError("ERR-ORD-03", `Pesanan sudah diproses dengan status: ${pesanan.Status_Pesanan}`);
            }
          }

          // B. Cek dan kurangi stok atomik terurut
          for (const item of urutkanItem) {
            await this.persediaanRepo.kurangi(tx, item.idVarian, item.qty);

            // Ambil persediaan untuk referensi riwayat stok
            const persediaan = await tx.persediaan.findFirst({
              where: { Id_Varian: item.idVarian },
            });

            if (persediaan) {
              const stokSebelum = Number(persediaan.Stok_Tersedia) + item.qty;
              const stokSesudah = Number(persediaan.Stok_Tersedia);

              await tx.riwayatStok.create({
                data: {
                  Id_Persediaan: persediaan.Id_Persediaan,
                  Id_Cabang: defaultCabangId,
                  Jenis_Transaksi: 'Penjualan',
                  Jenis_Perubahan: 'Keluar',
                  Stok_Sebelum: stokSebelum,
                  Stok_Sesudah: stokSesudah,
                  Nomor_Referensi: kodePenjualan,
                  Keterangan: `Penjualan ${kodePenjualan}`,
                },
              });
            }
          }

          // C. Jika kirim dan belum ada pesanan, buatkan PESANAN otomatis
          let idPesananTerkait = input.idPesanan ?? null;
          if (input.kirim && !idPesananTerkait) {
            // Pelanggan
            let idPel = 1;
            if (input.namaPenerima) {
              const pel = await tx.pelanggan.create({
                data: {
                  Nama_Pelanggan: input.namaPenerima,
                  No_Telp: input.teleponPenerima,
                  Jalan: input.alamatPenerima,
                  Kota: input.kotaPenerima,
                },
              });
              idPel = pel.Id_Pelanggan;
            }

            const psnBaru = await tx.pesanan.create({
              data: {
                Kode_Pesanan: `PSN-${Date.now().toString().slice(-8)}`,
                Id_Pelanggan: idPel,
                Id_Cabang: defaultCabangId,
                Status_Pesanan: 'Selesai',
                Total_Pesanan: penjualanDomain.subtotal,
                Biaya_Pengiriman: input.ongkir || 0,
                Nama_Penerima: input.namaPenerima,
                Alamat: input.alamatPenerima,
                Kota_Pengiriman: input.kotaPenerima,
                DetailPesanan: {
                  create: detailItemsSimpan.map((i) => ({
                    Id_Varian: i.idVarian,
                    Jumlah_Pesanan: i.jumlah,
                    Harga_Satuan: i.hargaSatuan,
                  })),
                },
              },
            });
            idPesananTerkait = psnBaru.Id_Pesanan;
          } else if (input.idPesanan) {
            // Update pesanan asal menjadi 'Selesai'
            await tx.pesanan.update({
              where: { Id_Pesanan: input.idPesanan },
              data: {
                Status_Pesanan: 'Selesai',
                Tanggal_Diubah: new Date(),
              },
            });
          }

          // D. Simpan Penjualan + Detail + Pembayaran (Nested Write)
          const penjualan = await this.penjualanRepo.simpan(tx, {
            kodePenjualan,
            idKasir: kasirSesi.id,
            idPesanan: idPesananTerkait,
            idCabang: defaultCabangId,
            subtotal: penjualanDomain.subtotal,
            diskon: penjualanDomain.nilaiDiskon,
            biayaLain: penjualanDomain.ongkir,
            totalPenjualan: penjualanDomain.total,
            jumlahDibayar: hasilBayar.dibayar,
            jumlahKembalian: hasilBayar.kembalian,
            idMetodePembayaran: input.idMetodePembayaran,
            items: detailItemsSimpan,
          });

          // E. Jika kirim, buat PENGIRIMAN
          let pengiriman = null;
          if (input.kirim && idPesananTerkait) {
            const noResi = `RS-${Date.now().toString().slice(-8)}`;
            pengiriman = await this.pengirimanRepo.buat(tx, {
              idPesanan: idPesananTerkait,
              idKurir: input.idKurir || 1,
              nomorResi: noResi,
              namaPenerima: input.namaPenerima,
              alamatTujuan: `${input.alamatPenerima}, ${input.kotaPenerima}`,
              biayaPengiriman: input.ongkir || 0,
              items: detailItemsSimpan,
            });
          }

          // F. Catat Audit Log
          await this.auditRepo.catat(
            tx,
            'TRANSACTION_RECORDED',
            kasirSesi.id,
            'PENJUALAN',
            penjualan.Id_Penjualan,
            undefined,
            JSON.stringify({ kode: kodePenjualan, total: penjualanDomain.total }),
            `Transaksi kasir berhasil dicatat: ${kodePenjualan}`
          );

          return {
            penjualan,
            pengiriman,
            kembalian: hasilBayar.kembalian,
          };
        },
        { timeout: 10000 }
      );

      return hasil;
    } catch (error: any) {
      if (error instanceof StokTidakCukupError || error instanceof ValidasiError || error instanceof KonflikError) {
        throw error;
      }
      console.error("Gagal simpan transaksi:", error);
      throw new TransaksiError("ERR-TRX-01: Penyimpanan transaksi gagal");
    }
  }

  async batalkanTransaksi(idPenjualan: number, alasan: string, ownerSesi: SesiPengguna) {
    if (!ownerSesi.peran.toLowerCase().includes('owner') && !ownerSesi.peran.toLowerCase().includes('super admin')) {
      throw new ValidasiError("ERR-ACC-01", "Hanya Owner yang berhak membatalkan transaksi");
    }
    if (!alasan?.trim()) {
      throw new ValidasiError("ERR-TRX-03", "Alasan pembatalan transaksi wajib diisi");
    }

    const defaultCabangId = Number(process.env.DEFAULT_CABANG_ID) || 1;

    const penjualan = await this.penjualanRepo.ambilBerdasarkanId(idPenjualan);
    if (!penjualan) {
      throw new TidakDitemukanError("ERR-TRX-04", "Transaksi tidak ditemukan");
    }
    if (penjualan.Status_Penjualan === 'Dibatalkan') {
      throw new KonflikError("ERR-KSR-03", "Transaksi sudah pernah dibatalkan");
    }

    // Atomic Rollback
    return prisma.$transaction(async (tx) => {
      // 1. Ubah status penjualan menjadi 'Dibatalkan'
      await this.penjualanRepo.batalkan(tx, idPenjualan, alasan.trim());

      // 2. Kembalikan stok item yang terjual
      for (const d of penjualan.DetailPenjualan) {
        await this.persediaanRepo.tambah(tx, d.Id_Varian, d.Jumlah_Item);

        const persediaan = await tx.persediaan.findFirst({
          where: { Id_Varian: d.Id_Varian },
        });

        if (persediaan) {
          const stokSebelum = Number(persediaan.Stok_Tersedia) - d.Jumlah_Item;
          const stokSesudah = Number(persediaan.Stok_Tersedia);

          await tx.riwayatStok.create({
            data: {
              Id_Persediaan: persediaan.Id_Persediaan,
              Id_Cabang: defaultCabangId,
              Jenis_Transaksi: 'Pembatalan Transaksi',
              Jenis_Perubahan: 'Masuk',
              Stok_Sebelum: stokSebelum,
              Stok_Sesudah: stokSesudah,
              Nomor_Referensi: penjualan.Kode_Penjualan,
              Keterangan: `Pembatalan transaksi ${penjualan.Kode_Penjualan}: ${alasan}`,
            },
          });
        }
      }

      // 3. Kembalikan status pesanan asal menjadi 'Baru' jika ada
      if (penjualan.Id_Pesanan) {
        await tx.pesanan.update({
          where: { Id_Pesanan: penjualan.Id_Pesanan },
          data: {
            Status_Pesanan: 'Baru',
            Tanggal_Diubah: new Date(),
          },
        });

        // 4. Ubah status pengiriman menjadi 'Dibatalkan' jika ada
        await tx.pengiriman.updateMany({
          where: { Id_Pesanan: penjualan.Id_Pesanan },
          data: {
            Status_Pengiriman: 'Dibatalkan',
          },
        });
      }

      // 5. Catat Audit Log
      await this.auditRepo.catat(
        tx,
        'TRANSACTION_CANCELLED',
        ownerSesi.id,
        'PENJUALAN',
        idPenjualan,
        JSON.stringify({ status: 'Lunas' }),
        JSON.stringify({ status: 'Dibatalkan', alasan }),
        `Transaksi dibatalkan oleh ${ownerSesi.nama}: ${alasan}`
      );

      return { success: true, message: "Transaksi berhasil dibatalkan dan stok dikembalikan" };
    });
  }

  async ambilDetail(id: number) {
    const trx = await this.penjualanRepo.ambilBerdasarkanId(id);
    if (!trx) {
      throw new TidakDitemukanError("ERR-TRX-04", "Transaksi tidak ditemukan");
    }
    return trx;
  }

  async daftar(filter?: { tanggalAwal?: Date; tanggalAkhir?: Date; status?: string }) {
    return this.penjualanRepo.daftar(filter);
  }
}
