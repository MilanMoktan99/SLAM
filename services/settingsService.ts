import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type NotificationPrefs = {
  likes: boolean;
  comments: boolean;
  events: boolean;
  groups: boolean;
  marketing: boolean;
};

export const defaultNotificationPrefs: NotificationPrefs = {
  likes: true,
  comments: true,
  events: true,
  groups: true,
  marketing: false,
};

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const snap = await getDoc(doc(db, 'users', userId));
  return { ...defaultNotificationPrefs, ...(snap.data()?.notificationPrefs ?? {}) };
}

export async function updateNotificationPrefs(
  userId: string,
  prefs: Partial<NotificationPrefs>
): Promise<void> {
  const current = await getNotificationPrefs(userId);
  await setDoc(doc(db, 'users', userId), { notificationPrefs: { ...current, ...prefs } }, { merge: true });
}

export async function getLanguage(userId: string): Promise<string> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.data()?.language ?? 'en';
}

export async function updateLanguage(userId: string, language: string): Promise<void> {
  await setDoc(doc(db, 'users', userId), { language }, { merge: true });
}