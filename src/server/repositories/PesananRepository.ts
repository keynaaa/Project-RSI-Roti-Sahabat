import { prisma } from '../db';
import { Prisma } from '@prisma/client';

export class PesananRepository {
  async hitungBaru(): Promise<number> {
    return prisma.pesanan.count({
      where: { Status_Pesanan: 'Baru' },
    });
  }

  async ambilBerdasarkanId(id: number) {
    return prisma.pesanan.findUnique({
      where: { Id_Pesanan: id },
      include: {
        Pelanggan: true,
        DetailPesanan: {
          include: {
            VarianProduk: {
              include: { Produk: true },
            },
          },
        },
      },
    });
  }

  async daftar(status?: string) {
    const where: Prisma.PesananWhereInput = {};
    if (status) {
      where.Status_Pesanan = status;
    }

    return prisma.pesanan.findMany({
      where,
      orderBy: { Id_Pesanan: 'desc' },
      include: {
        Pelanggan: true,
        DetailPesanan: {
          include: {
            VarianProduk: {
              include: { Produk: true },
            },
          },
        },
      },
    });
  }

  async buat(
    tx: Prisma.TransactionClient,
    data: {
      kodePesanan: string;
      idPelanggan: number;
      idCabang: number;
      catatan?: string | null;
      namaPenerima?: string | null;
      alamat?: string | null;
      kota?: string | null;
      biayaPengiriman?: number;
      totalPesanan: number;
      statusPesanan?: string;
      items: { idVarian: number; jumlah: number; hargaSatuan: number }[];
    }
  ) {
    return tx.pesanan.create({
      data: {
        Kode_Pesanan: data.kodePesanan,
        Id_Pelanggan: data.idPelanggan,
        Id_Cabang: data.idCabang,
        Catatan_Pesanan: data.catatan,
        Nama_Penerima: data.namaPenerima,
        Alamat: data.alamat,
        Kota_Pengiriman: data.kota,
        Biaya_Pengiriman: data.biayaPengiriman || 0,
        Total_Pesanan: data.totalPesanan,
        Status_Pesanan: data.statusPesanan || 'Baru',
        DetailPesanan: {
          create: data.items.map((i) => ({
            Id_Varian: i.idVarian,
            Jumlah_Pesanan: i.jumlah,
            Harga_Satuan: i.hargaSatuan,
          })),
        },
      },
      include: {
        DetailPesanan: true,
      },
    });
  }

  async updateStatus(
    tx: Prisma.TransactionClient,
    idPesanan: number,
    status: string
  ) {
    return tx.pesanan.update({
      where: { Id_Pesanan: idPesanan },
      data: {
        Status_Pesanan: status,
        Tanggal_Diubah: new Date(),
      },
    });
  }
}
