import { NextRequest } from 'next/server';
import { AuthService, SesiPengguna } from '../services/AuthService';
import { AutentikasiError, OtorisasiError } from '../errors/AppError';

const authService = new AuthService();

export function ambilSesi(req: NextRequest): SesiPengguna {
  const authHeader = req.headers.get('authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Check cookie 'session_token'
    const cookieToken = req.cookies.get('session_token')?.value;
    if (cookieToken) token = cookieToken;
  }

  if (!token) {
    throw new AutentikasiError('ERR-AUTH-03', 'Akses ditolak: Silakan login terlebih dahulu');
  }

  return authService.verifikasiToken(token);
}

export function cekPeran(req: NextRequest, peranDiizinkan: string[]): SesiPengguna {
  const sesi = ambilSesi(req);
  const peranUser = sesi.peran.toLowerCase();

  const isAllowed = peranDiizinkan.some((p) => {
    const roleLower = p.toLowerCase();
    if (roleLower === 'owner' && (peranUser.includes('owner') || peranUser.includes('super admin'))) return true;
    if (roleLower === 'staff' && (peranUser.includes('staff') || peranUser.includes('operasional') || peranUser.includes('admin'))) return true;
    return peranUser === roleLower;
  });

  if (!isAllowed) {
    throw new OtorisasiError('ERR-ACC-01', 'Akses ditolak: Peran Anda tidak memiliki izin');
  }

  return sesi;
}
