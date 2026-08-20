import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 });

    const fbRes = await fetch(FIREBASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const fbData = await fbRes.json();
    if (!fbRes.ok) {
      return NextResponse.json({ error: fbData.error?.message || 'Credenciales inválidas' }, { status: 401 });
    }

    const uid: string = fbData.localId;
    const idToken: string = fbData.idToken;

    const db = await getDb();
    const userDoc = await db.collection('usuarios').doc(uid).get();
    const userData = userDoc.data();

    const res = NextResponse.json({
      user: {
        id: uid,
        nombre: userData?.nombre || fbData.displayName || '',
        email: userData?.email || email,
        rol: userData?.rol || 'cliente',
        telefono: userData?.telefono || null,
        logo: userData?.logo || null,
        servicios: userData?.servicios || null,
      },
    });
    res.cookies.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}
