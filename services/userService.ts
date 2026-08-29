import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { CurrentUser } from '@/types/models';

/**
 * Returns the given user's profile from Firestore.
 * Falls back to sensible defaults for any field that isn't set yet, so
 * screens never have to null-check every property.
 */
export async function getCurrentUser(userId: string): Promise<CurrentUser> {
  if (!userId) {
    // Firestore's own error here is a cryptic "Cannot read property 'indexOf'
    // of undefined" — this turns that into something you can actually act on.
    // Usually means this got called during a brief window where the signed-in
    // user hadn't settled yet (e.g. right around sign-out).
    throw new Error('getCurrentUser was called without a signed-in user.');
  }
  const snap = await getDoc(doc(db, 'users', userId));
  const data = snap.exists() ? snap.data() : {};
  const name = data.name ?? 'SLAM Member';
  return {
    id: userId,
    name,
    avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E85D75&color=fff`,
    bio: data.bio ?? '',
    city: data.city ?? '',
    area: data.area ?? undefined,
    occupation: data.occupation ?? '',
    company: data.company ?? undefined,
    education: data.education ?? undefined,
    dob: data.dob ?? '',
    phone: data.phone ?? '',
    languages: data.languages ?? [],
    interests: data.interests ?? [],
    connectionGoals: data.connectionGoals ?? [],
    email: data.email ?? '',
    isVip: data.isVip ?? false,
    vipPlan: data.vipPlan,
    points: data.points ?? 0,
    profileCompleted: data.profileCompleted ?? false,
    referralCode: data.referralCode ?? '',
    referralCount: data.referralCount ?? 0,
  };
}

/**
 * Updates a piece of the given user's profile — used by the private-info
 * quick-edit modal, the full Edit Profile screen, and VIP upgrades.
 */
export async function updateCurrentUser(userId: string, partial: Partial<CurrentUser>): Promise<CurrentUser> {
  if (!userId) {
    throw new Error('updateCurrentUser was called without a signed-in user.');
  }
  // setDoc + merge instead of updateDoc — see onboardingService.ts for why:
  // updateDoc requires the doc to already exist, setDoc/merge doesn't.
  await setDoc(doc(db, 'users', userId), partial, { merge: true });
  return getCurrentUser(userId);
}