import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // Verify ownership
    const existing = await db.userSectionTemplate.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });

    const updated = await db.userSectionTemplate.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        type: body.type ?? existing.type,
        title: body.title ?? existing.title,
        description: body.description !== undefined ? body.description : existing.description,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : existing.imageUrl,
        buttonUrl: body.buttonUrl !== undefined ? body.buttonUrl : existing.buttonUrl,
        phoneNumber: body.phoneNumber !== undefined ? body.phoneNumber : existing.phoneNumber,
        messageText: body.messageText !== undefined ? body.messageText : existing.messageText,
        hasPrice: body.hasPrice !== undefined ? body.hasPrice : existing.hasPrice,
        price: body.price !== undefined ? (body.price ? parseFloat(body.price) : null) : existing.price,
        hasIva: body.hasIva !== undefined ? body.hasIva : existing.hasIva,
        ivaPercent: body.ivaPercent !== undefined ? parseFloat(body.ivaPercent) : existing.ivaPercent,
        includeInTotal: body.includeInTotal !== undefined ? body.includeInTotal : existing.includeInTotal,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT section-templates error:', error);
    return NextResponse.json({ error: 'Error al actualizar plantilla' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const existing = await db.userSectionTemplate.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });

    await db.userSectionTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE section-templates error:', error);
    return NextResponse.json({ error: 'Error al eliminar plantilla' }, { status: 500 });
  }
}
