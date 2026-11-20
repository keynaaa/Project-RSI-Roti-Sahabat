import { NextRequest, NextResponse } from 'next/server';
import { AuditRepository } from '@/server/repositories/AuditRepository';
import { cekPeran } from '@/server/http/authMiddleware';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const auditRepo = new AuditRepository();

export async function GET(req: NextRequest) {
  try {
    // Only Owner is authorized (PRD section 5 & SCR-17)
    cekPeran(req, ['Owner']);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const aksi = searchParams.get('aksi') || undefined;

    const logs = await auditRepo.daftar({ limit, jenisAktivitas: aksi });

    const mapped = logs.map((l: any) => ({
      idAudit: l.Id_Audit_Log,
      waktu: l.Tanggal_Aktivitas,
      pengguna: l.Pengguna?.Nama_Pengguna ?? 'Sistem/Tamu',
      jenisAktivitas: l.Jenis_Aktivitas,
      namaTabel: l.Nama_Tabel,
      idData: l.Id_Data,
      deskripsi: l.Deskripsi_Aktivitas,
      ip: l.Alamat_IP,
      status: l.Status_Aktivitas,
    }));

    return NextResponse.json({
      status: 'success',
      data: mapped,
    });
  } catch (error) {
    return tanganiGalat(error);
  }
}
