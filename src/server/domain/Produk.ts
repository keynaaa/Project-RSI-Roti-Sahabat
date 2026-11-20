export class VarianProduk {
  constructor(
    readonly idVarian: number,
    readonly idProduk: number,
    readonly namaVarian: string,
    public hargaAktif: number,
    public barcode?: string | null,
    public statusAktif: boolean = true
  ) {}
}

export class Produk {
  readonly #varian: VarianProduk[] = [];

  constructor(
    readonly idProduk: number,
    public namaProduk: string,
    public idKategori: number | null,
    public harga: number,
    public deskripsi?: string | null,
    public fotoProduk?: string | null,
    public statusProduk: string = 'Aktif'
  ) {}

  tambahVarian(varian: VarianProduk): void {
    this.#varian.push(varian);
  }

  get varian(): readonly VarianProduk[] {
    return this.#varian;
  }

  nonaktifkan(): void {
    this.statusProduk = 'Nonaktif';
    for (const v of this.#varian) {
      v.statusAktif = false;
    }
  }
}
