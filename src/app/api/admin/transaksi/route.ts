import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TransaksiService } from '@/server/services/TransaksiService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const simpanTransaksiSchema = z.object({
  idPesanan: z.number().int().positive().nullable().optional(),
  items: z.array(
    z.object({
      idVarian: z.number().int().positive(),
      qty: z.number().int().positive('Jumlah item harus lebih dari 0'),
    })
  ).min(1, 'Daftar item tidak boleh kosong'),
  idMetodePembayaran: z.number().int().positive(),
  uangDiterima: z.number().min(0).optional(),
  tipeDiskon: z.enum(['nominal', 'persen', 'tanpa']).optional(),
  nilaiDiskon: z.number().min(0).optional(),
  kirim: z.boolean().optional(),
  ongkir: z.number().min(0).optional(),
  idKurir: z.number().int().positive().optional(),
  namaPenerima: z.string().optional(),
  teleponPenerima: z.string().optional(),
  alamatPenerima: z.string().optional(),
  kotaPenerima: z.string().optional(),
});

const transaksiService = new TransaksiService();

export async function POST(req: NextRequest) {
  try {
    const sesi = cekPeran(req, ['Owner', 'Staff']);
    const body = await req.json();
    const parsed = simpanTransaksiSchema.parse(body);

    const hasil = await transaksiService.simpanTransaksi(parsed, sesi);

    return NextResponse.json(
      {
        status: 'success',
        pesan: 'Transaksi berhasil disimpan',
        data: {
          idPenjualan: hasil.penjualan.Id_Penjualan,
          kodePenjualan: hasil.penjualan.Kode_Penjualan,
          totalPenjualan: Number(hasil.penjualan.Total_Penjualan),
          jumlahDibayar: Number(hasil.penjualan.Jumlah_Dibayar),
          kembalian: hasil.kembalian,
          resi: hasil.pengiriman?.Nomor_Resi ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return tanganiGalat(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const { searchParams } = new URL(req.url);
    const awalStr = searchParams.get('awal');
    const akhirStr = searchParams.get('akhir');
    const status = searchParams.get('status') || undefined;

    const filter: any = { status };
    if (awalStr) filter.tanggalAwal = new Date(awalStr);
    if (akhirStr) filter.tanggalAkhir = new Date(akhirStr);

    const list = await transaksiService.daftar(filter);

    const mapped = list.map((p) => ({
      idPenjualan: p.Id_Penjualan,
      kodePenjualan: p.Kode_Penjualan,
      tanggal: p.Tanggal_Penjualan,
      kasir: p.Pengguna?.Nama_Pengguna ?? 'Kasir',
      subtotal: Number(p.Subtotal),
      diskon: Number(p.Diskon),
      biayaLain: Number(p.Biaya_Lain),
      total: Number(p.Total_Penjualan),
      status: p.Status_Penjualan,
      metode: p.Pembayaran?.[0]?.MetodePembayaran?.Nama_Metode ?? 'Tunai',
      keterangan: p.Keterangan,
      itemCount: p.DetailPenjualan.length,
    }));

    return NextResponse.json({
      status: 'success',
      data: mapped,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
