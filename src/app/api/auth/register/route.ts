import { NextRequest, NextResponse } from 'next/server';
import { getDb, getFirebaseAuth } from '@/lib/firebase';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { nombre, email, password, telefono } = await request.json();
    if (!nombre || !email || !password) return NextResponse.json({ error: 'Nombre, email y password son requeridos' }, { status: 400 });

    const fbAuth = await getFirebaseAuth();
    const db = await getDb();

    const userRecord = await fbAuth.createUser({ email, password, displayName: nombre });

    const userProfile = {
      nombre,
      email,
      rol: 'cliente',
      telefono: telefono || null,
      logo: null,
      servicios: null,
      createdAt: new Date().toISOString(),
    };
    await db.collection('usuarios').doc(userRecord.uid).set(userProfile);

    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const firebaseData = await firebaseRes.json();

    const sessionCookie = await fbAuth.createSessionCookie(firebaseData.idToken, { expiresIn: 60 * 60 * 24 * 7 * 1000 });

    const res = NextResponse.json({
      user: {
        id: userRecord.uid,
        ...userProfile,
      },
      message: 'Usuario registrado',
    }, { status: 201 });
    res.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch (error: unknown) {
    console.error('Error detallado de registro:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al registrar', detail: message }, { status: 500 });
  }
}
