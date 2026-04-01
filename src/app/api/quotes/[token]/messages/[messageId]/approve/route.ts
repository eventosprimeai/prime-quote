import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; messageId: string }> }
) {
  try {
    const { token, messageId } = await params;

    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const quote = await db.quote.findUnique({
      where: { token },
      include: { contract: true }
    });

    if (!quote || !quote.contract) {
      return NextResponse.json({ error: 'Cotización o contrato no encontrados' }, { status: 404 });
    }

    if (quote.userId !== user.id) {
       return NextResponse.json({ error: 'Acceso denegado. Solo el profesional puede aprobar.' }, { status: 403 });
    }

    const message = await db.quoteMessage.findUnique({
       where: { id: messageId }
    });

    if (!message || message.quoteId !== quote.id) {
       return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    // Append to Contract metadata
    const existingExtensions = quote.contract.metadata ? JSON.parse(quote.contract.metadata as string) : [];
    existingExtensions.push({
       date: new Date().toISOString(),
       text: `Aprobado por el Profesional respecto a la Solicitud del Cliente: ${message.text}`,
    });

    // @ts-ignore
    await db.contract.update({
       where: { id: quote.contract.id },
       data: { metadata: JSON.stringify(existingExtensions) }
    });

    // Mark message as APPROVED
    await db.quoteMessage.update({
       where: { id: message.id },
       data: { type: "MODIFICATION_APPROVED" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve err:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
