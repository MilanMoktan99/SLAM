import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AppNotification, NotificationType } from '@/types/models';
import { formatRelativeTime } from '@/utils/time';

function mapDoc(docSnap: any): AppNotification {
  const data = docSnap.data();
  const createdDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
  return {
    id: docSnap.id,
    type: data.type,
    title: data.title,
    body: data.body,
    read: !!data.read,
    createdAt: formatRelativeTime(createdDate),
    actionRoute: data.actionRoute ?? undefined,
  };
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'notifications'), orderBy('createdAt', 'desc'), limit(50))
  );
  return snap.docs.map(mapDoc);
}

/** Live unread-count listener — powers the bell badge on Home. */
export function listenToUnreadCount(userId: string, callback: (count: number) => void) {
  const q = query(collection(db, 'users', userId, 'notifications'), where('read', '==', false));
  return onSnapshot(
    q,
    (snap) => callback(snap.size),
    (err) => console.error('Unread notifications listener error:', err)
  );
}

export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true });
}

export async function markAllAsRead(userId: string): Promise<void> {
  const snap = await getDocs(query(collection(db, 'users', userId, 'notifications'), where('read', '==', false)));
  const batch = writeBatch(db);
  snap.forEach((docSnap) => batch.update(docSnap.ref, { read: true }));
  await batch.commit();
}

type CreateNotificationInput = {
  type: NotificationType;
  title: string;
  body: string;
  actionRoute?: string;
};

/**
 * Creates a notification for the given user. This is called directly from
 * the client at the moment a relevant action happens (someone likes a post,
 * comments, RSVPs, etc.) — there's no backend trigger doing this
 * automatically, since that would need Cloud Functions, which needs the
 * Blaze plan (not available right now, per the earlier Storage discussion).
 *
 * Worth knowing: this means a modified client could technically skip
 * creating a notification, or spoof one for someone else. Fine for MVP;
 * the hardened version moves this into a Cloud Function trigger once
 * Blaze becomes available.
 */
export async function createNotification(userId: string, input: CreateNotificationInput): Promise<void> {
  await addDoc(collection(db, 'users', userId, 'notifications'), {
    ...input,
    read: false,
    createdAt: serverTimestamp(),
  });
}