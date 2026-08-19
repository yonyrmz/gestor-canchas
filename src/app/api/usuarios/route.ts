import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const where = q
      ? {
          OR: [
            { nombre: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
            { rol: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const usuarios = await prisma.usuario.findMany({
      where,
      select: { id: true, nombre: true, email: true, rol: true, telefono: true, logo: true, servicios: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(usuarios);
  } catch {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nombre, email, password, rol = 'cliente', telefono } = await request.json();
    if (!nombre || !email || !password)
      return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 });

    const exists = await prisma.usuario.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: `El email ${email} ya está registrado` }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({
      data: { nombre, email, password: hashed, rol, telefono },
    });
    return NextResponse.json({ id: user.id, message: 'Usuario creado' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, nombre, email, rol, telefono } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const user = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { nombre, email, rol, telefono },
      select: { id: true, nombre: true, email: true, rol: true, telefono: true, logo: true, servicios: true, createdAt: true },
    });
    return NextResponse.json({ user, message: 'Usuario actualizado' });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const userId = parseInt(id);
    await prisma.notificacion.deleteMany({ where: { usuarioId: userId } });
    await prisma.turno.deleteMany({ where: { usuarioId: userId } });
    await prisma.cancha.deleteMany({ where: { propietarioId: userId } });
    await prisma.usuario.delete({ where: { id: userId } });
    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
