import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const session = JSON.parse(sessionCookie.value);
    const user = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { id: true, nombre: true, email: true, rol: true, telefono: true, logo: true, servicios: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    return NextResponse.json({ user });
  } catch { return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 }); }
}
