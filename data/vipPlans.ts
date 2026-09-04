import { VipPlan } from '@/types/models';

export const VIP_PLANS: Record<VipPlan, { label: string; price: number; period: string; note?: string }> = {
  monthly: { label: 'Monthly VIP', price: 19.99, period: 'month' },
  annual: { label: 'Annual VIP', price: 199, period: 'year', note: 'Save ~17% vs monthly' },
};

/** How long after subscribing a member can still cancel. */
export const VIP_CANCELLATION_WINDOW_DAYS = 7;

export const VIP_BENEFITS = [
  'Event discounts on paid events',
  'VIP-only perks',
  'Bonus SLAM Points (1.5x on everything)',
  'Unlimited event connections',
  "Full Who's Going visibility",
  'Create your own events and groups',
  'Priority access where available',
];