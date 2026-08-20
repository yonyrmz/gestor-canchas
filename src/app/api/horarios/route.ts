import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const canchaId = searchParams.get('cancha_id');
    const db = await getDb();

    let query: FirebaseFirestore.Query = db.collection('horarios');
    if (canchaId) query = query.where('canchaId', '==', canchaId);

    const snapshot = await query.get();
    const horarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(horarios);
  } catch {
    return NextResponse.json({ error: 'Error al obtener horarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cancha_id, dia_semana, hora_apertura = '08:00', hora_cierre = '22:00', activo = true, horarios } = body;
    const db = await getDb();

    if (Array.isArray(horarios)) {
      const batch = db.batch();
      for (const h of horarios) {
        const ref = db.collection('horarios').doc();
        batch.set(ref, {
          canchaId: h.cancha_id,
          diaSemana: h.dia_semana,
          horaApertura: h.hora_apertura || '08:00',
          horaCierre: h.hora_cierre || '22:00',
          activo: h.activo ?? true,
        });
      }
      await batch.commit();
      return NextResponse.json({ message: 'Horarios creados' }, { status: 201 });
    }

    if (!cancha_id || dia_semana === undefined) return NextResponse.json({ error: 'cancha_id y dia_semana requeridos' }, { status: 400 });

    const docRef = await db.collection('horarios').add({
      canchaId: cancha_id,
      diaSemana: dia_semana,
      horaApertura: hora_apertura,
      horaCierre: hora_cierre,
      activo,
    });

    return NextResponse.json({ id: docRef.id, message: 'Horario creado' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear horario' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, activo } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const db = await getDb();
    await db.collection('horarios').doc(id).update({ activo });
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
    const db = await getDb();
    await db.collection('horarios').doc(id).delete();
    return NextResponse.json({ message: 'Horario eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
