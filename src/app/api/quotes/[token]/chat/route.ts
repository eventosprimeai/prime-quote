import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> } | { params: { token: string } }
) {
  try {
    const resolvedParams = await params;
    const { token } = resolvedParams;

    const quote = await db.quote.findUnique({
      where: { token },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Identify if it's the admin viewing the chat
    const session = await getSession();
    if (session) {
      // Admin is viewing the messages: mark unread CLIENT messages as read
      await db.quoteMessage.updateMany({
        where: {
          quoteId: quote.id,
          sender: "CLIENT",
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    } else {
      // If it's the client, we could mark admin messages as read if needed, but the requirements only mention dashboard notifications for admin.
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
  { params }: { params: Promise<{ token: string }> } | { params: { token: string } }
) {
  try {
    const resolvedParams = await params;
    const { token } = resolvedParams;

    const { text, sender } = await request.json();

    if (!text || !sender) {
      return NextResponse.json({ error: 'Texto y remitente son requeridos' }, { status: 400 });
    }

    const quote = await db.quote.findUnique({
      where: { token },
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
