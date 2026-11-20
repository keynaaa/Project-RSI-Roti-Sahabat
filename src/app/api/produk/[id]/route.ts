import { NextRequest, NextResponse } from 'next/server';
import { ProdukService } from '@/server/services/ProdukService';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const produkService = new ProdukService();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const detail = await produkService.ambilDetail(id);

    return NextResponse.json({
      status: 'success',
      data: detail,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
