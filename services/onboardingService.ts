import { doc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { POINTS_RULES } from '@/data/pointsRules';

type ProfileDetails = {
  avatar: string;
  bio: string;
  city: string | null;
  area: string | null;
  dob: string | null;
  occupation: string | null;
  company: string | null;
  education: string | null;
  languages: string[];
  connectionGoals: string[];
};

/**
 * Uses setDoc with merge:true rather than updateDoc. updateDoc requires the
 * document to already exist and throws "No document to update" otherwise —
 * merge:true creates it if it's missing (e.g. an older test account from
 * before signUp() wrote the full initial doc) or merges these fields in if
 * it already exists. Safe either way, self-healing for stale accounts.
 */
export async function saveProfileDetails(userId: string, details: ProfileDetails): Promise<void> {
  await setDoc(doc(db, 'users', userId), details, { merge: true });
}

/**
 * Final onboarding step. Flipping profileCompleted to true is what
 * app/_layout.tsx's Stack.Protected is watching for (via AuthContext's
 * real-time listener) — the moment this write lands, the app redirects into
 * the main tabs automatically. No router call needed for that part.
 *
 * Also credits the client requirement #11 profile-completion bonus (50 pts)
 * in the same write, since VIP is never true this early (no multiplier
 * to worry about) — a plain increment is enough here.
 */
export async function completeOnboarding(userId: string, interests: string[]): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    {
      interests,
      profileCompleted: true,
      points: increment(POINTS_RULES.completeProfile),
    },
    { merge: true }
  );
}