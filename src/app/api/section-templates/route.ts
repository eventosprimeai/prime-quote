import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const PLAN_LIMITS: Record<string, number> = {
  FREE: 10,
  STARTER: 20,
  PRO: 50,
  SUITE: 999999, // unlimited
};

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const templates = await db.userSectionTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const limit = user.role === 'admin' ? 999999 : (PLAN_LIMITS[user.plan] || PLAN_LIMITS.FREE);

    return NextResponse.json({ templates, limit, count: templates.length });
  } catch (error) {
    console.error('GET section-templates error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const limit = user.role === 'admin' ? 999999 : (PLAN_LIMITS[user.plan] || PLAN_LIMITS.FREE);
    const count = await db.userSectionTemplate.count({ where: { userId: user.id } });

    if (count >= limit) {
      return NextResponse.json(
        { error: `Has alcanzado el límite de ${limit} plantillas para tu plan ${user.plan}. Mejora tu plan para crear más.` },
        { status: 403 }
      );
    }

    const body = await req.json();

    const template = await db.userSectionTemplate.create({
      data: {
        userId: user.id,
        name: body.name || body.title || 'Sin nombre',
        type: body.type || 'standard',
        title: body.title || '',
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        buttonUrl: body.buttonUrl || null,
        phoneNumber: body.phoneNumber || null,
        messageText: body.messageText || null,
        hasPrice: body.hasPrice || false,
        price: body.price ? parseFloat(body.price) : null,
        hasIva: body.hasIva || false,
        ivaPercent: body.ivaPercent ? parseFloat(body.ivaPercent) : 15,
        includeInTotal: body.includeInTotal !== undefined ? body.includeInTotal : true,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('POST section-templates error:', error);
    return NextResponse.json({ error: 'Error al crear plantilla' }, { status: 500 });
  }
}
