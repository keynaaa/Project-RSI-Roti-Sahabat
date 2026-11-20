import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({
    status: 'success',
    pesan: 'Logout berhasil',
  });

  res.cookies.delete('session_token');
  return res;
}
