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

    return NextResponse.json(quotes);
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
      currency,
      sections,
      customSections,
      logoUrl,
    } = body;

    // Get template sections
    const templateSections = await db.templateSection.findMany({
      where: { templateId },
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
        templateId,
        userId: user.id,
        companyName,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        projectName: projectName || null,
        internalNotes: internalNotes || null,
        projectPrice: projectPrice || null,
        currency: currency || 'USD',
        status: 'sent',
        logoUrl: logoUrl || null,
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

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Create quote error:', error);
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 });
  }
}
