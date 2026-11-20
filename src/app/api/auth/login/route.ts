import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/server/services/AuthService';
import { tanganiGalat } from '@/server/http/tanganiGalat';

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

const authService = new AuthService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { token, user } = await authService.login(parsed.username, parsed.password, ip);

    const res = NextResponse.json({
      status: 'success',
      pesan: 'Login berhasil',
      data: {
        token,
        user,
      },
    });

    // Set cookie session (30 days)
    res.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    return tanganiGalat(error);
  }
}
