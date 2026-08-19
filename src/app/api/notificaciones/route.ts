import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuario_id');
    if (!usuarioId) return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 });

    const id = parseInt(usuarioId);

    const notificaciones = await prisma.notificacion.findMany({
      where: { usuarioId: id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const noLeidas = await prisma.notificacion.count({
      where: { usuarioId: id, leida: false }
    });

    return NextResponse.json({ notificaciones, noLeidas });
  } catch { return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, usuario_id, marcarTodas } = await request.json();

    if (marcarTodas && usuario_id) {
      await prisma.notificacion.updateMany({
        where: { usuarioId: usuario_id, leida: false },
        data: { leida: true }
      });
    } else if (id) {
      await prisma.notificacion.update({
        where: { id },
        data: { leida: true }
      });
    }

    return NextResponse.json({ message: 'Notificaciones actualizadas' });
  } catch { return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 }); }
}
