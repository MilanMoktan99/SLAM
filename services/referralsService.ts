import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { POINTS_RULES } from '@/data/pointsRules';

// The referral code itself and the count are both real Firestore fields now
// (set at signup / incremented if you build real tracking later). Actually
// crediting a referral when a friend joins still needs a deep-link provider
// (e.g. Firebase Dynamic Links) — that part remains future work
// (requirement #15 — "Track referrals" / "See who referred each user").
export async function getReferralInfo(userId: string) {
  const snap = await getDoc(doc(db, 'users', userId));
  const data = snap.exists() ? snap.data() : {};
  const count = data.referralCount ?? 0;
  return {
    code: data.referralCode ?? '',
    count,
    remainingForFreeVip: Math.max(0, POINTS_RULES.referralsForFreeVip - count),
  };
}