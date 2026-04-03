/**
 * Subscription gating utility — server-side
 * Controls feature access based on user plan
 */

import { db } from '@/lib/db';

export type Plan = 'FREE' | 'STARTER' | 'PRO' | 'SUITE';

export type Feature =
  | 'quotes_per_month'
  | 'templates'
  | 'white_label'
  | 'digital_signature'
  | 'message_thread'
  | 'export_pdf'
  | 'api_access'
  | 'priority_support';

// Plan limits configuration
const PLAN_LIMITS: Record<Plan, Record<Feature, number | boolean>> = {
  FREE: {
    quotes_per_month: 10,
    templates: 1,
    white_label: false,
    digital_signature: false,
    message_thread: true, // basic
    export_pdf: false,
    api_access: false,
    priority_support: false,
  },
  STARTER: {
    quotes_per_month: 50,
    templates: 3,
    white_label: false,
    digital_signature: true,
    message_thread: true,
    export_pdf: false,
    api_access: false,
    priority_support: true,
  },
  PRO: {
    quotes_per_month: -1, // unlimited
    templates: -1,
    white_label: true,
    digital_signature: true,
    message_thread: true,
    export_pdf: true,
    api_access: false,
    priority_support: true,
  },
  SUITE: {
    quotes_per_month: -1,
    templates: -1,
    white_label: true,
    digital_signature: true,
    message_thread: true,
    export_pdf: true,
    api_access: true,
    priority_support: true,
  },
};

// Plan display info
export const PLAN_INFO: Record<Plan, { name: string; price: number; priceAnnual: number }> = {
  FREE: { name: 'Free', price: 0, priceAnnual: 0 },
  STARTER: { name: 'Starter', price: 9, priceAnnual: 95 },
  PRO: { name: 'Pro', price: 29, priceAnnual: 305 },
  SUITE: { name: 'Suite', price: 89, priceAnnual: 935 },
};

/**
 * Get the active plan for a user, checking subscription validity
 */
export async function getUserPlan(userId: string): Promise<{
  plan: Plan;
  isActive: boolean;
  expiresAt: Date | null;
  provider: string | null;
}> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return { plan: 'FREE', isActive: true, expiresAt: null, provider: null };
  }

  // Check if subscription is expired
  const now = new Date();
  if (
    subscription.expiresAt &&
    subscription.expiresAt < now &&
    subscription.status !== 'active'
  ) {
    // Subscription expired — downgrade to FREE
    await db.subscription.update({
      where: { userId },
      data: { status: 'expired' },
    });
    await db.user.update({
      where: { id: userId },
      data: { plan: 'FREE' },
    });
    return { plan: 'FREE', isActive: false, expiresAt: subscription.expiresAt, provider: subscription.provider };
  }

  const plan = (subscription.plan as Plan) || 'FREE';
  const isActive = subscription.status === 'active';

  return {
    plan: isActive ? plan : 'FREE',
    isActive,
    expiresAt: subscription.expiresAt,
    provider: subscription.provider,
  };
}

/**
 * Check if a specific feature is available for a plan
 */
export function canUseFeature(plan: Plan, feature: Feature): boolean {
  const value = PLAN_LIMITS[plan]?.[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return false;
}

/**
 * Get the numeric limit for a feature (returns -1 for unlimited)
 */
export function getFeatureLimit(plan: Plan, feature: Feature): number {
  const value = PLAN_LIMITS[plan]?.[feature];
  if (typeof value === 'number') return value;
  return value ? 1 : 0;
}

/**
 * Check if user can create another quote this month
 */
export async function canCreateQuote(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  plan: Plan;
}> {
  const { plan } = await getUserPlan(userId);
  const limit = getFeatureLimit(plan, 'quotes_per_month');

  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1, plan };
  }

  // Count quotes created this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await db.quote.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  });

  return {
    allowed: count < limit,
    used: count,
    limit,
    plan,
  };
}
