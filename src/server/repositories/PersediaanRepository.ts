import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { StokTidakCukupError } from '../errors/AppError';

export class PersediaanRepository {
  async ambilBerdasarkanVarian(idVarian: number, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    return client.persediaan.findFirst({
      where: { Id_Varian: idVarian },
      include: {
        VarianProduk: {
          include: {
            Produk: true,
          },
        },
      },
    });
  }

  async kurangi(
    tx: Prisma.TransactionClient,
    idVarian: number,
    qty: number
  ) {
    // Atomic SQL Server conditional update to prevent negative stock and race conditions (PRD 11.4 & AC-29)
    const result = await tx.$executeRaw`
      UPDATE dbo.PERSEDIAAN
      SET Stok_Tersedia = Stok_Tersedia - ${qty},
          Jumlah_Stok = Jumlah_Stok - ${qty},
          Tanggal_Diubah = SYSDATETIME()
      WHERE Id_Varian = ${idVarian} AND Stok_Tersedia >= ${qty}
    `;

    if (result === 0) {
      // Find varian and current stock for detailed error
      const cur = await tx.persediaan.findFirst({
        where: { Id_Varian: idVarian },
        include: { VarianProduk: { include: { Produk: true } } },
      });
      const nama = cur?.VarianProduk?.Produk?.Nama_Produk;
      const sisa = cur ? Number(cur.Stok_Tersedia) : 0;
      throw new StokTidakCukupError(idVarian, nama, sisa);
    }
  }

  async tambah(
    tx: Prisma.TransactionClient,
    idVarian: number,
    qty: number
  ) {
    await tx.$executeRaw`
      UPDATE dbo.PERSEDIAAN
      SET Stok_Tersedia = Stok_Tersedia + ${qty},
          Jumlah_Stok = Jumlah_Stok + ${qty},
          Tanggal_Diubah = SYSDATETIME()
      WHERE Id_Varian = ${idVarian}
    `;
  }

  async koreksi(
    tx: Prisma.TransactionClient,
    idVarian: number,
    stokBaru: number
  ) {
    await tx.$executeRaw`
      UPDATE dbo.PERSEDIAAN
      SET Stok_Tersedia = ${stokBaru},
          Jumlah_Stok = ${stokBaru},
          Tanggal_Diubah = SYSDATETIME()
      WHERE Id_Varian = ${idVarian}
    `;
  }

  async menipis() {
    const raw = await prisma.persediaan.findMany({
      where: {
        Id_Varian: { not: null },
      },
      include: {
        VarianProduk: {
          include: {
            Produk: true,
          },
        },
      },
      take: 10,
    });

    return raw
      .filter((p) => Number(p.Stok_Tersedia) <= Number(p.Stok_Minimum))
      .map((p) => ({
        idVarian: p.Id_Varian,
        idProduk: p.VarianProduk?.Id_Produk,
        namaProduk: p.VarianProduk?.Produk?.Nama_Produk ?? 'Produk',
        stokTersedia: Number(p.Stok_Tersedia),
        stokMinimum: Number(p.Stok_Minimum),
      }));
  }
}
