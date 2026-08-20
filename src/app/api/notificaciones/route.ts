import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuario_id');
    if (!usuarioId) return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 });

    const db = await getDb();
    const snapshot = await db.collection('notificaciones')
      .where('usuarioId', '==', usuarioId)
      .limit(50)
      .get();

    const notificaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    notificaciones.sort((a, b) => ((b as Record<string, unknown>).createdAt as string || '') > ((a as Record<string, unknown>).createdAt as string || '') ? 1 : -1);
    const noLeidas = notificaciones.filter((n: Record<string, unknown>) => !n.leida).length;

    return NextResponse.json({ notificaciones, noLeidas });
  } catch {
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, usuario_id, marcarTodas } = await request.json();
    const db = await getDb();

    if (marcarTodas && usuario_id) {
      const snapshot = await db.collection('notificaciones')
        .where('usuarioId', '==', usuario_id)
        .where('leida', '==', false)
        .get();

      const batch = db.batch();
      for (const doc of snapshot.docs) batch.update(doc.ref, { leida: true });
      await batch.commit();
    } else if (id) {
      await db.collection('notificaciones').doc(id).update({ leida: true });
    }

    return NextResponse.json({ message: 'Notificaciones actualizadas' });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
