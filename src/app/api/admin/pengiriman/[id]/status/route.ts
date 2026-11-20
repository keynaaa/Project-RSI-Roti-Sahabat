import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PengirimanService } from '@/server/services/PengirimanService';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const statusSchema = z.object({
  status: z.enum(['Diproses', 'Dikirim', 'Terkirim', 'Dibatalkan']),
});

const pengirimanService = new PengirimanService();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sesi = cekPeran(req, ['Owner', 'Staff']);
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const body = await req.json();
    const parsed = statusSchema.parse(body);

    const hasil = await pengirimanService.perbaruiStatus(id, parsed.status, sesi);

    return NextResponse.json({
      status: 'success',
      pesan: `Status pengiriman berhasil diperbarui ke ${parsed.status}`,
      data: {
        idPengiriman: hasil.Id_Pengiriman,
        status: hasil.Status_Pengiriman,
        tanggalDiterima: hasil.Tanggal_Diterima,
      },
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
