import { useCallback, useEffect, useState } from 'react';
import { Post } from '@/types/models';
import { getLatestPosts, toggleLike as toggleLikeService } from '@/services/postsService';
import { useAuth } from '@/context/AuthContext';

/**
 * Shared feed logic for anywhere posts are shown (Home's preview, Community's
 * full feed). Handles fetching with each post's real liked-by-me state, and
 * optimistic like/unlike with rollback if the write fails.
 */
export function usePostsFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getLatestPosts(user?.uid);
    setPosts(data);
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

  return { posts, loading, refresh, toggleLike, bumpCommentCount };
}