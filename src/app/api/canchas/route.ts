import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propietarioId = searchParams.get('propietario_id');
    const where = propietarioId ? { propietarioId: parseInt(propietarioId) } : {};
    const canchas = await prisma.cancha.findMany({
      where,
      include: { propietario: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(canchas);
  } catch {
    return NextResponse.json({ error: 'Error al obtener canchas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nombre, tipo, precio_por_hora, disponible = true, descripcion, fotos, ubicacion, propietario_id } =
      await request.json();
    if (!nombre || !tipo || !precio_por_hora)
      return NextResponse.json({ error: 'Nombre, tipo y precio son requeridos' }, { status: 400 });

    const cancha = await prisma.cancha.create({
      data: {
        nombre,
        tipo,
        precioPorHora: precio_por_hora,
        disponible,
        descripcion,
        fotos,
        ubicacion,
        propietario: { connect: { id: propietario_id || 1 } },
      },
      include: { propietario: true },
    });
    return NextResponse.json({ cancha, message: 'Cancha creada' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear cancha' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, nombre, tipo, precio_por_hora, disponible, descripcion, fotos, ubicacion } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (tipo !== undefined) data.tipo = tipo;
    if (precio_por_hora !== undefined) data.precioPorHora = precio_por_hora;
    if (disponible !== undefined) data.disponible = disponible;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (fotos !== undefined) data.fotos = fotos;
    if (ubicacion !== undefined) data.ubicacion = ubicacion;

    const cancha = await prisma.cancha.update({
      where: { id: parseInt(id) },
      data,
      include: { propietario: true },
    });
    return NextResponse.json({ cancha, message: 'Cancha actualizada' });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar cancha' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await prisma.cancha.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Cancha eliminada' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar cancha' }, { status: 500 });
  }
}
