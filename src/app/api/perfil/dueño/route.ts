import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get('usuario_id');
    if (!usuarioId) return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 });

    const db = await getDb();
    const userDoc = await db.collection('usuarios').doc(usuarioId).get();
    if (!userDoc.exists) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const data = userDoc.data()!;
    return NextResponse.json({
      perfil: {
        id: userDoc.id,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono || null,
        logo: data.logo || null,
        servicios: data.servicios || null,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { usuario_id, logo, servicios } = await request.json();
    if (!usuario_id) return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 });

    const db = await getDb();
    const data: Record<string, unknown> = {};
    if (logo !== undefined) data.logo = logo;
    if (servicios !== undefined) data.servicios = servicios;
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });

    await db.collection('usuarios').doc(usuario_id).update(data);
    const updated = await db.collection('usuarios').doc(usuario_id).get();
    const updatedData = updated.data()!;

    return NextResponse.json({
      perfil: {
        id: updated.id,
        nombre: updatedData.nombre,
        email: updatedData.email,
        telefono: updatedData.telefono || null,
        logo: updatedData.logo || null,
        servicios: updatedData.servicios || null,
      },
      message: 'Perfil actualizado',
    });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
