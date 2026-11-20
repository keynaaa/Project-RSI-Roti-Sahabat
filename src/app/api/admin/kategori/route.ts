import { NextRequest, NextResponse } from 'next/server';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const daftarKategori = await prisma.kategori.findMany({
      where: { Status_Aktif: true },
      select: {
        Id_Kategori: true,
        Nama_Kategori: true,
        Deskripsi: true,
      },
      orderBy: { Nama_Kategori: 'asc' },
    });
    return NextResponse.json({ status: 'success', data: daftarKategori });
  } catch (error) {
    return tanganiGalat(error);
  }
}
