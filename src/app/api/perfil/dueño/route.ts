import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuario_id');
    if (!usuarioId) return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 });

    const user = await prisma.usuario.findUnique({
      where: { id: parseInt(usuarioId) },
      select: { id: true, nombre: true, email: true, telefono: true, logo: true, servicios: true },
    });
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    return NextResponse.json({ perfil: user });
  } catch { return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const { usuario_id, logo, servicios } = await request.json();
    if (!usuario_id) return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 });

    const data: { logo?: string; servicios?: string } = {};
    if (logo !== undefined) data.logo = logo;
    if (servicios !== undefined) data.servicios = servicios;
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });

    const user = await prisma.usuario.update({
      where: { id: usuario_id },
      data,
      select: { id: true, nombre: true, email: true, telefono: true, logo: true, servicios: true },
    });
    return NextResponse.json({ perfil: user, message: 'Perfil actualizado' });
  } catch { return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 }); }
}
