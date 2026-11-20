import { prisma } from '../db';
import { ProdukRepository, FilterKatalog } from '../repositories/ProdukRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { ValidasiError, TidakDitemukanError, KonflikError } from '../errors/AppError';
import { SesiPengguna } from './AuthService';

export class ProdukService {
  constructor(
    private readonly produkRepo: ProdukRepository = new ProdukRepository(),
    private readonly auditRepo: AuditRepository = new AuditRepository()
  ) {}

  async ambilKatalog(filter: FilterKatalog) {
    return this.produkRepo.katalog(filter);
  }

  async ambilDetail(id: number) {
    const produk = await this.produkRepo.ambil(id);
    if (!produk || produk.Status_Produk !== 'Aktif') {
      throw new TidakDitemukanError("ERR-PRD-02", "Produk tidak ditemukan");
    }

    const varian = produk.VarianProduk[0];
    const hargaAktif = varian?.HargaProduk[0]?.Harga_Jual ? Number(varian.HargaProduk[0].Harga_Jual) : 0;
    const hargaPromo = varian?.HargaProduk[0]?.Harga_Promo ? Number(varian.HargaProduk[0].Harga_Promo) : null;
    const stokTersedia = varian?.Persediaan[0]?.Stok_Tersedia ? Number(varian.Persediaan[0].Stok_Tersedia) : 0;

    return {
      idProduk: produk.Id_Produk,
      idVarian: varian?.Id_Varian ?? null,
      kodeProduk: produk.Kode_Produk,
      namaProduk: produk.Nama_Produk,
      kategori: produk.Kategori?.Nama_Kategori ?? 'Lainnya',
      idKategori: produk.Id_Kategori,
      deskripsi: produk.Deskripsi_Produk,
      foto: produk.Foto_Produk,
      harga: hargaAktif,
      hargaPromo: hargaPromo,
      stok: stokTersedia,
      statusStok: stokTersedia > 0 ? 'Tersedia' : 'Stok habis',
    };
  }

  async tambahProduk(
    input: {
      namaProduk: string;
      idKategori: number;
      harga: number;
      stokAwal: number;
      deskripsi?: string;
      foto?: string;
      berat?: number;
    },
    pengguna: SesiPengguna
  ) {
    if (!input.namaProduk?.trim()) {
      throw new ValidasiError("ERR-PRD-01", "Nama produk wajib diisi");
    }
    if (input.harga <= 0) {
      throw new ValidasiError("ERR-PRC-01", "Harga jual harus lebih dari 0");
    }

    // Cek duplikasi nama produk (BR-06)
    const existing = await prisma.produk.findFirst({
      where: { Nama_Produk: input.namaProduk.trim() },
    });
    if (existing) {
      throw new KonflikError("ERR-PRD-03", "Nama produk sudah digunakan");
    }

    const defaultGudangId = Number(process.env.DEFAULT_GUDANG_ID) || 1;
    const kodeProduk = `PRD-${Date.now().toString().slice(-6)}`;
    const kodeVarian = `VRN-${Date.now().toString().slice(-6)}`;

    // Transaksi pembuatan Produk + Varian Satuan + Harga + Persediaan
    const baru = await prisma.$transaction(async (tx) => {
      const produk = await tx.produk.create({
        data: {
          Id_Kategori: input.idKategori,
          Kode_Produk: kodeProduk,
          Nama_Produk: input.namaProduk.trim(),
          Deskripsi_Produk: input.deskripsi,
          Foto_Produk: input.foto,
          Berat_Produk: input.berat || 100,
          Status_Produk: 'Aktif',
        },
      });

      const varian = await tx.varianProduk.create({
        data: {
          Id_Produk: produk.Id_Produk,
          Kode_Varian: kodeVarian,
          Nama_Varian: 'Satuan',
          Status_Aktif: true,
        },
      });

      await tx.hargaProduk.create({
        data: {
          Id_Varian: varian.Id_Varian,
          Harga_Jual: input.harga,
        },
      });

      await tx.persediaan.create({
        data: {
          Id_Gudang: defaultGudangId,
          Id_Varian: varian.Id_Varian,
          Jumlah_Stok: input.stokAwal || 0,
          Stok_Tersedia: input.stokAwal || 0,
          Stok_Minimum: 5,
        },
      });

      await this.auditRepo.catat(
        tx,
        'PRODUCT_CREATED',
        pengguna.id,
        'PRODUK',
        produk.Id_Produk,
        undefined,
        JSON.stringify({ nama: input.namaProduk, harga: input.harga, stok: input.stokAwal }),
        `Produk baru dibuat: ${input.namaProduk}`
      );

      return produk;
    });

    return baru;
  }

  async ubahProduk(
    idProduk: number,
    input: {
      namaProduk?: string;
      idKategori?: number;
      deskripsi?: string;
      foto?: string;
      berat?: number;
    },
    pengguna: SesiPengguna
  ) {
    const produk = await prisma.produk.findUnique({
      where: { Id_Produk: idProduk },
    });
    if (!produk) {
      throw new TidakDitemukanError("ERR-PRD-02", "Produk tidak ditemukan");
    }

    if (input.namaProduk && input.namaProduk.trim() !== produk.Nama_Produk) {
      const dup = await prisma.produk.findFirst({
        where: {
          Nama_Produk: input.namaProduk.trim(),
          NOT: { Id_Produk: idProduk },
        },
      });
      if (dup) {
        throw new KonflikError("ERR-PRD-03", "Nama produk sudah digunakan");
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.produk.update({
        where: { Id_Produk: idProduk },
        data: {
          Nama_Produk: input.namaProduk?.trim() ?? produk.Nama_Produk,
          Id_Kategori: input.idKategori ?? produk.Id_Kategori,
          Deskripsi_Produk: input.deskripsi ?? produk.Deskripsi_Produk,
          Foto_Produk: input.foto ?? produk.Foto_Produk,
          Berat_Produk: input.berat ?? produk.Berat_Produk,
        },
      });

      await this.auditRepo.catat(
        tx,
        'PRODUCT_UPDATED',
        pengguna.id,
        'PRODUK',
        idProduk,
        JSON.stringify(produk),
        JSON.stringify(res),
        `Produk diubah: ${res.Nama_Produk}`
      );

      return res;
    });

    return updated;
  }

  async ubahHarga(
    idProduk: number,
    hargaBaru: number,
    pengguna: SesiPengguna
  ) {
    if (hargaBaru <= 0) {
      throw new ValidasiError("ERR-PRC-01", "Harga baru harus lebih dari 0");
    }

    const produk = await prisma.produk.findUnique({
      where: { Id_Produk: idProduk },
      include: {
        VarianProduk: {
          include: {
            HargaProduk: {
              orderBy: { Id_Harga_Produk: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!produk || !produk.VarianProduk[0]) {
      throw new TidakDitemukanError("ERR-PRD-02", "Produk tidak ditemukan");
    }

    const varian = produk.VarianProduk[0];
    const hargaLama = varian.HargaProduk[0] ? Number(varian.HargaProduk[0].Harga_Jual) : 0;

    if (hargaBaru === hargaLama) {
      throw new ValidasiError("ERR-PRC-02", "Harga baru harus berbeda dari harga saat ini");
    }

    const selisih = hargaBaru - hargaLama;

    // Single transaction for Price update + RIWAYAT_HARGA (BR-09 & PRD 11.4)
    const hasil = await prisma.$transaction(async (tx) => {
      const hargaRecord = await tx.hargaProduk.create({
        data: {
          Id_Varian: varian.Id_Varian,
          Harga_Jual: hargaBaru,
        },
      });

      const riwayat = await tx.riwayatHarga.create({
        data: {
          Id_Varian: varian.Id_Varian,
          Id_Pengguna: pengguna.id,
          Harga_Lama: hargaLama,
          Harga_Baru: hargaBaru,
          Selisih: selisih,
        },
      });

      await this.auditRepo.catat(
        tx,
        'PRICE_CHANGED',
        pengguna.id,
        'HARGA_PRODUK',
        hargaRecord.Id_Harga_Produk,
        JSON.stringify({ hargaLama }),
        JSON.stringify({ hargaBaru, selisih }),
        `Perubahan harga ${produk.Nama_Produk}: Rp ${hargaLama} -> Rp ${hargaBaru}`
      );

      return {
        idHarga: hargaRecord.Id_Harga_Produk,
        idVarian: varian.Id_Varian,
        hargaLama,
        hargaBaru,
        selisih,
        waktu: riwayat.Waktu,
      };
    });

    return hasil;
  }

  async ambilRiwayatHarga(idProduk: number) {
    const produk = await prisma.produk.findUnique({
      where: { Id_Produk: idProduk },
      include: {
        VarianProduk: true,
      },
    });
    if (!produk || !produk.VarianProduk[0]) {
      throw new TidakDitemukanError("ERR-PRD-02", "Produk tidak ditemukan");
    }

    const varian = produk.VarianProduk[0];
    const riwayat = await prisma.riwayatHarga.findMany({
      where: { Id_Varian: varian.Id_Varian },
      orderBy: { Waktu: 'desc' },
      include: {
        Pengguna: {
          select: { Id_Pengguna: true, Nama_Pengguna: true, Username: true },
        },
      },
    });

    return riwayat.map((r) => ({
      idRiwayat: r.Id_Riwayat_Harga,
      hargaLama: Number(r.Harga_Lama),
      hargaBaru: Number(r.Harga_Baru),
      selisih: Number(r.Selisih),
      waktu: r.Waktu,
      pengguna: r.Pengguna?.Nama_Pengguna ?? 'Sistem',
    }));
  }

  async hapusProduk(idProduk: number, pengguna: SesiPengguna) {
    // Only Owner is authorized (BR-01, FSD-2.6)
    if (!pengguna.peran.toLowerCase().includes('owner') && !pengguna.peran.toLowerCase().includes('super admin')) {
      throw new ValidasiError("ERR-ACC-01", "Hanya Owner yang berhak menghapus produk");
    }

    const produk = await prisma.produk.findUnique({
      where: { Id_Produk: idProduk },
    });
    if (!produk) {
      throw new TidakDitemukanError("ERR-PRD-02", "Produk tidak ditemukan");
    }

    // Soft delete: set Status_Produk = 'Nonaktif' and varian Status_Aktif = false (Rule 7 PRD)
    await prisma.$transaction(async (tx) => {
      await tx.produk.update({
        where: { Id_Produk: idProduk },
        data: { Status_Produk: 'Nonaktif' },
      });
      await tx.varianProduk.updateMany({
        where: { Id_Produk: idProduk },
        data: { Status_Aktif: false },
      });

      await this.auditRepo.catat(
        tx,
        'PRODUCT_DEACTIVATED',
        pengguna.id,
        'PRODUK',
        idProduk,
        JSON.stringify({ status: produk.Status_Produk }),
        JSON.stringify({ status: 'Nonaktif' }),
        `Produk dinonaktifkan: ${produk.Nama_Produk}`
      );
    });

    return { success: true, message: `Produk ${produk.Nama_Produk} berhasil dinonaktifkan` };
  }
}
