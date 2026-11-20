import { NextRequest, NextResponse } from 'next/server';
import { PengirimanService } from '@/server/services/PengirimanService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const pengirimanService = new PengirimanService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const info = await pengirimanService.buatPesanWaResi(id);

    return NextResponse.json({
      status: 'success',
      data: info,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
