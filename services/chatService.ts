import { collection, doc, setDoc, addDoc, getDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Conversation, ChatMessage } from '@/types/models';
import { getDisplayProfile } from '@/services/profileService';
import { formatRelativeTime } from '@/utils/time';

/** Deterministic conversation ID for any pair of users — same regardless of
 * who starts it, so there's never more than one conversation between the
 * same two people. */
function getConversationId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

/**
 * Ensures a conversation exists between two users and returns its ID. Safe
 * to call every time someone opens a chat — setDoc/merge means this never
 * fails even if the conversation already exists (same lesson as the
 * profile-doc bug from earlier: never use updateDoc when the doc might not
 * exist yet).
 */
export async function getOrCreateConversation(uidA: string, uidB: string): Promise<string> {
  const conversationId = getConversationId(uidA, uidB);
  const [profileA, profileB] = await Promise.all([getDisplayProfile(uidA), getDisplayProfile(uidB)]);

  await setDoc(
    doc(db, 'conversations', conversationId),
    {
      participantIds: [uidA, uidB],
      participantInfo: {
        [uidA]: { name: profileA.name, avatar: profileA.avatar },
        [uidB]: { name: profileB.name, avatar: profileB.avatar },
      },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: '',
    },
    { merge: true }
  );

  return conversationId;
}

/** Basic header info (who you're talking to) for the chat thread screen. */
export async function getConversationHeader(conversationId: string, currentUserId: string) {
  const snap = await getDoc(doc(db, 'conversations', conversationId));
  if (!snap.exists()) return null;
  const data = snap.data();
  const otherUserId = (data.participantIds ?? []).find((id: string) => id !== currentUserId) ?? '';
  const otherInfo = data.participantInfo?.[otherUserId] ?? { name: 'SLAM Member', avatar: '' };
  return { otherUserId, otherUserName: otherInfo.name as string, otherUserAvatar: otherInfo.avatar as string };
}

/** Live list of the current user's conversations, most recently active first. */
export function listenToConversations(userId: string, callback: (conversations: Conversation[]) => void) {
  const q = query(
    collection(db, 'conversations'),
    where('participantIds', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const conversations = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        const otherUserId = (data.participantIds ?? []).find((id: string) => id !== userId) ?? '';
        const otherInfo = data.participantInfo?.[otherUserId] ?? { name: 'SLAM Member', avatar: '' };
        const lastMessageDate = data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : new Date();
        return {
          id: docSnap.id,
          otherUserId,
          otherUserName: otherInfo.name,
          otherUserAvatar: otherInfo.avatar,
          lastMessage: data.lastMessage ?? '',
          lastMessageAt: formatRelativeTime(lastMessageDate),
          lastMessageSenderId: data.lastMessageSenderId ?? '',
        };
      });
      callback(conversations);
    },
    (err) => console.error('Conversations listener error:', err)
  );
}

/** Live messages for one conversation thread, oldest first. This is what
 * makes chat feel "live" — no polling, no refresh needed. */
export function listenToMessages(conversationId: string, callback: (messages: ChatMessage[]) => void) {
  const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        const createdDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        return {
          id: docSnap.id,
          senderId: data.senderId,
          text: data.text,
          createdAt: createdDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        };
      });
      callback(messages);
    },
    (err) => console.error('Messages listener error:', err)
  );
}

export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<void> {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, 'conversations', conversationId),
    { lastMessage: text, lastMessageAt: serverTimestamp(), lastMessageSenderId: senderId },
    { merge: true }
  );
}