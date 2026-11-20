import bcrypt from 'bcryptjs';

export interface PenggunaDto {
  id: number;
  nama: string;
  username: string;
  email: string;
  peran: string;
  noTelp?: string | null;
}

export class Pengguna {
  #passwordHash: string;

  constructor(
    readonly id: number,
    readonly nama: string,
    readonly username: string,
    readonly email: string,
    passwordHash: string,
    readonly peran: string,
    readonly noTelp?: string | null
  ) {
    this.#passwordHash = passwordHash;
  }

  async verifikasiPassword(passwordTeks: string): Promise<boolean> {
    if (!passwordTeks || !this.#passwordHash) return false;
    return bcrypt.compare(passwordTeks, this.#passwordHash);
  }

  toDto(): PenggunaDto {
    return {
      id: this.id,
      nama: this.nama,
      username: this.username,
      email: this.email,
      peran: this.peran,
      noTelp: this.noTelp,
    };
  }
}
