import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ProdukService } from '@/server/services/ProdukService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const ubahProdukSchema = z.object({
  namaProduk: z.string().min(1).max(100).optional(),
  idKategori: z.number().int().positive().optional(),
  deskripsi: z.string().max(500).optional(),
  foto: z.string().optional(),
  berat: z.number().positive().optional(),
});

const produkService = new ProdukService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    cekPeran(req, ['Owner', 'Staff']);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const hasil = await produkService.ambilDetail(id);
    return NextResponse.json({ status: 'success', data: hasil });
  } catch (error) {
    return tanganiGalat(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesi = cekPeran(req, ['Owner', 'Staff']);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const body = await req.json();
    const parsed = ubahProdukSchema.parse(body);

    const hasil = await produkService.ubahProduk(id, parsed, sesi);

    return NextResponse.json({
      status: 'success',
      pesan: 'Data produk berhasil diperbarui',
      data: hasil,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesi = cekPeran(req, ['Owner']);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const hasil = await produkService.hapusProduk(id, sesi);

    return NextResponse.json({
      status: 'success',
      pesan: hasil.message,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
