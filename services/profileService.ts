import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Basic display info (name + a generated placeholder avatar) for a user,
 * read from their Firestore profile doc. Used anywhere we need to denormalize
 * "who did this" onto another document (RSVPs, posts, likes, etc.).
 * Swap the generated avatar for their real uploaded photo once Profile photo
 * upload exists.
 */
export async function getDisplayProfile(userId: string): Promise<{ name: string; avatar: string }> {
  const snap = await getDoc(doc(db, 'users', userId));
  const name = snap.exists() ? (snap.data().name ?? 'SLAM Member') : 'SLAM Member';
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E85D75&color=fff`;
  return { name, avatar };
}