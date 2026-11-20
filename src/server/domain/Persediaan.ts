import { StokTidakCukupError } from '../errors/AppError';

export class Persediaan {
  #stokTersedia: number;
  #jumlahStok: number;

  constructor(
    readonly idPersediaan: number,
    readonly idVarian: number,
    tersedia: number,
    jumlah: number,
    readonly stokMinimum: number = 0
  ) {
    this.#stokTersedia = Math.max(0, Math.floor(tersedia));
    this.#jumlahStok = Math.max(0, Math.floor(jumlah));
  }

  get stokTersedia(): number {
    return this.#stokTersedia;
  }

  get jumlahStok(): number {
    return this.#jumlahStok;
  }

  get menipis(): boolean {
    return this.#stokTersedia <= this.stokMinimum;
  }

  kurangi(qty: number, namaProduk?: string): void {
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new RangeError("Jumlah pengurangan harus bilangan bulat positif");
    }
    if (qty > this.#stokTersedia) {
      throw new StokTidakCukupError(this.idVarian, namaProduk, this.#stokTersedia);
    }
    this.#stokTersedia -= qty;
    this.#jumlahStok -= qty;
  }

  tambah(qty: number): void {
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new RangeError("Jumlah penambahan harus bilangan bulat positif");
    }
    this.#stokTersedia += qty;
    this.#jumlahStok += qty;
  }

  koreksi(stokBaru: number): void {
    if (!Number.isInteger(stokBaru) || stokBaru < 0) {
      throw new RangeError("Nilai koreksi stok tidak boleh minus");
    }
    this.#stokTersedia = stokBaru;
    this.#jumlahStok = stokBaru;
  }
}
