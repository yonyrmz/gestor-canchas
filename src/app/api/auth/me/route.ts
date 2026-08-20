import { NextRequest, NextResponse } from 'next/server';
import { getDb, getFirebaseAuth } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const fbAuth = await getFirebaseAuth();
    const db = await getDb();

    const decoded = await fbAuth.verifySessionCookie(sessionCookie.value);
    const userDoc = await db.collection('usuarios').doc(decoded.uid).get();
    if (!userDoc.exists) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const data = userDoc.data()!;
    return NextResponse.json({
      user: {
        id: decoded.uid,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        telefono: data.telefono || null,
        logo: data.logo || null,
        servicios: data.servicios || null,
        createdAt: data.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  }
}
