import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { quoteId } = await request.json();

    if (!quoteId) {
      return NextResponse.json({ error: 'ID de cotización requerido' }, { status: 400 });
    }

    // Verify quote belongs to user
    const quote = await db.quote.findUnique({
      where: { id: quoteId, userId: user.id }
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Mark all CLIENT messages as read for this quote
    await db.quoteMessage.updateMany({
      where: { 
        quoteId: quote.id,
        sender: 'CLIENT',
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Error al actualizar mensajes' }, { status: 500 });
  }
}
