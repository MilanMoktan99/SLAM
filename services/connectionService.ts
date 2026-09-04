import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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

/**
 * Removes a connection and deletes the shared conversation with it.
 *
 * Per the product rule: disconnecting frees up your connection slot (so a
 * free member can connect with someone else), but you lose the chat history
 * with that person — for both sides, since a conversation only exists
 * between the two of you.
 */
export async function disconnectFromPerson(userId: string, otherUserId: string): Promise<void> {
  const { conversationIdFor, deleteConversation } = await import('@/services/chatService');

  // Disconnecting is mutual — it removes the connection for both people, not
  // just the one who tapped it. deleteDoc on a doc that doesn't exist is a
  // harmless no-op, so this is safe even when only one side ever connected.
  await Promise.all([
    deleteDoc(doc(db, 'users', userId, 'connections', otherUserId)),
    deleteDoc(doc(db, 'users', otherUserId, 'connections', userId)),
  ]);

  // The chat always goes with it — there's one shared conversation between
  // the two of you, so deleting it ends the history for both sides.
  await deleteConversation(conversationIdFor(userId, otherUserId));
}