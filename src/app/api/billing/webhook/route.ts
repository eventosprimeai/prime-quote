import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/billing/webhook
 * Handles Real-Time Developer Notifications (RTDN) from Google Play via Cloud Pub/Sub
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Google Cloud Pub/Sub sends messages in { message: { data: "base64..." } }
    if (!body.message || !body.message.data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const payloadRaw = Buffer.from(body.message.data, 'base64').toString('utf8');
    const payload = JSON.parse(payloadRaw);

    if (payload.testNotification) {
      return NextResponse.json({ success: true, message: 'Test notification received' });
    }

    if (payload.subscriptionNotification) {
      const { notificationType, purchaseToken, subscriptionId } = payload.subscriptionNotification;
      
      // Typical notification types:
      // 1: SUBSCRIPTION_RECOVERED
      // 2: SUBSCRIPTION_RENEWED
      // 3: SUBSCRIPTION_CANCELED
      // 4: SUBSCRIPTION_PURCHASED
      // 5: SUBSCRIPTION_ON_HOLD
      // 12: SUBSCRIPTION_REVOKED
      // 13: SUBSCRIPTION_EXPIRED

      // Find user with this purchase token
      const subscription = await prisma.subscription.findFirst({
        where: { purchaseToken },
      });

      if (!subscription) {
        console.warn(`[Billing Webhook] Subscription not found for token: ${purchaseToken}`);
        return NextResponse.json({ success: true, warning: 'Subscription not found' });
      }

      switch (notificationType) {
        case 2: // RENEWED
        case 4: // PURCHASED
        case 1: // RECOVERED
          // Increase expiration date (requires fetching actual new date from Google Play API)
          // For now, simple assumption logic (needs real API in prod)
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'active', cancelledAt: null },
          });
          break;
          
        case 3: // CANCELED (still active until expiration)
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { cancelledAt: new Date() },
          });
          break;

        case 5: // ON_HOLD
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'paused' },
          });
          break;

        case 12: // REVOKED
        case 13: // EXPIRED
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'expired' },
          });
          
          // Downgrade user to FREE
          await prisma.user.update({
             where: { id: subscription.userId },
             data: { plan: 'FREE' }
          });
          break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Billing Webhook] Error processing RTDN:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
