import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productIdToPlan } from '@/lib/billing-client';

/**
 * POST /api/billing/verify-purchase
 * Verifies a Google Play purchase and activates the subscription.
 * 
 * In production, this should verify the purchase token with the
 * Google Play Developer API (googleapis). For now, we store it
 * and mark the subscription as active.
 */
export async function POST(request: NextRequest) {
  try {
    const { purchaseToken, productId, provider } = await request.json();

    if (!purchaseToken || !productId) {
      return NextResponse.json(
        { error: 'Missing purchaseToken or productId' },
        { status: 400 }
      );
    }

    // Get current user from session
    const sessionToken = request.cookies.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const userId = session.userId;
    const { plan, period } = productIdToPlan(productId);

    // Calculate expiration (1 month or 1 year from now)
    const expiresAt = new Date();
    if (period === 'ANNUAL') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // TODO: In production, verify the purchase token with Google Play Developer API
    // const { google } = require('googleapis');
    // const playDeveloperApi = google.androidpublisher('v3');
    // const response = await playDeveloperApi.purchases.subscriptions.get({
    //   packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME,
    //   subscriptionId: productId,
    //   token: purchaseToken,
    // });

    // Upsert subscription
    await db.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        billingPeriod: period,
        status: 'active',
        provider: provider || 'GOOGLE_PLAY',
        purchaseToken,
        productId,
        expiresAt,
      },
      update: {
        plan,
        billingPeriod: period,
        status: 'active',
        provider: provider || 'GOOGLE_PLAY',
        purchaseToken,
        productId,
        expiresAt,
        cancelledAt: null,
      },
    });

    // Update user's plan field
    await db.user.update({
      where: { id: userId },
      data: { plan },
    });

    // TODO: Emit event to API Hub: subscription.activated
    // await fetch(`${process.env.PRIME_API_HUB_URL}/api/events`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.API_SECRET_KEY}` },
    //   body: JSON.stringify({
    //     event: 'subscription.activated',
    //     data: { userId, plan, period, provider },
    //   }),
    // });

    return NextResponse.json({
      success: true,
      plan,
      period,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[Billing] Verify purchase error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
