import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ProdukService } from '@/server/services/ProdukService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const tambahProdukSchema = z.object({
  namaProduk: z.string().min(1, 'Nama produk wajib diisi').max(100),
  idKategori: z.number().int().positive(),
  harga: z.number().positive('Harga jual harus lebih dari 0'),
  stokAwal: z.number().int().min(0, 'Stok awal tidak boleh negatif'),
  deskripsi: z.string().max(500).optional(),
  foto: z.string().optional(),
  berat: z.number().positive().optional(),
});

const produkService = new ProdukService();

export async function GET(req: NextRequest) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const kategori = searchParams.get('kategori') || '';
    const halaman = parseInt(searchParams.get('halaman') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

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

export async function POST(req: NextRequest) {
  try {
    const sesi = cekPeran(req, ['Owner', 'Staff']);
    const body = await req.json();
    const parsed = tambahProdukSchema.parse(body);

    const baru = await produkService.tambahProduk(parsed, sesi);

    return NextResponse.json(
      {
        status: 'success',
        pesan: 'Produk berhasil ditambahkan',
        data: baru,
      },
      { status: 201 }
    );
  } catch (error) {
    return tanganiGalat(error);
  }
}
