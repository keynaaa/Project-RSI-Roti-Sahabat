import { Diskon, TanpaDiskon } from './Diskon';
import { Pengguna } from './Pengguna';

export class DetailPenjualan {
  constructor(
    readonly idVarian: number,
    readonly jumlah: number,
    readonly hargaSatuan: number,
    readonly diskonItem: number = 0,
    readonly namaProduk?: string
  ) {
    if (jumlah <= 0) throw new RangeError("Jumlah item harus lebih dari 0");
    if (hargaSatuan < 0) throw new RangeError("Harga satuan tidak boleh negatif");
  }

  get subtotal(): number {
    return Math.max(0, this.jumlah * this.hargaSatuan - this.diskonItem);
  }
}

export class Penjualan {
  readonly #detail: DetailPenjualan[] = [];
  #diskon: Diskon = new TanpaDiskon();
  #ongkir: number = 0;

  constructor(
    readonly kodePenjualan: string,
    readonly kasir: Pengguna,
    readonly idPesanan?: number | null,
    readonly idPelanggan?: number | null
  ) {}

  tambahItem(item: DetailPenjualan): void {
    this.#detail.push(item);
  }

  terapkanDiskon(diskon: Diskon): void {
    diskon.validasi(this.subtotal);
    this.#diskon = diskon;
  }

  setOngkir(nominal: number): void {
    this.#ongkir = Math.max(0, nominal);
  }

  get detail(): readonly DetailPenjualan[] {
    return this.#detail;
  }

  get subtotal(): number {
    return this.#detail.reduce((sum, item) => sum + item.subtotal, 0);
  }

  get nilaiDiskon(): number {
    return this.#diskon.hitung(this.subtotal);
  }

  get ongkir(): number {
    return this.#ongkir;
  }

  get total(): number {
    return Math.max(0, this.subtotal - this.nilaiDiskon + this.#ongkir);
  }
}
