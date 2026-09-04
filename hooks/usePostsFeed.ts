import { useCallback, useEffect, useState } from 'react';
import { Post } from '@/types/models';
import { getLatestPosts, toggleLike as toggleLikeService } from '@/services/postsService';
import { getSavedPostIds, toggleSavePost } from '@/services/savedService';
import { getHiddenPostIds, hidePost as hidePostService } from '@/services/moderationService';
import { useAuth } from '@/context/AuthContext';

/**
 * Shared feed logic for anywhere posts are shown (Home's preview, Community's
 * full feed). Handles fetching with each post's real liked-by-me state, and
 * optimistic like/unlike with rollback if the write fails.
 */
export function usePostsFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [data, saved, hidden] = await Promise.all([
      getLatestPosts(user?.uid),
      user ? getSavedPostIds(user.uid) : Promise.resolve(new Set<string>()),
      user ? getHiddenPostIds(user.uid) : Promise.resolve(new Set<string>()),
    ]);
    // Hidden posts are filtered out here so every screen using this hook
    // respects them without repeating the logic.
    setPosts(data.filter((post) => !hidden.has(post.id)));
    setSavedIds(saved);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) return;

      // Optimistic update — flip immediately, then confirm with Firestore.
      const applyToggle = (list: Post[]) =>
        list.map((post) =>
          post.id === postId
            ? {
                ...post,
                likedByMe: !post.likedByMe,
                likeCount: post.likedByMe ? post.likeCount - 1 : post.likeCount + 1,
              }
            : post
        );

      setPosts(applyToggle);

      try {
        await toggleLikeService(postId, user.uid);
      } catch {
        // Roll back by applying the same flip again — cancels out cleanly.
        setPosts(applyToggle);
      }
    },
    [user]
  );

  const bumpCommentCount = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post))
    );
  }, []);

  const toggleSave = useCallback(
    async (post: Post) => {
      if (!user) return;
      // Optimistic — flip immediately, roll back if the write fails.
      const wasSaved = savedIds.has(post.id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        wasSaved ? next.delete(post.id) : next.add(post.id);
        return next;
      });
      try {
        await toggleSavePost(user.uid, post);
      } catch (err) {
        console.error('Failed to toggle saved post:', err);
        setSavedIds((prev) => {
          const next = new Set(prev);
          wasSaved ? next.add(post.id) : next.delete(post.id);
          return next;
        });
      }
    },
    [user, savedIds]
  );

  const hidePost = useCallback(
    async (postId: string) => {
      if (!user) return;
      // Remove it from view immediately, then persist.
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      try {
        await hidePostService(user.uid, postId);
      } catch (err) {
        console.error('Failed to hide post:', err);
        refresh(); // put it back if the write failed
      }
    },
    [user, refresh]
  );

  return { posts, savedIds, loading, refresh, toggleLike, bumpCommentCount, toggleSave, hidePost };
}