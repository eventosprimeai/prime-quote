import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateToken } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const quotes = await db.quote.findMany({
      include: {
        template: true,
        sections: {
          include: {
            templateSection: true
          },
          orderBy: { order: 'asc' }
        }
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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
      sections
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
        companyName,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        projectName: projectName || null,
        internalNotes: internalNotes || null,
        projectPrice: projectPrice || null,
        currency: currency || 'USD',
        status: 'draft',
        sections: {
          create: templateSections.map((ts, index) => ({
            templateSectionId: ts.id,
            title: ts.title,
            content: sections?.find((s: { key: string }) => s.key === ts.key)?.content || ts.content,
            order: ts.order,
            isVisible: sections?.find((s: { key: string }) => s.key === ts.key)?.isVisible ?? ts.isDefault
          }))
        }
      },
      include: {
        sections: true
      }
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Create quote error:', error);
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 });
  }
}
