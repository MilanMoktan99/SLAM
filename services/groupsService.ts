import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Group } from '@/types/models';

export type GroupSort = 'popular' | 'newest' | 'name';

function mapGroupDoc(docSnap: any): Group {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    description: data.description,
    icon: data.icon ?? 'people',
    image: data.image || undefined,
    colorLight: data.colorLight ?? '#F9E1E6',
    colorDark: data.colorDark ?? '#3A2530',
    memberCount: data.memberCount ?? 0,
    postCount: data.postCount ?? 0,
    createdBy: data.createdBy ?? undefined,
  };
}

/** All groups, each tagged with whether the given user has joined. */
export async function getAllGroupsWithMembership(userId: string): Promise<Group[]> {
  const snap = await getDocs(collection(db, 'groups'));
  const groups = snap.docs.map(mapGroupDoc);

  const memberSnaps = await Promise.all(
    groups.map((g) => getDoc(doc(db, 'groups', g.id, 'members', userId)))
  );
  return groups.map((group, i) => ({ ...group, isJoined: memberSnaps[i].exists() }));
}

export async function getMyGroups(userId: string): Promise<Group[]> {
  return (await getAllGroupsWithMembership(userId)).filter((g) => g.isJoined);
}

/** Groups the user hasn't joined. `limit` caps the list (10 on browse screens). */
export async function getSuggestedGroups(userId: string, limit?: number): Promise<Group[]> {
  const groups = (await getAllGroupsWithMembership(userId)).filter((g) => !g.isJoined);
  return typeof limit === 'number' ? groups.slice(0, limit) : groups;
}

export function sortGroups(groups: Group[], sort: GroupSort): Group[] {
  const copy = [...groups];
  if (sort === 'popular') return copy.sort((a, b) => b.memberCount - a.memberCount);
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy; // 'newest' — Firestore already returns roughly creation order
}

export async function joinGroup(groupId: string, userId: string): Promise<void> {
  const memberRef = doc(db, 'groups', groupId, 'members', userId);
  if ((await getDoc(memberRef)).exists()) return; // already joined — no-op

  await setDoc(memberRef, { userId, joinedAt: serverTimestamp() });
  await setDoc(doc(db, 'groups', groupId), { memberCount: increment(1) }, { merge: true });
}

type CreateGroupInput = {
  name: string;
  description: string;
  image?: string;
};

/**
 * Creates a group and auto-joins the creator (so it lands straight in their
 * "My Groups" and they can immediately use the group chat).
 * VIP-gating is enforced at the UI layer — see create-group.tsx.
 */
export async function createGroup(userId: string, input: CreateGroupInput): Promise<string> {
  const docRef = await addDoc(collection(db, 'groups'), {
    name: input.name,
    description: input.description,
    image: input.image ?? null,
    icon: 'people',
    colorLight: '#F9E1E6',
    colorDark: '#3A2530',
    memberCount: 0,
    postCount: 0,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });

  await joinGroup(docRef.id, userId);
  return docRef.id;
}

export async function getGroupById(groupId: string): Promise<Group | undefined> {
  const snap = await getDoc(doc(db, 'groups', groupId));
  return snap.exists() ? mapGroupDoc(snap) : undefined;
}