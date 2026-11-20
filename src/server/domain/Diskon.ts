import { ValidasiError } from '../errors/AppError';

export abstract class Diskon {
  abstract hitung(subtotal: number): number;

  validasi(subtotal: number): void {
    const nilai = this.hitung(subtotal);
    if (nilai < 0 || nilai > subtotal) {
      throw new ValidasiError("ERR-KSR-02", "Diskon tidak valid (tidak boleh negatif atau melebihi subtotal)");
    }
  }
}

export class TanpaDiskon extends Diskon {
  override hitung(_subtotal: number): number {
    return 0;
  }
}

export class DiskonNominal extends Diskon {
  constructor(private readonly nominal: number) {
    super();
  }

  override hitung(_subtotal: number): number {
    return Math.max(0, this.nominal);
  }

  override validasi(subtotal: number): void {
    if (this.nominal < 0 || this.nominal > subtotal) {
      throw new ValidasiError("ERR-KSR-02", "Diskon nominal tidak boleh negatif atau melebihi subtotal");
    }
    super.validasi(subtotal);
  }
}

export class DiskonPersen extends Diskon {
  constructor(private readonly persen: number) {
    super();
  }

  override hitung(subtotal: number): number {
    return Math.round((subtotal * this.persen) / 100);
  }

  override validasi(subtotal: number): void {
    if (this.persen < 0 || this.persen > 100) {
      throw new ValidasiError("ERR-KSR-02", "Diskon persen harus berada di antara 0 dan 100");
    }
    super.validasi(subtotal);
  }
}
