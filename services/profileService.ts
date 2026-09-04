import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Basic display info (name + avatar) for a user, read from their Firestore
 * profile doc. Used anywhere we denormalize "who did this" onto another
 * document (posts, comments, RSVPs, chat participants, group messages).
 *
 * Uses their real uploaded photo when they have one, and only falls back to
 * a generated initials avatar when they don't.
 */
export async function getDisplayProfile(userId: string): Promise<{ name: string; avatar: string }> {
  const snap = await getDoc(doc(db, 'users', userId));
  const data = snap.exists() ? snap.data() : {};
  const name = data.name ?? 'SLAM Member';
  const avatar =
    data.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E85D75&color=fff`;
  return { name, avatar };
}