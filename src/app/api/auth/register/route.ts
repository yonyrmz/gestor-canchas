import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { nombre, email, password, telefono } = await request.json();
    if (!nombre || !email || !password) return NextResponse.json({ error: 'Nombre, email y password son requeridos' }, { status: 400 });

    const existing = await prisma.usuario.findFirst({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({
      data: { nombre, email, password: hashed, rol: 'cliente', telefono: telefono || null },
      select: { id: true, nombre: true, email: true, rol: true, telefono: true, logo: true, servicios: true, createdAt: true },
    });

    const res = NextResponse.json({ user, message: 'Usuario registrado' }, { status: 201 });
    res.cookies.set('session', JSON.stringify({ userId: user.id, rol: user.rol }), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800, path: '/' });
    return res;
  } catch { return NextResponse.json({ error: 'Error al registrar' }, { status: 500 }); }
}
