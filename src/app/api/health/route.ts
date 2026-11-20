import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'Katalog Digital dan Kasir Toko Roti Sahabat',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
  });
}
