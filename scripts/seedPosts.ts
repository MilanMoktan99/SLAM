import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { mockPosts } from '@/data/mockPosts';

/**
 * One-time helper to push your existing mock posts into Firestore. Safe to
 * run more than once — overwrites the same doc IDs rather than duplicating.
 *
 * Note: since createdAt gets set to "now" for all of them, they'll all show
 * up as roughly "just now" instead of the original "2 hours ago" flavor text
 * — that's fine, it's just seed data to test against.
 *
 * Delete this file (and the temporary button that calls it) once you're
 * managing posts for real.
 */
export async function seedPosts(): Promise<number> {
  let count = 0;
  for (const post of mockPosts) {
    await setDoc(doc(db, 'posts', post.id), {
      authorId: null, // these are demo posts, not tied to a real account
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      content: post.content,
      image: post.image ?? null,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: serverTimestamp(),
    });
    count += 1;
  }
  return count;
}