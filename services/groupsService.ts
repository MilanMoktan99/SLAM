import { collection, doc, getDoc, getDocs, setDoc, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Group } from '@/types/models';

function mapGroupDoc(docSnap: any): Group {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    colorLight: data.colorLight,
    colorDark: data.colorDark,
    memberCount: data.memberCount ?? 0,
    postCount: data.postCount ?? 0,
  };
}

async function getJoinedGroupIds(userId: string, groupIds: string[]): Promise<Set<string>> {
  const snaps = await Promise.all(
    groupIds.map((id) => getDoc(doc(db, 'groups', id, 'members', userId)))
  );
  const joined = new Set<string>();
  snaps.forEach((snap, index) => {
    if (snap.exists()) joined.add(groupIds[index]);
  });
  return joined;
}

/** All groups, each tagged with whether the given user has joined. */
async function getAllGroupsWithMembership(userId: string): Promise<Group[]> {
  const snap = await getDocs(collection(db, 'groups'));
  const groups = snap.docs.map(mapGroupDoc);
  const joinedIds = await getJoinedGroupIds(userId, groups.map((g) => g.id));
  return groups.map((group) => ({ ...group, isJoined: joinedIds.has(group.id) }));
}

export async function getMyGroups(userId: string): Promise<Group[]> {
  const groups = await getAllGroupsWithMembership(userId);
  return groups.filter((g) => g.isJoined);
}

export async function getSuggestedGroups(userId: string): Promise<Group[]> {
  const groups = await getAllGroupsWithMembership(userId);
  return groups.filter((g) => !g.isJoined);
}

export async function joinGroup(groupId: string, userId: string): Promise<void> {
  const memberRef = doc(db, 'groups', groupId, 'members', userId);
  const memberSnap = await getDoc(memberRef);
  if (memberSnap.exists()) return; // already joined — no-op

  await setDoc(memberRef, { userId, joinedAt: new Date().toISOString() });
  // setDoc + merge rather than updateDoc — safe even if the group doc
  // somehow doesn't exist yet (same lesson as the profile-doc bug earlier).
  await setDoc(doc(db, 'groups', groupId), { memberCount: increment(1) }, { merge: true });
}