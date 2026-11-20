import { prisma } from '../db';
import { TidakDitemukanError } from '../errors/AppError';

export interface StrukData {
  namaToko: string;
  alamatToko: string;
  teleponToko: string;
  kodePenjualan: string;
  waktu: Date;
  kasir: string;
  items: {
    nama: string;
    jumlah: number;
    hargaSatuan: number;
    subtotal: number;
  }[];
  subtotal: number;
  diskon: number;
  ongkir: number;
  total: number;
  metodePembayaran: string;
  uangDiterima: number;
  kembalian: number;
}

export class StrukService {
  // Overloading signatures (PRD 12.5)
  buat(idPenjualan: number): Promise<StrukData>;
  buat(penjualan: any): Promise<StrukData>;
  async buat(arg: number | any): Promise<StrukData> {
    let data: any;

    if (typeof arg === 'number') {
      data = await prisma.penjualan.findUnique({
        where: { Id_Penjualan: arg },
        include: {
          Pengguna: true,
          Pembayaran: { include: { MetodePembayaran: true } },
          DetailPenjualan: {
            include: {
              VarianProduk: {
                include: { Produk: true },
              },
            },
          },
        },
      });

      if (!data) {
        throw new TidakDitemukanError("ERR-TRX-04", "Transaksi tidak ditemukan untuk cetak struk");
      }
    } else {
      data = arg;
    }

    const items = data.DetailPenjualan.map((d: any) => ({
      nama: d.VarianProduk?.Produk?.Nama_Produk ?? 'Produk',
      jumlah: d.Jumlah_Item,
      hargaSatuan: Number(d.Harga_Satuan),
      subtotal: Number(d.Jumlah_Item) * Number(d.Harga_Satuan) - Number(d.Diskon_Item || 0),
    }));

    const metode = data.Pembayaran?.[0]?.MetodePembayaran?.Nama_Metode ?? 'Tunai';

    return {
      namaToko: "Roti Sahabat Kebumen",
      alamatToko: "Jl. Kutoarjo No. 8 Jatisari, Kebumen",
      teleponToko: process.env.TOKO_WHATSAPP || "08123456789",
      kodePenjualan: data.Kode_Penjualan,
      waktu: data.Tanggal_Penjualan || new Date(),
      kasir: data.Pengguna?.Nama_Pengguna ?? "Kasir",
      items,
      subtotal: Number(data.Subtotal),
      diskon: Number(data.Diskon),
      ongkir: Number(data.Biaya_Lain),
      total: Number(data.Total_Penjualan),
      metodePembayaran: metode,
      uangDiterima: Number(data.Jumlah_Dibayar),
      kembalian: Number(data.Jumlah_Kembalian),
    };
  }
}
