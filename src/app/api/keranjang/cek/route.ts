import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PesananService } from '@/server/services/PesananService';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const cekKeranjangSchema = z.object({
  items: z.array(
    z.object({
      idVarian: z.number().int().positive(),
      qty: z.number().int().positive(),
    })
  ).min(1, 'Keranjang tidak boleh kosong'),
});

const pesananService = new PesananService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cekKeranjangSchema.parse(body);

    const hasil = await pesananService.cekKeranjang(parsed.items);

    return NextResponse.json({
      status: 'success',
      data: hasil,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
