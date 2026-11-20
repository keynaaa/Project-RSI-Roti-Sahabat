export class DetailPesanan {
  constructor(
    readonly idVarian: number,
    readonly jumlah: number,
    readonly hargaSatuan: number,
    readonly namaProduk?: string
  ) {
    if (jumlah <= 0) throw new RangeError("Jumlah pesanan harus lebih dari 0");
    if (hargaSatuan < 0) throw new RangeError("Harga satuan tidak boleh negatif");
  }

  get subtotal(): number {
    return this.jumlah * this.hargaSatuan;
  }
}

export class Pesanan {
  readonly #detail: DetailPesanan[] = [];

  constructor(
    readonly kodePesanan: string,
    readonly idPelanggan: number,
    readonly catatan?: string | null,
    readonly namaPenerima?: string | null,
    readonly alamat?: string | null,
    readonly kota?: string | null,
    readonly biayaPengiriman: number = 0
  ) {}

  tambahItem(item: DetailPesanan): void {
    this.#detail.push(item);
  }

  get detail(): readonly DetailPesanan[] {
    return this.#detail;
  }

  get totalPesanan(): number {
    return this.#detail.reduce((sum, item) => sum + item.subtotal, 0);
  }
}
