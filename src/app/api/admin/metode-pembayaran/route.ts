import { NextRequest, NextResponse } from 'next/server';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const daftarMetode = await prisma.metodePembayaran.findMany({
      where: { Status_Aktif: true },
      select: {
        Id_Metode: true,
        Nama_Metode: true,
        Deskripsi: true,
      },
      orderBy: { Nama_Metode: 'asc' },
    });
    return NextResponse.json({ status: 'success', data: daftarMetode });
  } catch (error) {
    return tanganiGalat(error);
  }
}
