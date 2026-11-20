import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

export async function GET(req: NextRequest) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const list = await prisma.kurir.findMany({
      orderBy: { Id_Kurir: 'asc' },
    });

    return NextResponse.json({
      status: 'success',
      data: list.map((k) => ({
        idKurir: k.Id_Kurir,
        namaKurir: k.Nama_Kurir,
        jenisKurir: k.Jenis_Kurir,
        telepon: k.No_Telp,
        perusahaan: k.Nama_Perusahaan,
        isDummy: true,
      })),
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
