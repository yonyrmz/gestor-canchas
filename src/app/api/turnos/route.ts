import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const canchaId = searchParams.get('cancha_id');
    const usuarioId = searchParams.get('usuario_id');
    const db = await getDb();

    let query: FirebaseFirestore.Query = db.collection('turnos');
    if (fecha) query = query.where('fecha', '==', fecha);
    if (canchaId) query = query.where('canchaId', '==', canchaId);
    if (usuarioId) query = query.where('usuarioId', '==', usuarioId);

    const snapshot = await query.get();

    const mapped = await Promise.all(
      snapshot.docs.map(async doc => {
        const t = doc.data();
        const usuarioDoc = t.usuarioId ? await db.collection('usuarios').doc(t.usuarioId).get() : null;
        const canchaDoc = t.canchaId ? await db.collection('canchas').doc(t.canchaId).get() : null;
        const usuarioData = usuarioDoc?.data();
        const canchaData = canchaDoc?.data();

        return {
          id: doc.id,
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
          usuario_nombre: usuarioData?.nombre || '',
          usuario_email: usuarioData?.email || '',
          usuario_telefono: usuarioData?.telefono || '',
          cancha_nombre: canchaData?.nombre || '',
          precio_por_hora: canchaData?.precioPorHora || 0,
          propietario_id: canchaData?.propietarioId || '',
        };
      })
    );

    mapped.sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha > b.fecha ? -1 : 1;
      return a.hora_inicio > b.hora_inicio ? 1 : -1;
    });

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: 'Error al obtener turnos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { usuario_id, cancha_id, fecha, hora_inicio, hora_fin, tarifa } = await request.json();
    if (!usuario_id || !cancha_id || !fecha || !hora_inicio || !hora_fin) return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });

    const db = await getDb();

    const overlapSnap = await db.collection('turnos')
      .where('canchaId', '==', cancha_id)
      .where('fecha', '==', fecha)
      .get();

    const overlap = overlapSnap.docs.find(doc => {
      const t = doc.data();
      return t.estado !== 'cancelado' && t.horaInicio < hora_fin && t.horaFin > hora_inicio;
    });
    if (overlap) return NextResponse.json({ error: 'El horario ya está ocupado' }, { status: 409 });

    const docRef = await db.collection('turnos').add({
      usuarioId: usuario_id,
      canchaId: cancha_id,
      fecha,
      horaInicio: hora_inicio,
      horaFin: hora_fin,
      tarifa,
      senaPagada: false,
      estado: 'pendiente',
      multa: 0,
      multaDescripcion: null,
      cancelacionMotivo: null,
      createdAt: new Date().toISOString(),
    });

    const usuarioDoc = await db.collection('usuarios').doc(usuario_id).get();
    const canchaDoc = await db.collection('canchas').doc(cancha_id).get();

    const mapped = {
      id: docRef.id,
      usuario_id,
      cancha_id,
      fecha,
      hora_inicio,
      hora_fin,
      tarifa,
      sena_pagada: false,
      estado: 'pendiente',
      usuario_nombre: usuarioDoc.data()?.nombre || '',
      cancha_nombre: canchaDoc.data()?.nombre || '',
    };

    return NextResponse.json({ turno: mapped, message: 'Turno creado' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear turno' }, { status: 500 });
  }
}
