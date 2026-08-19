import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const canchaId = searchParams.get('cancha_id');
    const usuarioId = searchParams.get('usuario_id');

    const where: Record<string, unknown> = {};
    if (fecha) where.fecha = fecha;
    if (canchaId) where.canchaId = parseInt(canchaId);
    if (usuarioId) where.usuarioId = parseInt(usuarioId);

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        usuario: { select: { nombre: true, email: true, telefono: true } },
        cancha: { select: { nombre: true, precioPorHora: true, propietarioId: true } }
      },
      orderBy: [{ fecha: 'desc' }, { horaInicio: 'asc' }]
    });

    const mapped = turnos.map(t => ({
      id: t.id,
      usuario_id: t.usuarioId,
      cancha_id: t.canchaId,
      fecha: t.fecha,
      hora_inicio: t.horaInicio,
      hora_fin: t.horaFin,
      tarifa: t.tarifa,
      sena_pagada: t.senaPagada,
      estado: t.estado,
      multa: t.multa,
      multa_descripcion: t.multaDescripcion,
      cancelacion_motivo: t.cancelacionMotivo,
      usuario_nombre: t.usuario.nombre,
      usuario_email: t.usuario.email,
      usuario_telefono: t.usuario.telefono,
      cancha_nombre: t.cancha.nombre,
      precio_por_hora: t.cancha.precioPorHora,
      propietario_id: t.cancha.propietarioId
    }));

    return NextResponse.json(mapped);
  } catch { return NextResponse.json({ error: 'Error al obtener turnos' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const { usuario_id, cancha_id, fecha, hora_inicio, hora_fin, tarifa } = await request.json();
    if (!usuario_id || !cancha_id || !fecha || !hora_inicio || !hora_fin) return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });

    const overlap = await prisma.turno.findFirst({
      where: {
        canchaId: cancha_id,
        fecha,
        estado: { notIn: ['cancelado'] },
        OR: [
          { horaInicio: { lt: hora_fin }, horaFin: { gt: hora_inicio } }
        ]
      }
    });
    if (overlap) return NextResponse.json({ error: 'El horario ya está ocupado' }, { status: 409 });

    const turno = await prisma.turno.create({
      data: {
        usuarioId: usuario_id,
        canchaId: cancha_id,
        fecha,
        horaInicio: hora_inicio,
        horaFin: hora_fin,
        tarifa,
        senaPagada: false,
        estado: 'pendiente'
      },
      include: {
        usuario: { select: { nombre: true, email: true, telefono: true } },
        cancha: { select: { nombre: true, precioPorHora: true, propietarioId: true } }
      }
    });

    const mapped = {
      id: turno.id,
      usuario_id: turno.usuarioId,
      cancha_id: turno.canchaId,
      fecha: turno.fecha,
      hora_inicio: turno.horaInicio,
      hora_fin: turno.horaFin,
      tarifa: turno.tarifa,
      sena_pagada: turno.senaPagada,
      estado: turno.estado,
      usuario_nombre: turno.usuario.nombre,
      cancha_nombre: turno.cancha.nombre
    };

    return NextResponse.json({ turno: mapped, message: 'Turno creado' }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Error al crear turno' }, { status: 500 }); }
}
