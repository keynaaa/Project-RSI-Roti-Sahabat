export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  readonly kode: string;

  constructor(kode: string, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.kode = kode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidasiError extends AppError {
  override readonly statusCode = 422;
  constructor(kode: string, message: string) {
    super(kode, message);
  }
}

export class KonflikError extends AppError {
  override readonly statusCode = 409;
  constructor(kode: string, message: string) {
    super(kode, message);
  }
}

export class TidakDitemukanError extends AppError {
  override readonly statusCode = 404;
  constructor(kode: string, message: string) {
    super(kode, message);
  }
}

export class OtorisasiError extends AppError {
  override readonly statusCode = 403;
  constructor(kode: string = "ERR-ACC-01", message: string = "Akses ditolak") {
    super(kode, message);
  }
}

export class AutentikasiError extends AppError {
  override readonly statusCode = 401;
  constructor(kode: string = "ERR-AUTH-01", message: string = "Username atau password salah") {
    super(kode, message);
  }
}

export class StokTidakCukupError extends AppError {
  override readonly statusCode = 422;
  constructor(idVarian?: number, namaProduk?: string, sisaStok?: number) {
    const detail = namaProduk ? ` untuk ${namaProduk}` : idVarian ? ` (Varian #${idVarian})` : '';
    const infoStok = typeof sisaStok === 'number' ? `. Sisa stok: ${sisaStok}` : '';
    super("ERR-STK-02", `Stok tidak mencukupi${detail}${infoStok}`);
  }
}

export class TransaksiError extends AppError {
  override readonly statusCode = 500;
  constructor(message: string = "Penyimpanan transaksi gagal") {
    super("ERR-TRX-01", message);
  }
}
