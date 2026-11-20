import { ValidasiError } from '../errors/AppError';

export interface HasilBayar {
  dibayar: number;
  kembalian: number;
}

export abstract class MetodePembayaran {
  abstract readonly nama: string;
  abstract proses(total: number, diterima?: number): HasilBayar;
}

export class PembayaranTunai extends MetodePembayaran {
  override readonly nama = "Tunai";

  override proses(total: number, diterima = 0): HasilBayar {
    if (diterima < total) {
      throw new ValidasiError("ERR-KSR-01", "Uang diterima kurang dari total pembayaran");
    }
    return {
      dibayar: diterima,
      kembalian: diterima - total,
    };
  }
}

export class PembayaranTransfer extends MetodePembayaran {
  override readonly nama = "Transfer Bank";

  override proses(total: number, _diterima?: number): HasilBayar {
    return {
      dibayar: total,
      kembalian: 0,
    };
  }
}

export class PembayaranQris extends MetodePembayaran {
  override readonly nama = "QRIS";

  override proses(total: number, _diterima?: number): HasilBayar {
    return {
      dibayar: total,
      kembalian: 0,
    };
  }
}

export class MetodePembayaranFactory {
  static dari(namaAtauId: string | number): MetodePembayaran {
    const kunci = String(namaAtauId).toLowerCase();
    if (kunci.includes("tunai") || kunci === "1" || kunci === "cash") {
      return new PembayaranTunai();
    }
    if (kunci.includes("transfer") || kunci === "2" || kunci === "bank") {
      return new PembayaranTransfer();
    }
    if (kunci.includes("qris") || kunci === "3") {
      return new PembayaranQris();
    }
    // Default fallback
    return new PembayaranTunai();
  }
}
