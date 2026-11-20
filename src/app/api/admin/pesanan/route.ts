import { NextRequest, NextResponse } from 'next/server';
import { PesananService } from '@/server/services/PesananService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const pesananService = new PesananService();

export async function GET(req: NextRequest) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const list = await pesananService.daftarPesananMasuk(status);

    const hasil = list.map((p) => ({
      idPesanan: p.Id_Pesanan,
      kodePesanan: p.Kode_Pesanan,
      tanggal: p.Tanggal_Pesanan,
      pelanggan: p.Pelanggan?.Nama_Pelanggan ?? 'Umum',
      telepon: p.Pelanggan?.No_Telp,
      status: p.Status_Pesanan,
      totalPesanan: Number(p.Total_Pesanan),
      biayaPengiriman: Number(p.Biaya_Pengiriman),
      namaPenerima: p.Nama_Penerima,
      alamat: p.Alamat,
      kota: p.Kota_Pengiriman,
      catatan: p.Catatan_Pesanan,
      items: p.DetailPesanan.map((d) => ({
        idVarian: d.Id_Varian,
        namaProduk: d.VarianProduk.Produk.Nama_Produk,
        jumlah: d.Jumlah_Pesanan,
        hargaSatuan: Number(d.Harga_Satuan),
        subtotal: Number(d.Jumlah_Pesanan) * Number(d.Harga_Satuan),
      })),
    }));

    return NextResponse.json({
      status: 'success',
      data: hasil,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
