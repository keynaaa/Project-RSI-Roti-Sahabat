import { NextRequest, NextResponse } from 'next/server';
import { ProdukService } from '@/server/services/ProdukService';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const produkService = new ProdukService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const kategori = searchParams.get('kategori') || '';
    const halaman = parseInt(searchParams.get('halaman') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const hasil = await produkService.ambilKatalog({
      cari: q,
      kategori,
      halaman,
      limit,
    });

    return NextResponse.json({
      status: 'success',
      data: hasil,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
