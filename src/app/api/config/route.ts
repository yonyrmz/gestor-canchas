import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rows = await prisma.configuracion.findMany();
    const config: Record<string, string> = {};
    for (const row of rows) config[row.clave] = row.valor;
    return NextResponse.json(config);
  } catch { return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    for (const [clave, valor] of Object.entries(body)) {
      await prisma.configuracion.upsert({
        where: { clave },
        create: { clave, valor: valor as string },
        update: { valor: valor as string }
      });
    }
    return NextResponse.json({ message: 'Configuración actualizada' });
  } catch { return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 }); }
}
