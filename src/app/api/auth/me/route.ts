import { NextRequest, NextResponse } from 'next/server';
import { ambilSesi } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

export async function GET(req: NextRequest) {
  try {
    const sesi = ambilSesi(req);
    return NextResponse.json({
      status: 'success',
      data: sesi,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
