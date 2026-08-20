import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const db = await getDb();

    const snapshot = await db.collection('usuarios').get();
    let usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    usuarios.sort((a, b) => ((b as Record<string, unknown>).createdAt as string || '') > ((a as Record<string, unknown>).createdAt as string || '') ? 1 : -1);

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

    const db = await getDb();

    const existingSnap = await db.collection('usuarios').where('email', '==', email).limit(1).get();
    if (!existingSnap.empty) return NextResponse.json({ error: `El email ${email} ya está registrado` }, { status: 409 });

    const fbRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName: nombre, returnSecureToken: true }),
      }
    );
    const fbData = await fbRes.json();
    if (!fbRes.ok) {
      const msg: string = fbData.error?.message || '';
      if (msg.includes('EMAIL_EXISTS')) return NextResponse.json({ error: `El email ${email} ya está registrado` }, { status: 409 });
      return NextResponse.json({ error: 'Error al crear usuario en Firebase Auth' }, { status: 500 });
    }

    await db.collection('usuarios').doc(fbData.localId).set({
      nombre,
      email,
      rol,
      telefono: telefono || null,
      logo: null,
      servicios: null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: fbData.localId, message: 'Usuario creado' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, nombre, email, rol, telefono } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const db = await getDb();
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

    const db = await getDb();

    const notifs = await db.collection('notificaciones').where('usuarioId', '==', id).get();
    for (const doc of notifs.docs) await doc.ref.delete();

    const turnos = await db.collection('turnos').where('usuarioId', '==', id).get();
    for (const doc of turnos.docs) await doc.ref.delete();

    const canchas = await db.collection('canchas').where('propietarioId', '==', id).get();
    for (const doc of canchas.docs) await doc.ref.delete();

    await db.collection('usuarios').doc(id).delete();

    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
