import { NextRequest, NextResponse } from 'next/server';
import { ProdukService } from '@/server/services/ProdukService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const produkService = new ProdukService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const riwayat = await produkService.ambilRiwayatHarga(id);

    return NextResponse.json({
      status: 'success',
      data: riwayat,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
