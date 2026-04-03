import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateToken } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    if (!body._exportVersion || !body.quote || !body.customSections) {
      return NextResponse.json({ error: 'Formato de archivo inválido. Usa un JSON exportado desde Prime Quote.' }, { status: 400 });
    }

    const q = body.quote;

    // Ensure a default template exists
    let templateId = 'default';
    const existingTemplate = await db.template.findUnique({ where: { id: 'default' } });
    if (!existingTemplate) {
      await db.template.create({
        data: { id: 'default', name: 'Plantilla Base', description: 'Generada automáticamente' }
      });
    }

    // Generate unique token
    let token = generateToken();
    let existing = await db.quote.findUnique({ where: { token } });
    while (existing) {
      token = generateToken();
      existing = await db.quote.findUnique({ where: { token } });
    }

    // Create quote with all sections
    const quote = await db.quote.create({
      data: {
        token,
        templateId,
        userId: user.id,
        companyName: q.companyName || 'Importada',
        contactName: q.contactName || null,
        email: q.email || null,
        phone: q.phone || null,
        projectName: q.projectName || null,
        internalNotes: q.internalNotes || null,
        projectPrice: q.projectPrice || null,
        quoteType: q.quoteType || 'FIXED',
        percentageValue: q.percentageValue || null,
        currency: q.currency || 'USD',
        status: 'draft',
        paymentLink: q.paymentLink || null,
        logoUrl: q.logoUrl || null,
        themeColor: q.themeColor || 'default',
        customSections: body.customSections && body.customSections.length > 0
          ? {
              create: body.customSections.map((cs: any, index: number) => ({
                title: cs.title,
                content: cs.content || null,
                imageUrl: cs.imageUrl || null,
                order: cs.order ?? index + 1,
              }))
            }
          : undefined,
      },
      include: {
        customSections: true,
      }
    });

    // Create images if any
    if (body.images && body.images.length > 0) {
      await db.quoteImage.createMany({
        data: body.images.map((img: any) => ({
          quoteId: quote.id,
          url: img.url,
          filename: img.filename || 'imported',
          size: img.size || 0,
        }))
      });
    }

    return NextResponse.json({
      success: true,
      token: quote.token,
      id: quote.id,
      message: `Cotización importada exitosamente con token: ${quote.token}`,
    });
  } catch (error) {
    console.error('Import quote error:', error);
    return NextResponse.json({ error: 'Error al importar cotización' }, { status: 500 });
  }
}
