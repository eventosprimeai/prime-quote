import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import webPush from 'web-push';

const prisma = new PrismaClient();

// Configure web-push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@eventosprimeai.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin (in production, use a strong server-to-server secret or valid admin session)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes(process.env.API_SECRET_KEY || 'ep_sk_prime_hub_2026')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, url, targetUserId } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
    }

    // 2. Find target subscriptions
    const whereClause = targetUserId ? { userId: targetUserId } : {};
    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No subscriptions found' });
    }

    // 3. Send notifications
    const payload = JSON.stringify({ title, body, url });
    
    let successCount = 0;
    let failCount = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: JSON.parse(sub.keys),
          };
          await webPush.sendNotification(pushConfig, payload);
          successCount++;
        } catch (error: any) {
          console.error(`[Push] Failed to send to endpoint ${sub.endpoint}:`, error.statusCode);
          failCount++;
          
          // Remove invalid subscriptions (410 Gone / 404 Not Found)
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      sent: successCount, 
      failed: failCount 
    });
  } catch (error) {
    console.error('[Push API] Send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
