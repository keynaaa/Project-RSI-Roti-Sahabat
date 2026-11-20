export interface ItemRekapProduk {
  idProduk: number;
  namaProduk: string;
  jumlahTerjual: number;
  totalPenjualan: number;
}

export class LaporanPenjualan {
  constructor(
    readonly periodeAwal: Date | null,
    readonly periodeAkhir: Date | null,
    readonly daftarPenjualan: readonly {
      idPenjualan: number;
      kodePenjualan: string;
      totalPenjualan: number;
      subtotal: number;
      diskon: number;
      biayaLain: number;
      tanggal: Date;
    }[],
    readonly rincianProduk: readonly ItemRekapProduk[] = []
  ) {}

  get jumlahTransaksi(): number {
    return this.daftarPenjualan.length;
  }

  get totalPenjualan(): number {
    return this.daftarPenjualan.reduce((sum, p) => sum + p.totalPenjualan, 0);
  }

  get totalPenjualanBarang(): number {
    return this.daftarPenjualan.reduce((sum, p) => sum + (p.totalPenjualan - p.biayaLain), 0);
  }

  toDto() {
    return {
      jumlahTransaksi: this.jumlahTransaksi,
      totalPenjualan: this.totalPenjualan,
      totalPenjualanBarang: this.totalPenjualanBarang,
      rincianProduk: this.rincianProduk,
      daftarTransaksi: this.daftarPenjualan,
    };
  }
}
