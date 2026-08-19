import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 });

    const user = await prisma.usuario.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });

    const { password: _, ...userWithoutPassword } = user;
    const res = NextResponse.json({ user: userWithoutPassword });
    res.cookies.set('session', JSON.stringify({ userId: user.id, rol: user.rol }), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800, path: '/' });
    return res;
  } catch { return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 }); }
}
