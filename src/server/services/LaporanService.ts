import { prisma } from '../db';
import { LaporanPenjualan, ItemRekapProduk } from '../domain/LaporanPenjualan';
import { ValidasiError } from '../errors/AppError';

export type PeriodePilihan = 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan' | 'Semua';

export class LaporanService {
  // Overloading signatures as specified in PRD 12.5 & AC-33
  ringkasan(periode: PeriodePilihan): Promise<LaporanPenjualan>;
  ringkasan(awal: Date, akhir: Date): Promise<LaporanPenjualan>;
  async ringkasan(a: PeriodePilihan | Date, b?: Date): Promise<LaporanPenjualan> {
    let tglAwal: Date | null = null;
    let tglAkhir: Date | null = null;

    if (typeof a === 'string') {
      const now = new Date();
      if (a === 'Harian') {
        tglAwal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        tglAkhir = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (a === 'Mingguan') {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        firstDayOfWeek.setHours(0, 0, 0, 0);
        tglAwal = firstDayOfWeek;
        tglAkhir = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (a === 'Bulanan') {
        tglAwal = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        tglAkhir = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (a === 'Tahunan') {
        tglAwal = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        tglAkhir = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else {
        // 'Semua'
        tglAwal = null;
        tglAkhir = null;
      }
    } else {
      tglAwal = a;
      tglAkhir = b ?? new Date();
      if (tglAwal > tglAkhir) {
        throw new ValidasiError("ERR-RPT-01", "Rentang tanggal tidak valid (tanggal awal tidak boleh lebih dari tanggal akhir)");
      }
    }

    const where: any = {
      Status_Penjualan: 'Lunas',
    };

    if (tglAwal || tglAkhir) {
      where.Tanggal_Penjualan = {};
      if (tglAwal) where.Tanggal_Penjualan.gte = tglAwal;
      if (tglAkhir) where.Tanggal_Penjualan.lte = tglAkhir;
    }

    const daftar = await prisma.penjualan.findMany({
      where,
      orderBy: { Tanggal_Penjualan: 'desc' },
      include: {
        DetailPenjualan: {
          include: {
            VarianProduk: {
              include: { Produk: true },
            },
          },
        },
      },
    });

    // Hitung rincian per produk
    const mapProduk = new Map<number, ItemRekapProduk>();

    for (const trx of daftar) {
      for (const d of trx.DetailPenjualan) {
        const idProduk = d.VarianProduk.Id_Produk;
        const namaProduk = d.VarianProduk.Produk.Nama_Produk;
        const sub = Number(d.Jumlah_Item) * Number(d.Harga_Satuan) - Number(d.Diskon_Item || 0);

        const cur = mapProduk.get(idProduk) || {
          idProduk,
          namaProduk,
          jumlahTerjual: 0,
          totalPenjualan: 0,
        };

        cur.jumlahTerjual += d.Jumlah_Item;
        cur.totalPenjualan += sub;
        mapProduk.set(idProduk, cur);
      }
    }

    const rincianProduk = Array.from(mapProduk.values()).sort((x, y) => y.totalPenjualan - x.totalPenjualan);

    const mappedDaftar = daftar.map((p) => ({
      idPenjualan: p.Id_Penjualan,
      kodePenjualan: p.Kode_Penjualan,
      totalPenjualan: Number(p.Total_Penjualan),
      subtotal: Number(p.Subtotal),
      diskon: Number(p.Diskon),
      biayaLain: Number(p.Biaya_Lain),
      tanggal: p.Tanggal_Penjualan || new Date(),
    }));

    return new LaporanPenjualan(tglAwal, tglAkhir, mappedDaftar, rincianProduk);
  }

  async totalHariIni(): Promise<{ total: number; transaksi: number }> {
    const now = new Date();
    const tglAwal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const tglAkhir = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const rekap = await prisma.penjualan.aggregate({
      where: {
        Status_Penjualan: 'Lunas',
        Tanggal_Penjualan: {
          gte: tglAwal,
          lte: tglAkhir,
        },
      },
      _sum: {
        Total_Penjualan: true,
      },
      _count: {
        Id_Penjualan: true,
      },
    });

    return {
      total: Number(rekap._sum.Total_Penjualan || 0),
      transaksi: rekap._count.Id_Penjualan,
    };
  }
}
