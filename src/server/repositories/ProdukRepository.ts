import { prisma } from '../db';
import { Prisma } from '@prisma/client';

export interface FilterKatalog {
  kategori?: string;
  cari?: string;
  halaman?: number;
  limit?: number;
}

export class ProdukRepository {
  // Method Overloading implementation as required by PRD 12.5 & AC-32
  ambil(id: number): Promise<any | null>;
  ambil(barcode: string): Promise<any | null>;
  async ambil(kunci: number | string): Promise<any | null> {
    if (typeof kunci === 'number') {
      return this.cariBerdasarkanId(kunci);
    }
    return this.cariBerdasarkanBarcode(kunci);
  }

  private async cariBerdasarkanId(id: number) {
    return prisma.produk.findUnique({
      where: { Id_Produk: id },
      include: {
        Kategori: true,
        VarianProduk: {
          include: {
            HargaProduk: {
              orderBy: { Id_Harga_Produk: 'desc' },
              take: 1,
            },
            Persediaan: true,
          },
        },
      },
    });
  }

  private async cariBerdasarkanBarcode(barcode: string) {
    const varian = await prisma.varianProduk.findFirst({
      where: { Barcode: barcode, Status_Aktif: true },
      include: {
        Produk: {
          include: {
            Kategori: true,
          },
        },
        HargaProduk: {
          orderBy: { Id_Harga_Produk: 'desc' },
          take: 1,
        },
        Persediaan: true,
      },
    });
    if (!varian) return null;
    return {
      ...varian.Produk,
      VarianProduk: [varian],
    };
  }

  async katalog(filter: FilterKatalog) {
    const halaman = Math.max(1, filter.halaman || 1);
    const limit = filter.limit || 15;
    const skip = (halaman - 1) * limit;

    const where: Prisma.ProdukWhereInput = {
      Status_Produk: 'Aktif',
    };

    if (filter.cari?.trim()) {
      where.Nama_Produk = {
        contains: filter.cari.trim(),
      };
    }

    if (filter.kategori?.trim() && filter.kategori.toLowerCase() !== 'semua') {
      where.Kategori = {
        Nama_Kategori: {
          equals: filter.kategori.trim(),
        },
      };
    }

    const [total, items] = await Promise.all([
      prisma.produk.count({ where }),
      prisma.produk.findMany({
        where,
        skip,
        take: limit,
        orderBy: { Id_Produk: 'desc' },
        include: {
          Kategori: true,
          VarianProduk: {
            where: { Status_Aktif: true },
            include: {
              HargaProduk: {
                orderBy: { Id_Harga_Produk: 'desc' },
                take: 1,
              },
              Persediaan: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      halaman,
      totalHalaman: Math.ceil(total / limit),
      items: items.map((p) => {
        const varian = p.VarianProduk[0];
        const hargaAktif = varian?.HargaProduk[0]?.Harga_Jual ? Number(varian.HargaProduk[0].Harga_Jual) : 0;
        const hargaPromo = varian?.HargaProduk[0]?.Harga_Promo ? Number(varian.HargaProduk[0].Harga_Promo) : null;
        const stokTersedia = varian?.Persediaan[0]?.Stok_Tersedia ? Number(varian.Persediaan[0].Stok_Tersedia) : 0;

        return {
          idProduk: p.Id_Produk,
          idVarian: varian?.Id_Varian ?? null,
          kodeProduk: p.Kode_Produk,
          namaProduk: p.Nama_Produk,
          kategori: p.Kategori?.Nama_Kategori ?? 'Lainnya',
          deskripsi: p.Deskripsi_Produk,
          foto: p.Foto_Produk,
          harga: hargaAktif,
          hargaPromo: hargaPromo,
          stok: stokTersedia,
          statusStok: stokTersedia > 0 ? 'Tersedia' : 'Stok habis',
        };
      }),
    };
  }
}
