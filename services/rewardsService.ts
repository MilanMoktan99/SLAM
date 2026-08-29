import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Reward, RewardRedemption } from '@/types/models';
import { mockRewards } from '@/data/mockRewards';

// Redemption records are still in-memory for now — no dedicated Firestore
// collection for these yet (requirement #15, "mark rewards pending/collected").
// Points are real, though: redeeming genuinely deducts from the user's real
// Firestore balance.
const redemptions: RewardRedemption[] = [];
let nextId = 1;

export async function getRewards(): Promise<Reward[]> {
  return Promise.resolve(mockRewards.filter((reward) => reward.status === 'active'));
}

export async function getRedemptions(): Promise<RewardRedemption[]> {
  return Promise.resolve(redemptions);
}

type RedeemResult = { success: boolean; message: string };

export async function redeemReward(rewardId: string, userId: string): Promise<RedeemResult> {
  const reward = mockRewards.find((r) => r.id === rewardId);
  if (!reward) return { success: false, message: 'Reward not found.' };

  const userSnap = await getDoc(doc(db, 'users', userId));
  const userData = userSnap.exists() ? userSnap.data() : {};
  const isVip = !!userData.isVip;
  const currentPoints = userData.points ?? 0;

  if (reward.vipOnly && !isVip) {
    return { success: false, message: 'This reward is only available to VIP members.' };
  }
  if (currentPoints < reward.pointsRequired) {
    return { success: false, message: "You don't have enough SLAM Points for this reward yet." };
  }

  // setDoc + merge instead of updateDoc — see onboardingService.ts for why:
  // updateDoc requires the doc to already exist, setDoc/merge doesn't.
  await setDoc(doc(db, 'users', userId), { points: increment(-reward.pointsRequired) }, { merge: true });

  redemptions.unshift({
    id: `redeem-${nextId++}`,
    rewardId: reward.id,
    rewardName: reward.name,
    redeemedAt: 'Just now',
    status: 'pending',
  });

  return { success: true, message: `Reward redeemed. ${reward.collectionMethod}.` };
}