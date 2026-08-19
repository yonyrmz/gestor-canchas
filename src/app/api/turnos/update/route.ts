import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const { id, estado, sena_pagada, propietario_id, multa, multa_descripcion, motivo } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    if (propietario_id) {
      const turno = await prisma.turno.findFirst({
        where: { id, cancha: { propietarioId: propietario_id } }
      });
      if (!turno) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (estado) data.estado = estado;
    if (sena_pagada !== undefined) data.senaPagada = sena_pagada;
    if (multa !== undefined) data.multa = multa;
    if (multa_descripcion !== undefined) data.multaDescripcion = multa_descripcion;
    if (motivo !== undefined && estado === 'cancelado') data.cancelacionMotivo = motivo;
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });

    const turno = await prisma.turno.update({
      where: { id },
      data,
      include: {
        usuario: { select: { nombre: true, email: true, telefono: true } },
        cancha: { select: { nombre: true, precioPorHora: true, propietarioId: true } }
      }
    });

    if (estado) {
      const canchaNombre = turno.cancha.nombre;
      const fechaStr = turno.fecha;
      const horaStr = turno.horaInicio;

      if (estado === 'confirmado') {
        await prisma.notificacion.create({
          data: {
            usuarioId: turno.usuarioId,
            turnoId: id,
            titulo: 'Turno confirmado',
            mensaje: `Tu turno en ${canchaNombre} fue confirmado`
          }
        });
      } else if (estado === 'cancelado') {
        const motivoText = motivo ? ` Motivo: ${motivo}` : '';
        await prisma.notificacion.create({
          data: {
            usuarioId: turno.usuarioId,
            turnoId: id,
            titulo: 'Turno cancelado',
            mensaje: `Tu turno en ${canchaNombre} fue cancelado por el dueño.${motivoText}`
          }
        });
      } else if (estado === 'no_show') {
        const multaDesc = multa_descripcion || `Multa: $${multa || 0}`;
        await prisma.notificacion.create({
          data: {
            usuarioId: turno.usuarioId,
            turnoId: id,
            titulo: 'No te presentaste',
            mensaje: `No asististe a tu turno en ${canchaNombre}. ${multaDesc}`
          }
        });
      }
    }

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
      multa: turno.multa,
      multa_descripcion: turno.multaDescripcion,
      cancelacion_motivo: turno.cancelacionMotivo,
      usuario_nombre: turno.usuario.nombre,
      usuario_email: turno.usuario.email,
      usuario_telefono: turno.usuario.telefono,
      cancha_nombre: turno.cancha.nombre,
      precio_por_hora: turno.cancha.precioPorHora,
      propietario_id: turno.cancha.propietarioId
    };

    return NextResponse.json({ turno: mapped, message: 'Turno actualizado' });
  } catch { return NextResponse.json({ error: 'Error al actualizar turno' }, { status: 500 }); }
}
