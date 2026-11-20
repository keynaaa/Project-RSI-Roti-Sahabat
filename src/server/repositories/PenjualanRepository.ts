import { prisma } from '../db';
import { Prisma } from '@prisma/client';

export class PenjualanRepository {
  async simpan(
    tx: Prisma.TransactionClient,
    data: {
      kodePenjualan: string;
      idKasir: number;
      idPesanan?: number | null;
      idPelanggan?: number | null;
      idCabang: number;
      subtotal: number;
      diskon: number;
      biayaLain: number;
      totalPenjualan: number;
      jumlahDibayar: number;
      jumlahKembalian: number;
      idMetodePembayaran: number;
      items: { idVarian: number; jumlah: number; hargaSatuan: number; diskonItem?: number }[];
    }
  ) {
    // Nested write enforcing Composition: DetailPenjualan is created along with Penjualan (PRD 12.7)
    const penjualan = await tx.penjualan.create({
      data: {
        Kode_Penjualan: data.kodePenjualan,
        Id_Pengguna: data.idKasir,
        Id_Pesanan: data.idPesanan,
        Id_Pelanggan: data.idPelanggan,
        Id_Cabang: data.idCabang,
        Jenis_Penjualan: data.biayaLain > 0 ? 'Kirim' : 'Langsung',
        Subtotal: data.subtotal,
        Diskon: data.diskon,
        Biaya_Lain: data.biayaLain,
        Total_Penjualan: data.totalPenjualan,
        Jumlah_Dibayar: data.jumlahDibayar,
        Jumlah_Kembalian: data.jumlahKembalian,
        Status_Penjualan: 'Lunas',
        DetailPenjualan: {
          create: data.items.map((i) => ({
            Id_Varian: i.idVarian,
            Jumlah_Item: i.jumlah,
            Harga_Satuan: i.hargaSatuan,
            Diskon_Item: i.diskonItem || 0,
          })),
        },
      },
      include: {
        DetailPenjualan: {
          include: {
            VarianProduk: {
              include: { Produk: true },
            },
          },
        },
        Pengguna: true,
      },
    });

    // Catat Pembayaran
    const noPembayaran = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await tx.pembayaran.create({
      data: {
        Id_Penjualan: penjualan.Id_Penjualan,
        Id_Metode: data.idMetodePembayaran,
        No_Pembayaran: noPembayaran,
        Jumlah_Pembayaran: data.totalPenjualan,
        Status_Pembayaran: 'Berhasil',
      },
    });

    return penjualan;
  }

  async ambilBerdasarkanId(id: number) {
    return prisma.penjualan.findUnique({
      where: { Id_Penjualan: id },
      include: {
        Pengguna: {
          select: { Id_Pengguna: true, Nama_Pengguna: true, Username: true },
        },
        Pelanggan: true,
        Pesanan: true,
        DetailPenjualan: {
          include: {
            VarianProduk: {
              include: { Produk: true },
            },
          },
        },
        Pembayaran: {
          include: { MetodePembayaran: true },
        },
      },
    });
  }

  async daftar(filter?: { tanggalAwal?: Date; tanggalAkhir?: Date; status?: string }) {
    const where: Prisma.PenjualanWhereInput = {};
    if (filter?.status) {
      where.Status_Penjualan = filter.status;
    }
    if (filter?.tanggalAwal || filter?.tanggalAkhir) {
      where.Tanggal_Penjualan = {};
      if (filter.tanggalAwal) where.Tanggal_Penjualan.gte = filter.tanggalAwal;
      if (filter.tanggalAkhir) where.Tanggal_Penjualan.lte = filter.tanggalAkhir;
    }

    return prisma.penjualan.findMany({
      where,
      orderBy: { Id_Penjualan: 'desc' },
      include: {
        Pengguna: {
          select: { Id_Pengguna: true, Nama_Pengguna: true, Username: true },
        },
        Pelanggan: true,
        Pembayaran: {
          include: { MetodePembayaran: true },
        },
        DetailPenjualan: {
          include: {
            VarianProduk: {
              include: { Produk: true },
            },
          },
        },
      },
    });
  }

  async batalkan(
    tx: Prisma.TransactionClient,
    idPenjualan: number,
    alasan: string
  ) {
    return tx.penjualan.update({
      where: { Id_Penjualan: idPenjualan },
      data: {
        Status_Penjualan: 'Dibatalkan',
        Keterangan: alasan,
      },
      include: {
        DetailPenjualan: true,
      },
    });
  }
}
