import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { token } = await params;

    const quote = await db.quote.findUnique({
      where: { token },
      include: {
        template: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            plan: true,
            profile: true,
          },
        },
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
        contract: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Only allow the owner to export
    if (quote.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Build export payload
    const exportData = {
      _exportVersion: 1,
      _exportedAt: new Date().toISOString(),
      _source: 'prime-quote',
      quote: {
        companyName: quote.companyName,
        contactName: quote.contactName,
        email: quote.email,
        phone: quote.phone,
        projectName: quote.projectName,
        internalNotes: quote.internalNotes,
        projectPrice: quote.projectPrice,
        quoteType: quote.quoteType,
        percentageValue: quote.percentageValue,
        currency: quote.currency,
        status: quote.status,
        paymentLink: quote.paymentLink,
        logoUrl: quote.logoUrl,
        themeColor: quote.themeColor,
        createdAt: quote.createdAt,
      },
      template: {
        name: quote.template.name,
        description: quote.template.description,
      },
      sections: quote.sections.map(s => ({
        title: s.title,
        content: s.content,
        order: s.order,
        isVisible: s.isVisible,
        templateSection: {
          key: s.templateSection.key,
          title: s.templateSection.title,
          icon: s.templateSection.icon,
          content: s.templateSection.content,
          order: s.templateSection.order,
          isRequired: s.templateSection.isRequired,
          isDefault: s.templateSection.isDefault,
        }
      })),
      customSections: quote.customSections.map(cs => ({
        title: cs.title,
        content: cs.content,
        imageUrl: cs.imageUrl,
        order: cs.order,
      })),
      images: quote.images.map(img => ({
        url: img.url,
        filename: img.filename,
        size: img.size,
      })),
      contract: quote.contract ? {
        content: quote.contract.content,
        metadata: quote.contract.metadata,
        signature: quote.contract.signature,
        signedAt: quote.contract.signedAt,
      } : null,
      messages: quote.messages.map(msg => ({
        sender: msg.sender,
        type: msg.type,
        text: msg.text,
        imageUrl: msg.imageUrl,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      })),
    };

    const filename = `cotizacion-${quote.companyName.replace(/[^a-zA-Z0-9]/g, '_')}-${token}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export quote error:', error);
    return NextResponse.json({ error: 'Error al exportar cotización' }, { status: 500 });
  }
}
