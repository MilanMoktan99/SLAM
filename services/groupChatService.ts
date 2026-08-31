import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { GroupMessage } from '@/types/models';
import { getDisplayProfile } from '@/services/profileService';

/**
 * Live messages for a group's chat. Group membership *is* chat access —
 * there's no separate "join the chat" step; anyone in groups/{id}/members
 * can read and post here.
 */
export function listenToGroupMessages(groupId: string, callback: (messages: GroupMessage[]) => void) {
  const q = query(collection(db, 'groups', groupId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((docSnap) => {
          const data = docSnap.data();
          const createdDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          return {
            id: docSnap.id,
            senderId: data.senderId,
            senderName: data.senderName ?? 'SLAM Member',
            senderAvatar: data.senderAvatar ?? '',
            text: data.text,
            createdAt: createdDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          };
        })
      );
    },
    (err) => console.error('Group messages listener error:', err)
  );
}

export async function sendGroupMessage(groupId: string, senderId: string, text: string): Promise<void> {
  const { name, avatar } = await getDisplayProfile(senderId);
  await addDoc(collection(db, 'groups', groupId, 'messages'), {
    senderId,
    senderName: name,
    senderAvatar: avatar,
    text,
    createdAt: serverTimestamp(),
  });
}