import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const canchaId = searchParams.get('cancha_id');
    const where = canchaId ? { canchaId: parseInt(canchaId) } : {};
    const horarios = await prisma.horario.findMany({ where });
    return NextResponse.json(horarios);
  } catch {
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cancha_id, dia_semana, hora_apertura = '08:00', hora_cierre = '22:00', activo = true, horarios } = body;

    if (Array.isArray(horarios)) {
      await prisma.horario.createMany({
        data: horarios.map((h: { cancha_id: number; dia_semana: number; hora_apertura?: string; hora_cierre?: string; activo?: boolean }) => ({
          canchaId: h.cancha_id,
          diaSemana: h.dia_semana,
          horaApertura: h.hora_apertura || '08:00',
          horaCierre: h.hora_cierre || '22:00',
          activo: h.activo ?? true,
        })),
      });
      return NextResponse.json({ message: 'Horarios creados' }, { status: 201 });
    }

    if (!cancha_id || dia_semana === undefined)
      return NextResponse.json({ error: 'cancha_id y dia_semana requeridos' }, { status: 400 });
    const horario = await prisma.horario.create({
      data: { canchaId: cancha_id, diaSemana: dia_semana, horaApertura: hora_apertura, horaCierre: hora_cierre, activo },
    });
    return NextResponse.json({ id: horario.id, message: 'Horario creado' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear horario' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, activo } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await prisma.horario.update({ where: { id: parseInt(id) }, data: { activo } });
    return NextResponse.json({ message: 'Horario actualizado' });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar horario' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await prisma.horario.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Horario eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
