import { NextRequest, NextResponse } from 'next/server';
import { getDb, getFirebaseAuth } from '@/lib/firebase';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email y password requeridos' }, { status: 400 });

    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const firebaseData = await firebaseRes.json();
    if (!firebaseRes.ok) {
      return NextResponse.json({ error: firebaseData.error?.message || 'Credenciales inválidas' }, { status: 401 });
    }

    const fbAuth = await getFirebaseAuth();
    const db = await getDb();

    const decoded = await fbAuth.verifyIdToken(firebaseData.idToken);
    const sessionCookie = await fbAuth.createSessionCookie(firebaseData.idToken, { expiresIn: 60 * 60 * 24 * 7 * 1000 });

    const userDoc = await db.collection('usuarios').doc(decoded.uid).get();
    const userData = userDoc.data();

    const res = NextResponse.json({
      user: {
        id: decoded.uid,
        nombre: userData?.nombre || '',
        email: userData?.email || email,
        rol: userData?.rol || 'cliente',
        telefono: userData?.telefono || null,
        logo: userData?.logo || null,
        servicios: userData?.servicios || null,
      },
    });
    res.cookies.set('session', sessionCookie, {
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
