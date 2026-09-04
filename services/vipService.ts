import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { VipPlan } from '@/types/models';
import { VIP_PLANS, VIP_CANCELLATION_WINDOW_DAYS } from '@/data/vipPlans';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type VipStatus = {
  isVip: boolean;
  plan?: VipPlan;
  startedAt?: string;
  /** Whether the member is still inside the cancellation window. */
  canCancel: boolean;
  /** Days remaining in that window (0 once it's closed). */
  daysLeftToCancel: number;
  /** When the plan next renews, based on the plan length. */
  renewsOn?: string;
};

export async function getVipStatus(userId: string): Promise<VipStatus> {
  const snap = await getDoc(doc(db, 'users', userId));
  const data = snap.data() ?? {};

  if (!data.isVip || !data.vipStartedAt) {
    return { isVip: false, canCancel: false, daysLeftToCancel: 0 };
  }

  const startedAt = new Date(data.vipStartedAt);
  const daysSinceStart = Math.floor((Date.now() - startedAt.getTime()) / MS_PER_DAY);
  const daysLeftToCancel = Math.max(0, VIP_CANCELLATION_WINDOW_DAYS - daysSinceStart);

  const renewal = new Date(startedAt);
  if (data.vipPlan === 'annual') renewal.setFullYear(renewal.getFullYear() + 1);
  else renewal.setMonth(renewal.getMonth() + 1);

  return {
    isVip: true,
    plan: data.vipPlan,
    startedAt: data.vipStartedAt,
    canCancel: daysLeftToCancel > 0,
    daysLeftToCancel,
    renewsOn: renewal.toISOString(),
  };
}

/**
 * Activates a VIP subscription. Payment is not actually processed — see the
 * note in vip-checkout.tsx; when a real provider is integrated, this should
 * only run after the charge succeeds.
 */
export async function subscribeToVip(userId: string, plan: VipPlan): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    { isVip: true, vipPlan: plan, vipStartedAt: new Date().toISOString() },
    { merge: true }
  );
}

type CancelResult = { success: boolean; message: string };

/**
 * Cancels a VIP subscription, but only inside the cancellation window.
 * The check is repeated here rather than trusting the UI, so a stale screen
 * can't push through a cancellation that's no longer allowed.
 */
export async function cancelVipSubscription(userId: string): Promise<CancelResult> {
  const status = await getVipStatus(userId);

  if (!status.isVip) {
    return { success: false, message: "You don't have an active VIP subscription." };
  }
  if (!status.canCancel) {
    return {
      success: false,
      message: `Your ${VIP_CANCELLATION_WINDOW_DAYS}-day cancellation window has closed. Your plan will stay active until it renews.`,
    };
  }

  await setDoc(
    doc(db, 'users', userId),
    { isVip: false, vipPlan: null, vipStartedAt: null, vipCancelledAt: new Date().toISOString() },
    { merge: true }
  );

  return { success: true, message: 'Your VIP subscription has been cancelled and refunded.' };
}

export function getPlanPrice(plan: VipPlan): number {
  return VIP_PLANS[plan].price;
}