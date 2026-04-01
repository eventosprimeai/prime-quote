import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
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

    // Update status to viewed if it was sent
    if (quote.status === 'sent') {
      await db.quote.update({
        where: { id: quote.id },
        data: { status: 'viewed' }
      });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Get quote error:', error);
    return NextResponse.json({ error: 'Error al obtener cotización' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    const quote = await db.quote.findUnique({
      where: { token }
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Update quote
    const updatedQuote = await db.quote.update({
      where: { token },
      data: {
        companyName: body.companyName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        projectName: body.projectName,
        internalNotes: body.internalNotes,
        projectPrice: body.projectPrice,
        currency: body.currency,
        status: body.status,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        sections: body.sections ? {
          update: body.sections.map((s: { id: string; title: string; content: string; isVisible: boolean }) => ({
            where: { id: s.id },
            data: {
              title: s.title,
              content: s.content,
              isVisible: s.isVisible
            }
          }))
        } : undefined
      },
      include: {
        sections: true
      }
    });

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error('Update quote error:', error);
    return NextResponse.json({ error: 'Error al actualizar cotización' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    await db.quote.delete({
      where: { token }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete quote error:', error);
    return NextResponse.json({ error: 'Error al eliminar cotización' }, { status: 500 });
  }
}
