import { NextRequest, NextResponse } from 'next/server';
import { TransaksiService } from '@/server/services/TransaksiService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const transaksiService = new TransaksiService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const trx = await transaksiService.ambilDetail(id);

    return NextResponse.json({
      status: 'success',
      data: {
        idPenjualan: trx.Id_Penjualan,
        kodePenjualan: trx.Kode_Penjualan,
        tanggal: trx.Tanggal_Penjualan,
        kasir: trx.Pengguna?.Nama_Pengguna ?? 'Kasir',
        pelanggan: trx.Pelanggan?.Nama_Pelanggan ?? 'Umum',
        subtotal: Number(trx.Subtotal),
        diskon: Number(trx.Diskon),
        biayaLain: Number(trx.Biaya_Lain),
        totalPenjualan: Number(trx.Total_Penjualan),
        jumlahDibayar: Number(trx.Jumlah_Dibayar),
        jumlahKembalian: Number(trx.Jumlah_Kembalian),
        status: trx.Status_Penjualan,
        keterangan: trx.Keterangan,
        metode: trx.Pembayaran?.[0]?.MetodePembayaran?.Nama_Metode ?? 'Tunai',
        items: trx.DetailPenjualan.map((d) => ({
          idVarian: d.Id_Varian,
          namaProduk: d.VarianProduk.Produk.Nama_Produk,
          jumlah: d.Jumlah_Item,
          hargaSatuan: Number(d.Harga_Satuan),
          diskonItem: Number(d.Diskon_Item || 0),
          subtotal: Number(d.Jumlah_Item) * Number(d.Harga_Satuan) - Number(d.Diskon_Item || 0),
        })),
      },
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
