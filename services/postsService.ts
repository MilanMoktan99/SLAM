import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Post } from '@/types/models';
import { getDisplayProfile } from '@/services/profileService';
import { createNotification } from '@/services/notificationsService';
import { formatRelativeTime } from '@/utils/time';

function mapPostDoc(docSnap: any): Post {
  const data = docSnap.data();
  const createdDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
  return {
    id: docSnap.id,
    authorName: data.authorName,
    authorAvatar: data.authorAvatar,
    postedAt: formatRelativeTime(createdDate),
    content: data.content,
    image: data.image ?? undefined,
    likeCount: data.likeCount ?? 0,
    commentCount: data.commentCount ?? 0,
  };
}

/**
 * Returns the latest posts, newest first. Pass the current user's id to also
 * get each post's `likedByMe` flag populated — this costs one extra read per
 * post right now (fine at MVP scale); switching to a single collectionGroup
 * query on "likes" is the move once the feed gets big, but that needs a
 * Firestore index Firebase will prompt you to create.
 */
export async function getLatestPosts(userId?: string): Promise<Post[]> {
  const snap = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));
  const posts = snap.docs.map(mapPostDoc);

  if (!userId) return posts;

  const likeSnaps = await Promise.all(
    posts.map((post) => getDoc(doc(db, 'posts', post.id, 'likes', userId)))
  );
  return posts.map((post, index) => ({ ...post, likedByMe: likeSnaps[index].exists() }));
}

/**
 * Creates a new post as the given user. No manual "add to top of feed" step
 * needed — Firestore's orderBy('createdAt', 'desc') handles that automatically.
 */
export async function createPost(content: string, userId: string, image?: string): Promise<Post> {
  const { name: userName, avatar: userAvatar } = await getDisplayProfile(userId);

  const docRef = await addDoc(collection(db, 'posts'), {
    authorId: userId,
    authorName: userName,
    authorAvatar: userAvatar,
    content,
    image: image ?? null,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    authorName: userName,
    authorAvatar: userAvatar,
    postedAt: 'Just now',
    content,
    image,
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
  };
}

/**
 * Toggles the given user's like on a post. Uses a transaction so the
 * like/unlike doc and the aggregate count update atomically — no
 * double-counting even if this fires twice in quick succession.
 */
export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean }> {
  const postRef = doc(db, 'posts', postId);
  const likeRef = doc(db, 'posts', postId, 'likes', userId);

  const result = await runTransaction(db, async (transaction) => {
    const likeSnap = await transaction.get(likeRef);

    if (likeSnap.exists()) {
      transaction.delete(likeRef);
      transaction.update(postRef, { likeCount: increment(-1) });
      return { liked: false };
    }

    transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
    transaction.update(postRef, { likeCount: increment(1) });
    return { liked: true };
  });

  if (result.liked) {
    // Best-effort — a failed notification shouldn't undo or block the like itself.
    notifyPostAuthorOfLike(postId, userId).catch((err) => console.error('Failed to notify post author:', err));
  }

  return result;
}

async function notifyPostAuthorOfLike(postId: string, likerId: string): Promise<void> {
  const postSnap = await getDoc(doc(db, 'posts', postId));
  if (!postSnap.exists()) return;
  const postData = postSnap.data();
  if (!postData.authorId || postData.authorId === likerId) return; // never notify yourself

  const { name: likerName } = await getDisplayProfile(likerId);
  await createNotification(postData.authorId, {
    type: 'like',
    title: 'New like',
    body: `${likerName} liked your post.`,
  });
}