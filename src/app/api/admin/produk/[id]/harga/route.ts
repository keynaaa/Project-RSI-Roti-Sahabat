import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ProdukService } from '@/server/services/ProdukService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const ubahHargaSchema = z.object({
  hargaBaru: z.number().positive('Harga baru harus lebih dari 0'),
});

const produkService = new ProdukService();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesi = cekPeran(req, ['Owner', 'Staff']);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const body = await req.json();
    const parsed = ubahHargaSchema.parse(body);

    const hasil = await produkService.ubahHarga(id, parsed.hargaBaru, sesi);

    return NextResponse.json({
      status: 'success',
      pesan: 'Harga produk berhasil diperbarui dan dicatat ke riwayat',
      data: hasil,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
