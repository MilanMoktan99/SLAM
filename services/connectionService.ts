import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getDisplayProfile } from '@/services/profileService';

export type ConnectionSummary = {
  id: string; // the other person's user id
  name: string;
  avatar: string;
};

async function getMyConnectionDocs(userId: string) {
  return (await getDocs(collection(db, 'users', userId, 'connections'))).docs;
}

/**
 * Single global connection status for a user — one free connection for the
 * whole app, shared across the event attendees page, the general
 * Connections page, and Home's teaser cards.
 */
export async function getConnectionStatus(userId: string) {
  const docs = await getMyConnectionDocs(userId);
  return {
    connectedIds: new Set(docs.map((d) => d.id)),
    hasUsedFree: docs.length > 0,
  };
}

/** Full list of people the given user has connected with, for the
 * "My Connections" screen. */
export async function getMyConnections(userId: string): Promise<ConnectionSummary[]> {
  const docs = await getMyConnectionDocs(userId);
  return docs.map((d) => {
    const data = d.data();
    const name = data.otherUserName || 'SLAM Member';
    return {
      id: d.id,
      name,
      avatar: data.otherUserAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E85D75&color=fff`,
    };
  });
}

type ConnectResult = { success: boolean; message?: string };

/**
 * Connects the current user to another person, respecting the single
 * global free/VIP limit. eventId is optional and purely informational.
 * Now also denormalizes the other person's name/avatar onto the connection
 * doc, so the "My Connections" list can render without extra reads.
 */
export async function connectWithPerson(
  userId: string,
  otherUserId: string,
  isVip: boolean,
  eventId?: string
): Promise<ConnectResult> {
  const existing = await getDoc(doc(db, 'users', userId, 'connections', otherUserId));
  if (existing.exists()) return { success: true };

  if (!isVip) {
    const status = await getConnectionStatus(userId);
    if (status.hasUsedFree) {
      return {
        success: false,
        message: "You've used your free connection — upgrade to VIP for unlimited connections.",
      };
    }
  }

  const { name, avatar } = await getDisplayProfile(otherUserId);

  await setDoc(doc(db, 'users', userId, 'connections', otherUserId), {
    otherUserName: name,
    otherUserAvatar: avatar,
    eventId: eventId ?? null,
    connectedAt: serverTimestamp(),
  });

  return { success: true };
}