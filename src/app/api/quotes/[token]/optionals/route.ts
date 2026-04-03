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
      select: { id: true, status: true, optionalSelections: true }
    });
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      selections: quote.optionalSelections,
      locked: quote.status === 'accepted',
    });
  } catch (error) {
    console.error('Get optionals error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { customSectionId, enabled } = await request.json();

    const quote = await db.quote.findUnique({
      where: { token },
      select: { id: true, status: true }
    });
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Block changes if contract is signed
    if (quote.status === 'accepted') {
      return NextResponse.json({ error: 'Contrato firmado. No se pueden modificar los opcionales.' }, { status: 403 });
    }

    const selection = await db.quoteOptionalSelection.upsert({
      where: {
        quoteId_customSectionId: {
          quoteId: quote.id,
          customSectionId,
        }
      },
      update: { enabled },
      create: {
        quoteId: quote.id,
        customSectionId,
        enabled,
      }
    });

    return NextResponse.json(selection);
  } catch (error) {
    console.error('Toggle optional error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
