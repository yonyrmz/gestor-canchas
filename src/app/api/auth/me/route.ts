import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

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

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const payload = decodeJwtPayload(sessionCookie.value);
    const uid = payload?.user_id || payload?.sub;
    if (!uid || typeof uid !== 'string') return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });

    const db = await getDb();
    const userDoc = await db.collection('usuarios').doc(uid).get();
    if (!userDoc.exists) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const data = userDoc.data()!;
    return NextResponse.json({
      user: {
        id: uid,
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
