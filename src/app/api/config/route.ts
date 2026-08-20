import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export async function GET() {
  try {
    const db = await getDb();
    const snapshot = await db.collection('configuracion').get();
    const config: Record<string, string> = {};
    for (const doc of snapshot.docs) {
      const data = doc.data();
      config[data.clave] = data.valor;
    }
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDb();
    const batch = db.batch();

    for (const [clave, valor] of Object.entries(body)) {
      const snapshot = await db.collection('configuracion').where('clave', '==', clave).limit(1).get();
      if (snapshot.empty) {
        batch.set(db.collection('configuracion').doc(), { clave, valor });
      } else {
        batch.update(snapshot.docs[0].ref, { valor });
      }
    }

    await batch.commit();
    return NextResponse.json({ message: 'Configuración actualizada' });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}
