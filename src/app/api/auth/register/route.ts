import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;

export async function POST(request: NextRequest) {
  try {
    const { nombre, email, password, telefono } = await request.json();
    if (!nombre || !email || !password) return NextResponse.json({ error: 'Nombre, email y password son requeridos' }, { status: 400 });

    const fbRes = await fetch(FIREBASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName: nombre, returnSecureToken: true }),
    });
    const fbData = await fbRes.json();
    if (!fbRes.ok) {
      const msg: string = fbData.error?.message || '';
      if (msg.includes('EMAIL_EXISTS')) return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
      console.error('Error detallado de registro:', msg);
      return NextResponse.json({ error: 'Error al registrar', detail: msg }, { status: 500 });
    }

    const uid: string = fbData.localId;
    const idToken: string = fbData.idToken;

    const db = await getDb();
    await db.collection('usuarios').doc(uid).set({
      nombre,
      email,
      rol: 'cliente',
      telefono: telefono || null,
      logo: null,
      servicios: null,
      createdAt: new Date().toISOString(),
    });

    const res = NextResponse.json({
      user: { id: uid, nombre, email, rol: 'cliente', telefono: telefono || null, logo: null, servicios: null },
      message: 'Usuario registrado',
    }, { status: 201 });
    res.cookies.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch (error: unknown) {
    console.error('Error detallado de registro:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al registrar', detail: message }, { status: 500 });
  }
}
