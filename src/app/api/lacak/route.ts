import { NextRequest, NextResponse } from 'next/server';
import { PengirimanService } from '@/server/services/PengirimanService';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const pengirimanService = new PengirimanService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const resi = searchParams.get('resi') || '';

    const tracking = await pengirimanService.lacakPublik(resi);

    return NextResponse.json({
      status: 'success',
      data: tracking,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
