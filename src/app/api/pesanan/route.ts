import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PesananService } from '@/server/services/PesananService';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const buatPesananSchema = z.object({
  items: z.array(
    z.object({
      idVarian: z.number().int().positive(),
      qty: z.number().int().positive(),
    })
  ).min(1, 'Daftar item tidak boleh kosong'),
  metode: z.enum(['AmbilDiToko', 'Kirim']),
  namaPenerima: z.string().optional(),
  telepon: z.string().optional(),
  alamat: z.string().optional(),
  kota: z.string().optional(),
  catatan: z.string().max(500).optional(),
});

const pesananService = new PesananService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = buatPesananSchema.parse(body);

    const hasil = await pesananService.buatPesanan(parsed);

    return NextResponse.json(
      {
        status: 'success',
        pesan: 'Pesanan berhasil dibuat',
        data: hasil,
      },
      { status: 201 }
    );
  } catch (error) {
    return tanganiGalat(error);
  }
}
