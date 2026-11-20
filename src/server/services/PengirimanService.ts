import { prisma } from '../db';
import { PengirimanRepository } from '../repositories/PengirimanRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { SesiPengguna } from './AuthService';
import { TidakDitemukanError, ValidasiError } from '../errors/AppError';
import { Pengiriman, StatusPengiriman } from '../domain/Pengiriman';

export class PengirimanService {
  constructor(
    private readonly pengirimanRepo: PengirimanRepository = new PengirimanRepository(),
    private readonly auditRepo: AuditRepository = new AuditRepository()
  ) {}

  async lacakPublik(nomorResi: string) {
    if (!nomorResi?.trim()) {
      throw new ValidasiError("ERR-SHP-02", "Nomor resi wajib diisi");
    }

    const pengiriman = await this.pengirimanRepo.lacak(nomorResi.trim());
    if (!pengiriman) {
      throw new TidakDitemukanError("ERR-SHP-02", "Nomor resi tidak ditemukan");
    }

    // Mask sensitive info: e.g. "Alya" -> "A***"
    const namaMasked = pengiriman.Nama_Penerima
      ? pengiriman.Nama_Penerima[0] + '***'
      : 'Pelanggan';

    // Kota tujuan saja
    const kotaTujuan = pengiriman.Alamat_Tujuan?.split(',').pop()?.trim() ?? 'Kebumen';

    return {
      nomorResi: pengiriman.Nomor_Resi,
      kurir: pengiriman.Kurir?.Nama_Kurir ?? 'Kurir Internal',
      status: pengiriman.Status_Pengiriman,
      tanggalKirim: pengiriman.Tanggal_Pengiriman,
      tanggalEstimasi: pengiriman.Tanggal_Estimasi,
      tanggalDiterima: pengiriman.Tanggal_Diterima,
      namaPenerima: namaMasked,
      kotaTujuan: kotaTujuan,
      catatanDummy: 'Data kurir dan pengiriman adalah data contoh',
    };
  }

  async daftar(filter?: { status?: string; cari?: string }) {
    return this.pengirimanRepo.daftar(filter);
  }

  async perbaruiStatus(idPengiriman: number, statusBaru: StatusPengiriman, pengguna: SesiPengguna) {
    const raw = await prisma.pengiriman.findUnique({
      where: { Id_Pengiriman: idPengiriman },
      include: { Kurir: true },
    });

    if (!raw) {
      throw new TidakDitemukanError("ERR-SHP-02", "Pengiriman tidak ditemukan");
    }

    // Gunakan entity domain untuk validasi perpindahan status (Diproses -> Dikirim -> Terkirim)
    const domain = new Pengiriman(
      raw.Id_Pengiriman,
      raw.Nomor_Resi || '',
      raw.Status_Pengiriman as StatusPengiriman,
      raw.Id_Pesanan,
      raw.Id_Kurir,
      raw.Kurir?.Nama_Kurir,
      raw.Nama_Penerima,
      raw.Alamat_Tujuan,
      Number(raw.Biaya_Pengiriman),
      raw.Tanggal_Estimasi,
      raw.Tanggal_Diterima
    );

    domain.pindahKe(statusBaru);

    const hasil = await prisma.$transaction(async (tx) => {
      const updated = await this.pengirimanRepo.updateStatus(
        tx,
        idPengiriman,
        domain.status,
        domain.tanggalDiterima ?? undefined
      );

      await this.auditRepo.catat(
        tx,
        'SHIPPING_STATUS_UPDATED',
        pengguna.id,
        'PENGIRIMAN',
        idPengiriman,
        JSON.stringify({ status: raw.Status_Pengiriman }),
        JSON.stringify({ status: domain.status }),
        `Status pengiriman resi ${raw.Nomor_Resi} diubah menjadi ${domain.status}`
      );

      return updated;
    });

    return hasil;
  }

  async buatPesanWaResi(idPengiriman: number) {
    const pengiriman = await prisma.pengiriman.findUnique({
      where: { Id_Pengiriman: idPengiriman },
      include: {
        Pesanan: {
          include: { Pelanggan: true },
        },
        Kurir: true,
      },
    });

    if (!pengiriman) {
      throw new TidakDitemukanError("ERR-SHP-02", "Pengiriman tidak ditemukan");
    }

    const noTelp = pengiriman.Pesanan?.Pelanggan?.No_Telp || '';
    const resi = pengiriman.Nomor_Resi;
    const kurir = pengiriman.Kurir?.Nama_Kurir || 'Kurir Internal';
    const status = pengiriman.Status_Pengiriman;

    const pesan =
      `Halo Kak ${pengiriman.Nama_Penerima || 'Pelanggan'},\n` +
      `Pesanan Anda sedang dalam status: *${status}* menggunakan ${kurir}.\n` +
      `Nomor Resi: *${resi}*\n` +
      `Anda dapat melacak status pesanan secara langsung melalui tautan:\n` +
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/lacak?resi=${resi}\n\n` +
      `Terima kasih telah berbelanja di Roti Sahabat!`;

    const cleanPhone = noTelp.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const waUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(pesan)}`;

    return { waUrl, pesan, noTelp: phoneWithCountry };
  }
}
