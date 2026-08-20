import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

async function findOrCreateGoogleUser(uid: string, email: string, displayName: string, photoURL: string | null) {
  const db = await getDb();
  const userDoc = await db.collection('usuarios').doc(uid).get();

  if (userDoc.exists) {
    return userDoc.data()!;
  }

  const newUser = {
    nombre: displayName || email.split('@')[0],
    email,
    rol: 'cliente',
    telefono: null,
    logo: photoURL,
    servicios: null,
    createdAt: new Date().toISOString(),
  };
  await db.collection('usuarios').doc(uid).set(newUser);
  return newUser;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, googleIdToken } = await request.json();

    const db = await getDb();

    if (googleIdToken) {
      const payload = decodeJwtPayload(googleIdToken);
      if (!payload) return NextResponse.json({ error: 'Token de Google inválido' }, { status: 401 });

      const uid = (payload.user_id || payload.sub) as string;
      const googleEmail = (payload.email || '') as string;
      const firebaseData = payload.firebase as { identities?: Record<string, string[]> } | undefined;
      const googleName = (payload.name || firebaseData?.identities?.['google.com']?.[0] || '') as string;
      const googlePhoto = (payload.picture || null) as string | null;

      if (!uid) return NextResponse.json({ error: 'Token de Google inválido' }, { status: 401 });

      const userData = await findOrCreateGoogleUser(uid, googleEmail, googleName, googlePhoto);

      const res = NextResponse.json({
        user: {
          id: uid,
          nombre: userData.nombre,
          email: userData.email,
          rol: userData.rol,
          telefono: userData.telefono || null,
          logo: userData.logo || null,
          servicios: userData.servicios || null,
        },
      });
      res.cookies.set('session', googleIdToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return res;
    }

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
  } catch (error: unknown) {
    console.error('Error detallado de login:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: 'Error al iniciar sesión', detail: message }, { status: 500 });
  }
}
