import { NextRequest, NextResponse } from 'next/server';
import { LaporanService } from '@/server/services/LaporanService';
import { PesananRepository } from '@/server/repositories/PesananRepository';
import { PersediaanRepository } from '@/server/repositories/PersediaanRepository';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const laporanService = new LaporanService();
const pesananRepo = new PesananRepository();
const persediaanRepo = new PersediaanRepository();

export async function GET(req: NextRequest) {
  try {
    const sesi = cekPeran(req, ['Owner', 'Staff']);

    // Concurrent asynchronous calls with Promise.all (PRD 12.6 & AC-34)
    const [hariIni, pesananBaruCount, stokMenipis] = await Promise.all([
      laporanService.totalHariIni(),
      pesananRepo.hitungBaru(),
      persediaanRepo.menipis(),
    ]);

    const isOwner = sesi.peran.toLowerCase().includes('owner') || sesi.peran.toLowerCase().includes('super admin');

    return NextResponse.json({
      status: 'success',
      data: {
        user: {
          nama: sesi.nama,
          peran: sesi.peran,
        },
        penghasilanHariIni: isOwner ? hariIni.total : null,
        transaksiHariIni: hariIni.transaksi,
        pesananBaru: pesananBaruCount,
        stokMenipis,
      },
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
