/**
 * Google Play Billing Client for TWA (Trusted Web Activity)
 * Uses the Digital Goods API + Payment Request API
 * 
 * This only works when the app is running inside a TWA wrapped for Google Play.
 * On regular web browsers, it falls back to web-based checkout.
 */

// Product IDs matching Google Play Console
export const PRODUCT_IDS = {
  STARTER_MONTHLY: 'pq_starter_monthly',
  STARTER_ANNUAL: 'pq_starter_annual',
  PRO_MONTHLY: 'pq_pro_monthly',
  PRO_ANNUAL: 'pq_pro_annual',
  SUITE_MONTHLY: 'pq_suite_monthly',
  SUITE_ANNUAL: 'pq_suite_annual',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

interface DigitalGoodsService {
  getDetails(itemIds: string[]): Promise<ItemDetails[]>;
  listPurchases(): Promise<PurchaseDetails[]>;
}

interface ItemDetails {
  itemId: string;
  title: string;
  description: string;
  price: { currency: string; value: string };
  subscriptionPeriod?: string;
}

interface PurchaseDetails {
  itemId: string;
  purchaseToken: string;
}

// Check if we're running inside a TWA with Play Billing
export function isPlayBillingAvailable(): boolean {
  return typeof window !== 'undefined' && 'getDigitalGoodsService' in window;
}

// Get the Digital Goods Service for Google Play
async function getService(): Promise<DigitalGoodsService | null> {
  if (!isPlayBillingAvailable()) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const service = await (window as any).getDigitalGoodsService(
      'https://play.google.com/billing'
    );
    return service;
  } catch {
    console.warn('[Billing] Failed to get Digital Goods Service');
    return null;
  }
}

// Get product details (prices) from Google Play
export async function getProductDetails(
  productIds: string[]
): Promise<ItemDetails[]> {
  const service = await getService();
  if (!service) return [];

  try {
    return await service.getDetails(productIds);
  } catch (err) {
    console.error('[Billing] Failed to get product details:', err);
    return [];
  }
}

// Check existing purchases/subscriptions
export async function checkExistingPurchases(): Promise<PurchaseDetails[]> {
  const service = await getService();
  if (!service) return [];

  try {
    return await service.listPurchases();
  } catch (err) {
    console.error('[Billing] Failed to list purchases:', err);
    return [];
  }
}

// Initiate a purchase through Google Play
export async function purchaseSubscription(
  productId: string
): Promise<{ success: boolean; purchaseToken?: string; error?: string }> {
  if (!isPlayBillingAvailable()) {
    return { success: false, error: 'Google Play Billing not available' };
  }

  try {
    const paymentMethodData = [
      {
        supportedMethods: 'https://play.google.com/billing',
        data: { sku: productId },
      },
    ];

    const paymentDetails = {
      total: {
        label: 'Prime Quote Subscription',
        amount: { currency: 'USD', value: '0' }, // Google Play handles actual pricing
      },
    };

    const request = new PaymentRequest(paymentMethodData, paymentDetails);
    const response = await request.show();

    // Extract the purchase token
    const details = response.details as { purchaseToken: string };
    const purchaseToken = details.purchaseToken;

    // CRITICAL: Verify the purchase on our server
    const verifyResponse = await fetch('/api/billing/verify-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchaseToken,
        productId,
        provider: 'GOOGLE_PLAY',
      }),
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      return { success: false, error: error.message || 'Verification failed' };
    }

    // Complete the payment flow
    await response.complete('success');

    return { success: true, purchaseToken };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'Purchase cancelled by user' };
    }
    console.error('[Billing] Purchase failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Purchase failed',
    };
  }
}

// Map product ID to plan name
export function productIdToPlan(
  productId: string
): { plan: string; period: string } {
  const mapping: Record<string, { plan: string; period: string }> = {
    [PRODUCT_IDS.STARTER_MONTHLY]: { plan: 'STARTER', period: 'MONTHLY' },
    [PRODUCT_IDS.STARTER_ANNUAL]: { plan: 'STARTER', period: 'ANNUAL' },
    [PRODUCT_IDS.PRO_MONTHLY]: { plan: 'PRO', period: 'MONTHLY' },
    [PRODUCT_IDS.PRO_ANNUAL]: { plan: 'PRO', period: 'ANNUAL' },
    [PRODUCT_IDS.SUITE_MONTHLY]: { plan: 'SUITE', period: 'MONTHLY' },
    [PRODUCT_IDS.SUITE_ANNUAL]: { plan: 'SUITE', period: 'ANNUAL' },
  };
  return mapping[productId] || { plan: 'FREE', period: 'MONTHLY' };
}
