import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existing = await db.userQuotePackage.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 });

    const updated = await db.userQuotePackage.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description !== undefined ? body.description : existing.description,
      },
      include: {
        sections: {
          include: { template: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT packages error:', error);
    return NextResponse.json({ error: 'Error al actualizar paquete' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    const existing = await db.userQuotePackage.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 });

    await db.userQuotePackage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE packages error:', error);
    return NextResponse.json({ error: 'Error al eliminar paquete' }, { status: 500 });
  }
}
