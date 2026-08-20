import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propietarioId = searchParams.get('propietario_id');
    const db = await getDb();

    let query: FirebaseFirestore.Query = db.collection('canchas').orderBy('createdAt', 'desc');
    if (propietarioId) query = query.where('propietarioId', '==', propietarioId);

    const snapshot = await query.get();
    const canchas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(canchas);
  } catch {
    return NextResponse.json({ error: 'Error al obtener canchas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nombre, tipo, precio_por_hora, disponible = true, descripcion, fotos, ubicacion, propietario_id } = await request.json();
    if (!nombre || !tipo || !precio_por_hora) return NextResponse.json({ error: 'Nombre, tipo y precio son requeridos' }, { status: 400 });

    const db = await getDb();
    const docRef = await db.collection('canchas').add({
      nombre,
      tipo,
      precioPorHora: precio_por_hora,
      disponible,
      descripcion: descripcion || null,
      fotos: fotos || null,
      ubicacion: ubicacion || null,
      propietarioId: propietario_id || '1',
      createdAt: new Date().toISOString(),
    });

    const created = await docRef.get();
    return NextResponse.json({ cancha: { id: created.id, ...created.data() }, message: 'Cancha creada' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear cancha' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, nombre, tipo, precio_por_hora, disponible, descripcion, fotos, ubicacion } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const db = await getDb();
    const data: Record<string, unknown> = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (tipo !== undefined) data.tipo = tipo;
    if (precio_por_hora !== undefined) data.precioPorHora = precio_por_hora;
    if (disponible !== undefined) data.disponible = disponible;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (fotos !== undefined) data.fotos = fotos;
    if (ubicacion !== undefined) data.ubicacion = ubicacion;

    await db.collection('canchas').doc(id).update(data);
    const updated = await db.collection('canchas').doc(id).get();

    return NextResponse.json({ cancha: { id: updated.id, ...updated.data() }, message: 'Cancha actualizada' });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar cancha' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const db = await getDb();

    const turnos = await db.collection('turnos').where('canchaId', '==', id).get();
    for (const doc of turnos.docs) await doc.ref.delete();

    const horarios = await db.collection('horarios').where('canchaId', '==', id).get();
    for (const doc of horarios.docs) await doc.ref.delete();

    await db.collection('canchas').doc(id).delete();
    return NextResponse.json({ message: 'Cancha eliminada' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar cancha' }, { status: 500 });
  }
}
