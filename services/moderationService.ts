import { collection, doc, addDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type ReportTargetType = 'post' | 'event' | 'comment' | 'user';

/**
 * Files a report for admin review. Reports go to a top-level "reports"
 * collection so moderators can work through them in one place.
 *
 * TODO(admin): there's no moderation dashboard yet — these are recorded but
 * nothing surfaces them. That's part of the admin tool, not this app.
 */
export async function reportContent(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
  details?: string
): Promise<void> {
  await addDoc(collection(db, 'reports'), {
    reporterId,
    targetType,
    targetId,
    reason,
    details: details ?? null,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

/**
 * Hidden posts are per-user — hiding removes it from your feed only, it
 * doesn't affect anyone else or delete anything.
 */
export async function hidePost(userId: string, postId: string): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'hidden', postId), { hiddenAt: serverTimestamp() });
}

export async function getHiddenPostIds(userId: string): Promise<Set<string>> {
  const snap = await getDocs(collection(db, 'users', userId, 'hidden'));
  return new Set(snap.docs.map((d) => d.id));
}