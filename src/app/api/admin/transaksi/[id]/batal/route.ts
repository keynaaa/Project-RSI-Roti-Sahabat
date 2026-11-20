import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TransaksiService } from '@/server/services/TransaksiService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const batalSchema = z.object({
  alasan: z.string().min(3, 'Alasan pembatalan minimal 3 karakter').max(255),
});

const transaksiService = new TransaksiService();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesi = cekPeran(req, ['Owner']);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const body = await req.json();
    const parsed = batalSchema.parse(body);

    const hasil = await transaksiService.batalkanTransaksi(id, parsed.alasan, sesi);

    return NextResponse.json({
      status: 'success',
      pesan: hasil.message,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
