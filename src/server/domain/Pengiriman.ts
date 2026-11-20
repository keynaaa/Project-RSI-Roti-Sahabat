import { KonflikError } from '../errors/AppError';

export type StatusPengiriman = 'Diproses' | 'Dikirim' | 'Terkirim' | 'Dibatalkan';

export class Pengiriman {
  #status: StatusPengiriman;

  constructor(
    readonly idPengiriman: number,
    readonly nomorResi: string,
    statusAwal: StatusPengiriman,
    readonly idPesanan?: number | null,
    readonly idKurir?: number | null,
    readonly namaKurir?: string | null,
    readonly namaPenerima?: string | null,
    readonly alamatTujuan?: string | null,
    readonly biayaPengiriman: number = 0,
    readonly tanggalEstimasi?: Date | null,
    public tanggalDiterima?: Date | null
  ) {
    this.#status = statusAwal;
  }

  get status(): StatusPengiriman {
    return this.#status;
  }

  pindahKe(statusBaru: StatusPengiriman): void {
    if (this.#status === statusBaru) return;

    if (statusBaru === 'Dibatalkan') {
      this.#status = 'Dibatalkan';
      return;
    }

    if (this.#status === 'Diproses' && statusBaru === 'Dikirim') {
      this.#status = 'Dikirim';
      return;
    }

    if (this.#status === 'Dikirim' && statusBaru === 'Terkirim') {
      this.#status = 'Terkirim';
      this.tanggalDiterima = new Date();
      return;
    }

    throw new KonflikError(
      'ERR-SHP-03',
      `Status pengiriman tidak dapat diubah dari ${this.#status} ke ${statusBaru}`
    );
  }
}
