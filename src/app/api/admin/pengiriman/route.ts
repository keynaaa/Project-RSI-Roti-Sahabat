import { NextRequest, NextResponse } from 'next/server';
import { PengirimanService } from '@/server/services/PengirimanService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const pengirimanService = new PengirimanService();

export async function GET(req: NextRequest) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const cari = searchParams.get('cari') || undefined;

    const list = await pengirimanService.daftar({ status, cari });

    const mapped = list.map((p) => ({
      idPengiriman: p.Id_Pengiriman,
      nomorResi: p.Nomor_Resi,
      idPesanan: p.Id_Pesanan,
      kurir: p.Kurir?.Nama_Kurir ?? 'Kurir Internal',
      namaPenerima: p.Nama_Penerima,
      alamatTujuan: p.Alamat_Tujuan,
      status: p.Status_Pengiriman,
      biaya: Number(p.Biaya_Pengiriman),
      tanggalKirim: p.Tanggal_Pengiriman,
      tanggalEstimasi: p.Tanggal_Estimasi,
      tanggalDiterima: p.Tanggal_Diterima,
      isDummy: true,
    }));

    return NextResponse.json({
      status: 'success',
      data: mapped,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
