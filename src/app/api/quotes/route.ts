import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken } from '@/lib/utils';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const PLAN_LIMITS: Record<string, number> = {
      FREE: 10,
      STARTER: 50,
      PRO: 150,
      EMBAJADOR: 20,
      CREADOR_ANGEL: 50,
      SUITE: Infinity,
      EMPRESARIAL: Infinity,
      AGENCY: Infinity
    };

    const quotes = await db.quote.findMany({
      where: { userId: user.id },
      include: {
        template: true,
        sections: {
          include: {
            templateSection: true
          },
          orderBy: { order: 'asc' }
        },
        customSections: {
          orderBy: { order: 'asc' }
        },
        images: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true, quotesCreatedCount: true, role: true }
    });

    const plan = dbUser?.role === 'admin' ? 'SUITE' : (dbUser?.plan || 'FREE');
    const limit = dbUser?.role === 'admin' ? Infinity : (PLAN_LIMITS[plan] || 10);

    return NextResponse.json({
      quotes,
      usage: {
        plan,
        role: dbUser?.role,
        count: dbUser?.quotesCreatedCount || 0,
        limit: limit === Infinity ? -1 : limit
      }
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const PLAN_LIMITS: Record<string, number> = {
      FREE: 10,
      STARTER: 50,
      PRO: 150,
      EMBAJADOR: 20,
      CREADOR_ANGEL: 50,
      SUITE: Infinity,
      EMPRESARIAL: Infinity,
      AGENCY: Infinity
    };

    const body = await request.json();
    const {
      templateId,
      companyName,
      contactName,
      email,
      phone,
      projectName,
      internalNotes,
      projectPrice,
      quoteType,
      percentageValue,
      currency,
      sections,
      customSections,
      logoUrl,
      paymentLink,
    } = body;

    // Check usage limits
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const userPlan = dbUser.role === 'admin' ? 'SUITE' : (dbUser.plan || 'FREE');
    const limit = dbUser.role === 'admin' ? Infinity : (PLAN_LIMITS[userPlan] || 10);

    if (dbUser.quotesCreatedCount >= limit && limit !== Infinity) {
      return NextResponse.json({ 
        error: 'Límite alcanzado',
        message: `Has alcanzado el límite de ${limit} cotizaciones para tu plan actual. Actualiza tu plan para continuar.` 
      }, { status: 403 });
    }

    // Ensure a default template exists to satisfy foreign key constraint
    let actualTemplateId = templateId;
    const existingTemplate = await db.template.findUnique({ where: { id: templateId || "default" } });
    
    if (!existingTemplate) {
      const fallbackTemplate = await db.template.create({
        data: {
          id: templateId || "default",
          name: "Plantilla Base",
          description: "Plantilla generada automáticamente del sistema"
        }
      });
      actualTemplateId = fallbackTemplate.id;
    } else {
      actualTemplateId = existingTemplate.id;
    }

    // Get template sections
    const templateSections = await db.templateSection.findMany({
      where: { templateId: actualTemplateId },
      orderBy: { order: 'asc' }
    });

    // Generate unique token
    let token = generateToken();
    let existingQuote = await db.quote.findUnique({ where: { token } });
    while (existingQuote) {
      token = generateToken();
      existingQuote = await db.quote.findUnique({ where: { token } });
    }

    // Create quote
    const quote = await db.quote.create({
      data: {
        token,
        templateId: actualTemplateId,
        userId: user.id,
        companyName,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        projectName: projectName || null,
        internalNotes: internalNotes || null,
        projectPrice: projectPrice || null,
        quoteType: quoteType || 'FIXED',
        percentageValue: percentageValue || null,
        currency: currency || 'USD',
        status: 'sent',
        paymentLink: paymentLink || null,
        logoUrl: logoUrl || null,
        themeColor: body.themeColor || "default",
        sections: {
          create: templateSections.map((ts) => ({
            templateSectionId: ts.id,
            title: ts.title,
            content: sections?.find((s: { key: string }) => s.key === ts.key)?.content || ts.content,
            order: ts.order,
            isVisible: sections?.find((s: { key: string }) => s.key === ts.key)?.isVisible ?? false
          }))
        },
        customSections: customSections && customSections.length > 0
          ? {
              create: customSections.map((cs: { title: string; content: string; imageUrl?: string }, index: number) => ({
                title: cs.title,
                content: cs.content || null,
                imageUrl: cs.imageUrl || null,
                order: templateSections.length + index + 1,
              }))
            }
          : undefined,
      },
      include: {
        sections: true,
        customSections: true,
      }
    });

    // Increment usage counter
    await db.user.update({
      where: { id: user.id },
      data: { quotesCreatedCount: { increment: 1 } }
    });

    // Emitir evento al API Hub (fire & forget — no bloquea la respuesta)
    const apiHubUrl = process.env.PRIME_API_HUB_URL || 'http://localhost:3006';
    fetch(`${apiHubUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_SECRET_KEY || 'ep_sk_prime_hub_2026'}`,
      },
      body: JSON.stringify({
        event: 'quote.quote.created',
        app: 'primequote',
        user_id: user.id,
        data: {
          quote_id: quote.id,
          token: quote.token,
          company_name: quote.companyName,
          project_name: quote.projectName,
          status: quote.status,
          created_at: quote.createdAt,
        },
      }),
    }).catch(() => { /* Silencioso si el API Hub no está disponible */ });

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Create quote error:', error);
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 });
  }
}
