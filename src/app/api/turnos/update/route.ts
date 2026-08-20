import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export async function PUT(request: NextRequest) {
  try {
    const { id, estado, sena_pagada, propietario_id, multa, multa_descripcion, motivo } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const db = await getDb();

    if (propietario_id) {
      const turnoDoc = await db.collection('turnos').doc(id).get();
      if (!turnoDoc.exists) return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });
      const turnoData = turnoDoc.data()!;
      const canchaDoc = await db.collection('canchas').doc(turnoData.canchaId).get();
      if (canchaDoc.data()?.propietarioId !== propietario_id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const data: Record<string, unknown> = {};
    if (estado) data.estado = estado;
    if (sena_pagada !== undefined) data.senaPagada = sena_pagada;
    if (multa !== undefined) data.multa = multa;
    if (multa_descripcion !== undefined) data.multaDescripcion = multa_descripcion;
    if (motivo !== undefined && estado === 'cancelado') data.cancelacionMotivo = motivo;
    if (!Object.keys(data).length) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });

    await db.collection('turnos').doc(id).update(data);
    const updatedTurno = await db.collection('turnos').doc(id).get();
    const turnoData = updatedTurno.data()!;

    const usuarioDoc = await db.collection('usuarios').doc(turnoData.usuarioId).get();
    const canchaDoc = await db.collection('canchas').doc(turnoData.canchaId).get();
    const usuarioData = usuarioDoc.data();
    const canchaData = canchaDoc.data();

    if (estado) {
      const canchaNombre = canchaData?.nombre || '';
      const notifData: { usuarioId: string; turnoId: string; titulo: string; mensaje: string; leida: boolean; createdAt: string } = {
        usuarioId: turnoData.usuarioId,
        turnoId: id,
        titulo: '',
        mensaje: '',
        leida: false,
        createdAt: new Date().toISOString(),
      };

      if (estado === 'confirmado') {
        notifData.titulo = 'Turno confirmado';
        notifData.mensaje = `Tu turno en ${canchaNombre} fue confirmado`;
      } else if (estado === 'cancelado') {
        const motivoText = motivo ? ` Motivo: ${motivo}` : '';
        notifData.titulo = 'Turno cancelado';
        notifData.mensaje = `Tu turno en ${canchaNombre} fue cancelado por el dueño.${motivoText}`;
      } else if (estado === 'no_show') {
        const multaDesc = multa_descripcion || `Multa: $${multa || 0}`;
        notifData.titulo = 'No te presentaste';
        notifData.mensaje = `No asististe a tu turno en ${canchaNombre}. ${multaDesc}`;
      }

      if (notifData.titulo) await db.collection('notificaciones').add(notifData);
    }

    const mapped = {
      id: updatedTurno.id,
      usuario_id: turnoData.usuarioId,
      cancha_id: turnoData.canchaId,
      fecha: turnoData.fecha,
      hora_inicio: turnoData.horaInicio,
      hora_fin: turnoData.horaFin,
      tarifa: turnoData.tarifa,
      sena_pagada: turnoData.senaPagada,
      estado: turnoData.estado,
      multa: turnoData.multa,
      multa_descripcion: turnoData.multaDescripcion,
      cancelacion_motivo: turnoData.cancelacionMotivo,
      usuario_nombre: usuarioData?.nombre || '',
      usuario_email: usuarioData?.email || '',
      usuario_telefono: usuarioData?.telefono || '',
      cancha_nombre: canchaData?.nombre || '',
      precio_por_hora: canchaData?.precioPorHora || 0,
      propietario_id: canchaData?.propietarioId || '',
    };

    return NextResponse.json({ turno: mapped, message: 'Turno actualizado' });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar turno' }, { status: 500 });
  }
}
