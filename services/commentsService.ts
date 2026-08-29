import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Comment } from '@/types/models';
import { getDisplayProfile } from '@/services/profileService';
import { createNotification } from '@/services/notificationsService';
import { formatRelativeTime } from '@/utils/time';

export async function getComments(postId: string): Promise<Comment[]> {
  const snap = await getDocs(query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc')));
  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    const createdDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
    return {
      id: docSnap.id,
      authorName: data.authorName,
      authorAvatar: data.authorAvatar,
      text: data.text,
      postedAt: formatRelativeTime(createdDate),
    };
  });
}

/**
 * Adds a comment and bumps the post's commentCount in one go. The count
 * update isn't wrapped in the same transaction as the comment write since
 * neither depends on reading the other — a plain increment() is enough and
 * keeps this simple.
 */
export async function addComment(postId: string, userId: string, text: string): Promise<Comment> {
  const { name, avatar } = await getDisplayProfile(userId);

  const docRef = await addDoc(collection(db, 'posts', postId, 'comments'), {
    authorId: userId,
    authorName: name,
    authorAvatar: avatar,
    text,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });

  notifyPostAuthorOfComment(postId, userId, name).catch((err) =>
    console.error('Failed to notify post author:', err)
  );

  return {
    id: docRef.id,
    authorName: name,
    authorAvatar: avatar,
    text,
    postedAt: 'Just now',
  };
}

async function notifyPostAuthorOfComment(postId: string, commenterId: string, commenterName: string): Promise<void> {
  const postSnap = await getDoc(doc(db, 'posts', postId));
  if (!postSnap.exists()) return;
  const postData = postSnap.data();
  if (!postData.authorId || postData.authorId === commenterId) return;

  await createNotification(postData.authorId, {
    type: 'comment',
    title: 'New comment',
    body: `${commenterName} commented on your post.`,
  });
}