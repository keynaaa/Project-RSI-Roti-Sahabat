import { prisma } from '../db';
import { Prisma } from '@prisma/client';

export class PengirimanRepository {
  async buat(
    tx: Prisma.TransactionClient,
    data: {
      idPesanan?: number | null;
      idKurir?: number | null;
      nomorResi: string;
      namaPenerima?: string | null;
      alamatAsal?: string | null;
      alamatTujuan?: string | null;
      biayaPengiriman?: number;
      tanggalEstimasi?: Date;
      items?: { idVarian: number; jumlah: number }[];
    }
  ) {
    return tx.pengiriman.create({
      data: {
        Id_Pesanan: data.idPesanan,
        Id_Kurir: data.idKurir,
        Nomor_Resi: data.nomorResi,
        Tanggal_Pengiriman: new Date(),
        Tanggal_Estimasi: data.tanggalEstimasi ?? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        Nama_Penerima: data.namaPenerima,
        Alamat_Asal: data.alamatAsal ?? 'Toko Roti Sahabat, Kebumen',
        Alamat_Tujuan: data.alamatTujuan,
        Biaya_Pengiriman: data.biayaPengiriman || 0,
        Status_Pengiriman: 'Diproses',
        DetailPengiriman: data.items
          ? {
              create: data.items.map((i) => ({
                Id_Varian: i.idVarian,
                Jumlah_Dikirim: i.jumlah,
              })),
            }
          : undefined,
      },
      include: {
        Kurir: true,
      },
    });
  }

  async lacak(nomorResi: string) {
    return prisma.pengiriman.findFirst({
      where: { Nomor_Resi: nomorResi },
      include: {
        Kurir: true,
        Pesanan: true,
      },
    });
  }

  async daftar(filter?: { status?: string; cari?: string }) {
    const where: Prisma.PengirimanWhereInput = {};
    if (filter?.status) {
      where.Status_Pengiriman = filter.status;
    }
    if (filter?.cari?.trim()) {
      where.OR = [
        { Nomor_Resi: { contains: filter.cari.trim() } },
        { Nama_Penerima: { contains: filter.cari.trim() } },
      ];
    }

    return prisma.pengiriman.findMany({
      where,
      orderBy: { Id_Pengiriman: 'desc' },
      include: {
        Kurir: true,
        Pesanan: true,
        DetailPengiriman: {
          include: {
            VarianProduk: {
              include: { Produk: true },
            },
          },
        },
      },
    });
  }

  async updateStatus(
    tx: Prisma.TransactionClient,
    idPengiriman: number,
    statusBaru: string,
    tanggalDiterima?: Date
  ) {
    return tx.pengiriman.update({
      where: { Id_Pengiriman: idPengiriman },
      data: {
        Status_Pengiriman: statusBaru,
        Tanggal_Diterima: tanggalDiterima,
      },
    });
  }
}
