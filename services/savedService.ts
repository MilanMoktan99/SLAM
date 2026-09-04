import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Post } from '@/types/models';

/**
 * Saved posts live at users/{uid}/saved/{postId}. The post's content is
 * denormalized onto the saved doc so the Saved screen renders in one read
 * and still works if the original post is later deleted.
 */
export async function getSavedPostIds(userId: string): Promise<Set<string>> {
  const snap = await getDocs(collection(db, 'users', userId, 'saved'));
  return new Set(snap.docs.map((d) => d.id));
}

export async function getSavedPosts(userId: string): Promise<Post[]> {
  const snap = await getDocs(collection(db, 'users', userId, 'saved'));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      authorName: data.authorName,
      authorAvatar: data.authorAvatar,
      postedAt: data.postedAt ?? '',
      content: data.content,
      image: data.image ?? undefined,
      likeCount: data.likeCount ?? 0,
      commentCount: data.commentCount ?? 0,
    };
  });
}

/** Returns true if the post is now saved, false if it was just un-saved. */
export async function toggleSavePost(userId: string, post: Post): Promise<boolean> {
  const ref = doc(db, 'users', userId, 'saved', post.id);
  if ((await getDoc(ref)).exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, {
    authorName: post.authorName,
    authorAvatar: post.authorAvatar,
    postedAt: post.postedAt,
    content: post.content,
    image: post.image ?? null,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    savedAt: serverTimestamp(),
  });
  return true;
}