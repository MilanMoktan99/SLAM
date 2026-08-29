import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { POINTS_RULES } from '@/data/pointsRules';

export async function getPointsBalance(userId: string): Promise<number> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data().points ?? 0) : 0;
}

/**
 * Awards points for a real, verified action (never for RSVP alone — see
 * client requirement #11). Applies the VIP 1.5x multiplier automatically.
 * basePoints should be one of the POINTS_RULES values.
 *
 * TODO(firebase): this trusts the client to report "a real action happened,"
 * which is fine for MVP but not tamper-proof — the hardened version moves
 * this into a Cloud Function trigger (e.g. on RSVP checkedIn flipping true)
 * so points can never be awarded by calling this function directly from a
 * modified client.
 */
export async function awardPoints(userId: string, reason: string, basePoints: number): Promise<number> {
  const snap = await getDoc(doc(db, 'users', userId));
  const isVip = snap.exists() ? !!snap.data().isVip : false;
  const multiplier = isVip ? POINTS_RULES.vipMultiplier : 1;
  const earned = Math.round(basePoints * multiplier);
  // setDoc + merge instead of updateDoc — see onboardingService.ts for why:
  // updateDoc requires the doc to already exist, setDoc/merge doesn't.
  await setDoc(doc(db, 'users', userId), { points: increment(earned) }, { merge: true });
  // TODO(firebase): also write a pointsTransactions doc here for a real,
  // auditable history — not needed by any screen yet, so skipped for now.
  return earned;
}