import { collection, getDocs, query, where, limit as fbLimit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { SuggestedPerson } from '@/types/models';

function mapUserDoc(docSnap: any): SuggestedPerson {
  const data = docSnap.data();
  const name = data.name ?? 'SLAM Member';
  return {
    id: docSnap.id,
    name,
    occupation: data.occupation || 'SLAM Member',
    location: data.city || '', // "city" is the public field; "area" stays private
    avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E85D75&color=fff`,
  };
}

/**
 * Returns real registered users to suggest, excluding the current user and
 * anyone who hasn't finished onboarding yet (profileCompleted: false — those
 * profiles are usually still empty placeholders). No real matching/ranking
 * logic yet — this is "everyone else," capped at 50, for MVP.
 */
export async function getSuggestedPeople(currentUserId: string): Promise<SuggestedPerson[]> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('profileCompleted', '==', true), fbLimit(50))
  );
  return snap.docs.filter((d) => d.id !== currentUserId).map(mapUserDoc);
}