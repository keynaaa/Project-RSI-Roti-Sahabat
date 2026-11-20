import { prisma } from '../db';
import { PesananRepository } from '../repositories/PesananRepository';
import { PersediaanRepository } from '../repositories/PersediaanRepository';
import { ValidasiError, TidakDitemukanError, StokTidakCukupError } from '../errors/AppError';
import { SerahTerima, KirimKurir, AmbilDiToko } from '../domain/SerahTerima';

export interface ItemKeranjangInput {
  idVarian: number;
  qty: number;
}

export class PesananService {
  constructor(
    private readonly pesananRepo: PesananRepository = new PesananRepository(),
    private readonly persediaanRepo: PersediaanRepository = new PersediaanRepository()
  ) {}

  async cekKeranjang(items: ItemKeranjangInput[]) {
    if (!items || items.length === 0) {
      throw new ValidasiError("ERR-ORD-01", "Keranjang kosong");
    }

    const hasil = [];
    for (const item of items) {
      const persediaan = await this.persediaanRepo.ambilBerdasarkanVarian(item.idVarian);
      if (!persediaan) {
        throw new TidakDitemukanError("ERR-PRD-02", `Varian produk #${item.idVarian} tidak ditemukan`);
      }

      const stokTersedia = Number(persediaan.Stok_Tersedia);
      const nama = persediaan.VarianProduk?.Produk?.Nama_Produk ?? 'Produk';

      if (stokTersedia <= 0) {
        throw new ValidasiError("ERR-STK-01", `Stok habis untuk ${nama}`);
      }

      if (item.qty > stokTersedia) {
        throw new StokTidakCukupError(item.idVarian, nama, stokTersedia);
      }

      hasil.push({
        idVarian: item.idVarian,
        namaProduk: nama,
        stokTersedia,
        cukup: true,
      });
    }

    return { valid: true, items: hasil };
  }

  async buatPesanan(input: {
    items: ItemKeranjangInput[];
    metode: 'AmbilDiToko' | 'Kirim';
    namaPenerima?: string;
    telepon?: string;
    alamat?: string;
    kota?: string;
    catatan?: string;
  }) {
    if (!input.items || input.items.length === 0) {
      throw new ValidasiError("ERR-ORD-01", "Keranjang pesanan tidak boleh kosong");
    }

    // Validasi Serah Terima
    const serahTerima: SerahTerima =
      input.metode === 'Kirim'
        ? new KirimKurir({
            nama: input.namaPenerima || '',
            telepon: input.telepon || '',
            alamat: input.alamat || '',
            kota: input.kota || '',
          })
        : new AmbilDiToko();

    serahTerima.validasi();

    // Pastikan data pelanggan
    let idPelanggan = 1; // Default Pelanggan Umum
    if (input.metode === 'Kirim' && input.namaPenerima) {
      const pel = await prisma.pelanggan.create({
        data: {
          Nama_Pelanggan: input.namaPenerima.trim(),
          No_Telp: input.telepon?.trim(),
          Jalan: input.alamat?.trim(),
          Kota: input.kota?.trim(),
          Jenis_Pelanggan: 'Umum',
        },
      });
      idPelanggan = pel.Id_Pelanggan;
    }

    // Re-check stok dan ambil harga aktif
    const detailItems: {
      idVarian: number;
      namaProduk: string;
      jumlah: number;
      hargaSatuan: number;
      subtotal: number;
    }[] = [];
    let totalPesanan = 0;

    for (const it of input.items) {
      const persediaan = await this.persediaanRepo.ambilBerdasarkanVarian(it.idVarian);
      if (!persediaan) {
        throw new TidakDitemukanError("ERR-PRD-02", `Produk #${it.idVarian} tidak ditemukan`);
      }
      const stokTersedia = Number(persediaan.Stok_Tersedia);
      const nama = persediaan.VarianProduk?.Produk?.Nama_Produk ?? 'Produk';

      if (it.qty > stokTersedia) {
        throw new StokTidakCukupError(it.idVarian, nama, stokTersedia);
      }

      // Ambil harga aktif
      const hargaAktifRec = await prisma.hargaProduk.findFirst({
        where: { Id_Varian: it.idVarian },
        orderBy: { Id_Harga_Produk: 'desc' },
      });
      const hargaSatuan = hargaAktifRec ? Number(hargaAktifRec.Harga_Jual) : 0;
      const subtotal = it.qty * hargaSatuan;
      totalPesanan += subtotal;

      detailItems.push({
        idVarian: it.idVarian,
        namaProduk: nama,
        jumlah: it.qty,
        hargaSatuan,
        subtotal,
      });
    }

    const kodePesanan = `PSN-${Date.now().toString().slice(-8)}`;
    const defaultCabangId = Number(process.env.DEFAULT_CABANG_ID) || 1;

    // Simpan pesanan dengan status 'Baru' (PRD 11.4: stok BELUM berkurang)
    const pesanan = await prisma.$transaction(async (tx) => {
      return this.pesananRepo.buat(tx, {
        kodePesanan,
        idPelanggan,
        idCabang: defaultCabangId,
        catatan: input.catatan,
        namaPenerima: input.namaPenerima,
        alamat: input.alamat,
        kota: input.kota,
        totalPesanan,
        statusPesanan: 'Baru',
        items: detailItems,
      });
    });

    // Susun template pesan WhatsApp sesuai format PRD bagian 9.A
    const barisItem = detailItems
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.namaProduk} x${it.jumlah} = Rp ${it.subtotal.toLocaleString('id-ID')}`
      )
      .join('\n');

    const infoMetode =
      input.metode === 'Kirim'
        ? `Metode: Kirim ke ${input.alamat}, ${input.kota} (a.n. ${input.namaPenerima}, ${input.telepon})`
        : 'Metode: Ambil di toko';

    const infoCatatan = input.catatan ? `\nCatatan: ${input.catatan}` : '';

    const pesanWa =
      `Halo Roti Sahabat, saya ingin memesan (No. Pesanan #${pesanan.Kode_Pesanan}):\n` +
      `${barisItem}\n` +
      `Estimasi total: Rp ${totalPesanan.toLocaleString('id-ID')} (belum termasuk ongkir)\n` +
      `${infoMetode}` +
      `${infoCatatan}\n` +
      `Mohon konfirmasi ketersediaan, ongkir, dan pembayaran. Terima kasih.`;

    const noWaToko = process.env.TOKO_WHATSAPP || '628123456789';
    const waUrl = `https://wa.me/${noWaToko}?text=${encodeURIComponent(pesanWa)}`;

    return {
      idPesanan: pesanan.Id_Pesanan,
      kodePesanan: pesanan.Kode_Pesanan,
      totalEstimasi: totalPesanan,
      status: pesanan.Status_Pesanan,
      waUrl,
      pesanWa,
      items: detailItems,
    };
  }

  async ambilRingkasan(idPesanan: number) {
    const pesanan = await this.pesananRepo.ambilBerdasarkanId(idPesanan);
    if (!pesanan) {
      throw new TidakDitemukanError("ERR-ORD-02", "Pesanan tidak ditemukan");
    }

    return {
      idPesanan: pesanan.Id_Pesanan,
      kodePesanan: pesanan.Kode_Pesanan,
      tanggal: pesanan.Tanggal_Pesanan,
      status: pesanan.Status_Pesanan,
      totalPesanan: Number(pesanan.Total_Pesanan),
      items: pesanan.DetailPesanan.map((d) => ({
        idVarian: d.Id_Varian,
        namaProduk: d.VarianProduk.Produk.Nama_Produk,
        jumlah: d.Jumlah_Pesanan,
        hargaSatuan: Number(d.Harga_Satuan),
        subtotal: Number(d.Jumlah_Pesanan) * Number(d.Harga_Satuan),
      })),
      namaPenerima: pesanan.Nama_Penerima,
      kota: pesanan.Kota_Pengiriman,
    };
  }

  async daftarPesananMasuk(status?: string) {
    return this.pesananRepo.daftar(status);
  }
}
