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
      where: { token },
      include: { customSections: true }
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Anti-fraud: reject edits on signed contracts
    if (quote.status === 'accepted') {
      return NextResponse.json({ error: 'No se puede editar una cotización con contrato firmado. Use la función de extensión.' }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};
    if (body.companyName !== undefined) updateData.companyName = body.companyName;
    if (body.contactName !== undefined) updateData.contactName = body.contactName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.projectName !== undefined) updateData.projectName = body.projectName;
    if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes;
    if (body.projectPrice !== undefined) updateData.projectPrice = body.projectPrice;
    if (body.quoteType !== undefined) updateData.quoteType = body.quoteType;
    if (body.percentageValue !== undefined) updateData.percentageValue = body.percentageValue;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.paymentLink !== undefined) updateData.paymentLink = body.paymentLink;
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
    if (body.themeColor !== undefined) updateData.themeColor = body.themeColor;
    if (body.status !== undefined && body.status !== 'accepted') updateData.status = body.status;
    if (body.validUntil !== undefined) updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null;

    // Update legacy sections if provided
    if (body.sections) {
      updateData.sections = {
        update: body.sections.map((s: { id: string; title: string; content: string; isVisible: boolean }) => ({
          where: { id: s.id },
          data: { title: s.title, content: s.content, isVisible: s.isVisible }
        }))
      };
    }

    // Update quote base fields
    const updatedQuote = await db.quote.update({
      where: { token },
      data: updateData,
    });

    // Replace custom sections if provided (delete all existing + create new)
    if (body.customSections) {
      await db.customSection.deleteMany({ where: { quoteId: quote.id } });
      if (body.customSections.length > 0) {
        await db.customSection.createMany({
          data: body.customSections.map((cs: any, index: number) => ({
            quoteId: quote.id,
            title: cs.title,
            content: cs.content || null,
            imageUrl: cs.imageUrl || null,
            order: cs.order ?? index + 1,
          }))
        });
      }
    }

    // Re-fetch with all relations
    const finalQuote = await db.quote.findUnique({
      where: { token },
      include: {
        sections: true,
        customSections: { orderBy: { order: 'asc' } },
      }
    });

    return NextResponse.json(finalQuote);
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
