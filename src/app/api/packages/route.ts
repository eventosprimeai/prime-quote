import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const PLAN_LIMITS: Record<string, number> = {
  FREE: 1,
  STARTER: 5,
  PRO: 10,
  SUITE: 25,
};

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const packages = await db.userQuotePackage.findMany({
      where: { userId: user.id },
      include: {
        sections: {
          include: { template: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const limit = user.role === 'admin' ? 999999 : (PLAN_LIMITS[user.plan] || PLAN_LIMITS.FREE);

    return NextResponse.json({ packages, limit, count: packages.length });
  } catch (error) {
    console.error('GET packages error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const limit = user.role === 'admin' ? 999999 : (PLAN_LIMITS[user.plan] || PLAN_LIMITS.FREE);
    const count = await db.userQuotePackage.count({ where: { userId: user.id } });

    if (count >= limit) {
      return NextResponse.json(
        { error: `Has alcanzado el límite de ${limit} paquetes para tu plan ${user.plan}. Mejora tu plan para crear más.` },
        { status: 403 }
      );
    }

    const body = await req.json();
    // body.sections is an array of section data objects (copies to save as templates + link)

    // Step 1: Create section templates from the section data if they don't exist
    const templateIds: { templateId: string; order: number }[] = [];

    for (let i = 0; i < (body.sections || []).length; i++) {
      const s = body.sections[i];

      // Create a new template for each section in the package
      const template = await db.userSectionTemplate.create({
        data: {
          userId: user.id,
          name: s.title || s.name || `Sección ${i + 1}`,
          type: s.type || 'standard',
          title: s.title || '',
          description: s.description || null,
          imageUrl: s.imageUrl || null,
          buttonUrl: s.buttonUrl || null,
          phoneNumber: s.phoneNumber || null,
          messageText: s.messageText || null,
          hasPrice: s.hasPrice || false,
          price: s.price ? parseFloat(s.price) : null,
          hasIva: s.hasIva || false,
          ivaPercent: s.ivaPercent ? parseFloat(s.ivaPercent) : 15,
          includeInTotal: s.includeInTotal !== undefined ? s.includeInTotal : true,
        },
      });

      templateIds.push({ templateId: template.id, order: i });
    }

    // Step 2: Create the package
    const pkg = await db.userQuotePackage.create({
      data: {
        userId: user.id,
        name: body.name || 'Paquete sin nombre',
        description: body.description || null,
        sections: {
          create: templateIds.map(t => ({
            templateId: t.templateId,
            order: t.order,
          })),
        },
      },
      include: {
        sections: {
          include: { template: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    console.error('POST packages error:', error);
    return NextResponse.json({ error: 'Error al crear paquete' }, { status: 500 });
  }
}
