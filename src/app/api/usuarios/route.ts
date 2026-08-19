import { NextRequest, NextResponse } from 'next/server';
import { getDb, getFirebaseAuth } from '@/lib/firebase';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const db = getDb();

    const snapshot = await db.collection('usuarios').orderBy('createdAt', 'desc').get();
    let usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (q) {
      const lower = q.toLowerCase();
      usuarios = usuarios.filter((u: Record<string, unknown>) =>
        (u.nombre as string)?.toLowerCase().includes(lower) ||
        (u.email as string)?.toLowerCase().includes(lower) ||
        (u.rol as string)?.toLowerCase().includes(lower)
      );
    }

    return NextResponse.json(usuarios);
  } catch {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nombre, email, password, rol = 'cliente', telefono } = await request.json();
    if (!nombre || !email || !password) return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 });

    const fbAuth = getFirebaseAuth();
    const db = getDb();

    const existing = await fbAuth.getUserByEmail(email).catch(() => null);
    if (existing) return NextResponse.json({ error: `El email ${email} ya está registrado` }, { status: 409 });

    const userRecord = await fbAuth.createUser({ email, password, displayName: nombre });
    await db.collection('usuarios').doc(userRecord.uid).set({
      nombre,
      email,
      rol,
      telefono: telefono || null,
      logo: null,
      servicios: null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: userRecord.uid, message: 'Usuario creado' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, nombre, email, rol, telefono } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const db = getDb();
    const data: Record<string, unknown> = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (email !== undefined) data.email = email;
    if (rol !== undefined) data.rol = rol;
    if (telefono !== undefined) data.telefono = telefono;

    await db.collection('usuarios').doc(id).update(data);
    const updated = await db.collection('usuarios').doc(id).get();

    return NextResponse.json({ user: { id: updated.id, ...updated.data() }, message: 'Usuario actualizado' });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const db = getDb();
    const fbAuth = getFirebaseAuth();

    const notifs = await db.collection('notificaciones').where('usuarioId', '==', id).get();
    for (const doc of notifs.docs) await doc.ref.delete();

    const turnos = await db.collection('turnos').where('usuarioId', '==', id).get();
    for (const doc of turnos.docs) await doc.ref.delete();

    const canchas = await db.collection('canchas').where('propietarioId', '==', id).get();
    for (const doc of canchas.docs) await doc.ref.delete();

    await db.collection('usuarios').doc(id).delete();
    await fbAuth.deleteUser(id).catch(() => {});

    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
