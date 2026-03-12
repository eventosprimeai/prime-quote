import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const quote = await db.quote.findUnique({
      where: { token: params.token },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    const messages = await db.quoteMessage.findMany({
      where: { quoteId: quote.id },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { text, sender } = await request.json();

    if (!text || !sender) {
      return NextResponse.json({ error: 'Texto y remitente son requeridos' }, { status: 400 });
    }

    const quote = await db.quote.findUnique({
      where: { token: params.token },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    const message = await db.quoteMessage.create({
      data: {
        quoteId: quote.id,
        sender,
        text,
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error posting chat message:', error);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
