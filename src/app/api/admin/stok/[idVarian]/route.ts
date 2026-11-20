import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { PersediaanRepository } from '@/server/repositories/PersediaanRepository';
import { AuditRepository } from '@/server/repositories/AuditRepository';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';
import { TidakDitemukanError } from '@/server/errors/AppError';

const koreksiStokSchema = z.object({
  stokBaru: z.number().int().min(0, 'Stok tidak boleh minus'),
  keterangan: z.string().max(255).optional(),
});

const persediaanRepo = new PersediaanRepository();
const auditRepo = new AuditRepository();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ idVarian: string }> }
) {
  try {
    const sesi = cekPeran(req, ['Owner', 'Staff']);
    const { idVarian: idVarianStr } = await params;
    const idVarian = parseInt(idVarianStr, 10);
    const body = await req.json();
    const parsed = koreksiStokSchema.parse(body);

    const defaultCabangId = Number(process.env.DEFAULT_CABANG_ID) || 1;

    const persediaan = await persediaanRepo.ambilBerdasarkanVarian(idVarian);
    if (!persediaan) {
      throw new TidakDitemukanError("ERR-PRD-02", "Persediaan varian tidak ditemukan");
    }

    const stokSebelum = Number(persediaan.Stok_Tersedia);
    const stokSesudah = parsed.stokBaru;

    await prisma.$transaction(async (tx) => {
      await persediaanRepo.koreksi(tx, idVarian, parsed.stokBaru);

      await tx.riwayatStok.create({
        data: {
          Id_Persediaan: persediaan.Id_Persediaan,
          Id_Cabang: defaultCabangId,
          Jenis_Transaksi: 'Penyesuaian',
          Jenis_Perubahan: stokSesudah >= stokSebelum ? 'Masuk' : 'Keluar',
          Stok_Sebelum: stokSebelum,
          Stok_Sesudah: stokSesudah,
          Keterangan: parsed.keterangan ?? `Penyesuaian manual oleh ${sesi.nama}`,
        },
      });

      await auditRepo.catat(
        tx,
        'STOCK_ADJUSTED',
        sesi.id,
        'PERSEDIAAN',
        persediaan.Id_Persediaan,
        JSON.stringify({ stok: stokSebelum }),
        JSON.stringify({ stok: stokSesudah }),
        `Koreksi stok varian #${idVarian} (${persediaan.VarianProduk?.Produk?.Nama_Produk}): ${stokSebelum} -> ${stokSesudah}`
      );
    });

    return NextResponse.json({
      status: 'success',
      pesan: 'Stok berhasil disesuaikan',
      data: {
        idVarian,
        stokSebelum,
        stokSesudah,
      },
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
