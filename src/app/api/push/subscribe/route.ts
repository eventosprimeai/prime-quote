import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // Validate subscription object
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    // Attempt to link to user session if available
    const sessionToken = request.cookies.get('session')?.value;
    let userId: string | null = null;

    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
      });
      if (session && session.expiresAt > new Date()) {
        userId = session.userId;
      }
    }

    if (!userId) {
       // Allow anonymous push subscriptions as long as it isn't an admin feature
       return NextResponse.json({ success: true, warning: 'Subscribed anonymously' });
    }

    // Upsert subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        userId,
        endpoint: subscription.endpoint,
        keys: JSON.stringify(subscription.keys),
      },
      update: {
        userId,
        keys: JSON.stringify(subscription.keys),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push API] Subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
