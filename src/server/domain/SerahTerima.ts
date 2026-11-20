import { ValidasiError } from '../errors/AppError';

export interface DataPenerima {
  nama: string;
  telepon: string;
  alamat: string;
  kota: string;
  ongkir?: number;
  idKurir?: number;
}

export abstract class SerahTerima {
  abstract readonly jenis: "AmbilDiToko" | "Kirim";
  abstract validasi(): void;
}

export class AmbilDiToko extends SerahTerima {
  override readonly jenis = "AmbilDiToko";

  override validasi(): void {
    // Tidak memerlukan data alamat
  }
}

export class KirimKurir extends SerahTerima {
  override readonly jenis = "Kirim";

  constructor(readonly penerima: DataPenerima) {
    super();
  }

  override validasi(): void {
    if (
      !this.penerima.nama?.trim() ||
      !this.penerima.telepon?.trim() ||
      !this.penerima.alamat?.trim() ||
      !this.penerima.kota?.trim()
    ) {
      throw new ValidasiError(
        "ERR-SHP-01",
        "Lengkapi data penerima untuk pengiriman (nama, telepon, alamat, dan kota)"
      );
    }
  }
}
