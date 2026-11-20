import { NextRequest, NextResponse } from 'next/server';
import { LaporanService, PeriodePilihan } from '@/server/services/LaporanService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const laporanService = new LaporanService();

export async function GET(req: NextRequest) {
  try {
    // Only Owner is authorized (AC-06, PRD section 5 & 6.12)
    cekPeran(req, ['Owner']);

    const { searchParams } = new URL(req.url);
    const periode = searchParams.get('periode') as PeriodePilihan | null;
    const awalStr = searchParams.get('awal');
    const akhirStr = searchParams.get('akhir');

    let laporan;
    if (awalStr && akhirStr) {
      // Overloading call with Date, Date (PRD 12.5, AC-33)
      const awal = new Date(awalStr);
      const akhir = new Date(akhirStr);
      laporan = await laporanService.ringkasan(awal, akhir);
    } else {
      // Overloading call with Periode enum (PRD 12.5, AC-33)
      laporan = await laporanService.ringkasan(periode || 'Semua');
    }

    return NextResponse.json({
      status: 'success',
      data: laporan.toDto(),
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
