import { prisma } from '../db';
import { Prisma } from '@prisma/client';

export class AuditRepository {
  async catat(
    txOrDb: Prisma.TransactionClient | typeof prisma | null,
    jenisAktivitas: string,
    idPengguna?: number | null,
    namaTabel?: string,
    idData?: number,
    dataSebelum?: string,
    dataSesudah?: string,
    deskripsi?: string,
    ip?: string
  ) {
    try {
      const client = txOrDb || prisma;
      await (client as any).auditLog.create({
        data: {
          Id_Pengguna: idPengguna,
          Jenis_Aktivitas: jenisAktivitas,
          Nama_Tabel: namaTabel,
          Id_Data: idData,
          Data_Sebelum: dataSebelum,
          Data_Sesudah: dataSesudah,
          Deskripsi_Aktivitas: deskripsi,
          Alamat_IP: ip ?? '127.0.0.1',
          Status_Aktivitas: 'Berhasil',
        },
      });
    } catch (e) {
      console.error("Gagal mencatat audit log:", e);
    }
  }

  async daftar(filter?: { limit?: number; jenisAktivitas?: string }) {
    const where: Prisma.AuditLogWhereInput = {};
    if (filter?.jenisAktivitas) {
      where.Jenis_Aktivitas = filter.jenisAktivitas;
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { Id_Audit_Log: 'desc' },
      take: filter?.limit || 50,
      include: {
        Pengguna: {
          select: { Id_Pengguna: true, Nama_Pengguna: true, Username: true },
        },
      },
    });
  }
}
