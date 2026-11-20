import { NextResponse } from 'next/server';
import { AppError } from '../errors/AppError';
import { ZodError } from 'zod';

export function tanganiGalat(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        status: 'error',
        kode: error.kode,
        pesan: error.message,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const pesan = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return NextResponse.json(
      {
        status: 'error',
        kode: 'ERR-VAL-01',
        pesan: `Validasi gagal: ${pesan}`,
      },
      { status: 422 }
    );
  }

  console.error("Unhandled Server Error:", error);
  return NextResponse.json(
    {
      status: 'error',
      kode: 'ERR-SYS-500',
      pesan: 'Terjadi kesalahan internal pada server',
    },
    { status: 500 }
  );
}
