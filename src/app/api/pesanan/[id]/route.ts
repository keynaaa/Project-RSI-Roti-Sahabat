import { NextRequest, NextResponse } from 'next/server';
import { PesananService } from '@/server/services/PesananService';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const pesananService = new PesananService();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const ringkasan = await pesananService.ambilRingkasan(id);

    return NextResponse.json({
      status: 'success',
      data: ringkasan,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
