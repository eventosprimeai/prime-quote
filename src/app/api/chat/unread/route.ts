import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Get all quotes belonging to this user
    const quotes = await db.quote.findMany({
      where: { userId: user.id },
      select: { id: true, token: true, companyName: true }
    });

    const quoteIds = quotes.map(q => q.id);

    // Get unread CLIENT messages for these quotes
    const unreadMessages = await db.quoteMessage.groupBy({
      by: ['quoteId'],
      where: {
        quoteId: { in: quoteIds },
        sender: 'CLIENT',
        isRead: false
      },
      _count: { id: true }
    });

    // Build a map: quoteId -> unread count
    const unreadMap: Record<string, { count: number; companyName: string; token: string }> = {};
    let totalUnread = 0;

    for (const item of unreadMessages) {
      const quote = quotes.find(q => q.id === item.quoteId);
      unreadMap[item.quoteId] = {
        count: item._count.id,
        companyName: quote?.companyName || '',
        token: quote?.token || ''
      };
      totalUnread += item._count.id;
    }

    return NextResponse.json({ totalUnread, quotes: unreadMap });
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}
