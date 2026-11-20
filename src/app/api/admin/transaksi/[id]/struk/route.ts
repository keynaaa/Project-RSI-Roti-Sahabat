import { NextRequest, NextResponse } from 'next/server';
import { StrukService } from '@/server/services/StrukService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const strukService = new StrukService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const struk = await strukService.buat(id);

    return NextResponse.json({
      status: 'success',
      data: struk,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
