import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { mockGroups } from '@/data/mockGroups';

/**
 * One-time helper to push data/mockGroups.ts into Firestore. Safe to run
 * more than once — overwrites the same doc IDs rather than duplicating.
 * Delete this file (and the temporary button that calls it) once you're
 * managing groups for real.
 */
export async function seedGroups(): Promise<number> {
  let count = 0;
  for (const group of mockGroups) {
    await setDoc(doc(db, 'groups', group.id), {
      name: group.name,
      description: group.description,
      icon: group.icon,
      colorLight: group.colorLight,
      colorDark: group.colorDark,
      memberCount: group.memberCount,
      postCount: group.postCount,
      createdAt: serverTimestamp(),
    });
    count += 1;
  }
  return count;
}