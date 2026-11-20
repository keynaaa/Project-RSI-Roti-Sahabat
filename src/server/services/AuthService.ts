import jwt from 'jsonwebtoken';
import { PenggunaRepository } from '../repositories/PenggunaRepository';
import { AuditRepository } from '../repositories/AuditRepository';
import { AutentikasiError } from '../errors/AppError';
import { Pengguna, PenggunaDto } from '../domain/Pengguna';

const JWT_SECRET = process.env.AUTH_SECRET || 'rotisahabat_super_secret_jwt_key_2026_kebumen';

export interface SesiPengguna {
  id: number;
  nama: string;
  username: string;
  email: string;
  peran: string;
}

export class AuthService {
  constructor(
    private readonly penggunaRepo: PenggunaRepository = new PenggunaRepository(),
    private readonly auditRepo: AuditRepository = new AuditRepository()
  ) {}

  async login(username: string, passwordPlain: string, ip?: string): Promise<{ token: string; user: PenggunaDto }> {
    const dataPengguna = await this.penggunaRepo.cariBerdasarkanUsername(username);
    if (!dataPengguna || !dataPengguna.Status_Aktif) {
      await this.auditRepo.catat(null as any, 'LOGIN_FAILED', null, 'PENGGUNA', undefined, undefined, undefined, `Login gagal: username ${username} tidak ditemukan`, ip);
      throw new AutentikasiError("ERR-AUTH-01", "Username atau password salah");
    }

    const peranUtama = dataPengguna.Peran[0]?.Nama_Peran || 'Staff';
    const pengguna = new Pengguna(
      dataPengguna.Id_Pengguna,
      dataPengguna.Nama_Pengguna,
      dataPengguna.Username,
      dataPengguna.Email,
      dataPengguna.Password_Hash,
      peranUtama,
      dataPengguna.No_Telp
    );

    const valid = await pengguna.verifikasiPassword(passwordPlain);
    if (!valid) {
      await this.auditRepo.catat(null as any, 'LOGIN_FAILED', dataPengguna.Id_Pengguna, 'PENGGUNA', undefined, undefined, undefined, `Login gagal: password salah untuk ${username}`, ip);
      throw new AutentikasiError("ERR-AUTH-01", "Username atau password salah");
    }

    // Catat login berhasil
    await this.auditRepo.catat(null as any, 'LOGIN_SUCCESS', dataPengguna.Id_Pengguna, 'PENGGUNA', undefined, undefined, undefined, `Login berhasil: ${username}`, ip);

    const payload: SesiPengguna = {
      id: pengguna.id,
      nama: pengguna.nama,
      username: pengguna.username,
      email: pengguna.email,
      peran: pengguna.peran,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    return {
      token,
      user: pengguna.toDto(),
    };
  }

  verifikasiToken(token: string): SesiPengguna {
    try {
      return jwt.verify(token, JWT_SECRET) as SesiPengguna;
    } catch {
      throw new AutentikasiError("ERR-AUTH-03", "Sesi tidak valid atau telah kedaluwarsa");
    }
  }
}
