import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Share } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePostsFeed } from '@/hooks/usePostsFeed';
import { useAuth } from '@/context/AuthContext';
import { createPost } from '@/services/postsService';
import { getDisplayProfile } from '@/services/profileService';
import { seedPosts } from '@/scripts/seedPosts'; // TEMP — remove this import once you've seeded once
import { Post } from '@/types/models';

import PostCard from '@/components/home/PostCard';
import PostComposer from '@/components/community/PostComposer';
import CreatePostModal from '@/components/community/CreatePostModal';
import CommentsModal from '@/components/community/CommentsModal';

export default function Community() {
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();

  const { posts, loading: postsLoading, refresh, toggleLike, bumpCommentCount } = usePostsFeed();
  const { data: myProfile, loading: profileLoading } = useAsyncData(
    () => getDisplayProfile(user!.uid),
    [user?.uid]
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const isLoading = postsLoading || profileLoading;

  // Always have something usable to show, even if the profile fetch failed —
  // this is what guarantees the composer/modal are never just silently
  // missing. Once myProfile loads, it takes over with the real name/avatar.
  const displayName = myProfile?.name ?? user?.email?.split('@')[0] ?? 'SLAM Member';
  const displayAvatar =
    myProfile?.avatar ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E85D75&color=fff`;

  const handleSubmitPost = async (content: string) => {
    // No try/catch here on purpose — if this throws, CreatePostModal's own
    // handler catches it and shows the error inline, and the modal stays
    // open instead of closing on a failed post.
    await createPost(content, user!.uid);
    refresh();
    setModalVisible(false);
  };

  const handleShare = (post: Post) => {
    Share.share({
      message: `${post.authorName} on SLAM: "${post.content}"`,
    });
  };

  // TEMP — one-time button to push data/mockPosts.ts into Firestore.
  // Delete this handler and the button in the JSX below once you've run it once.
  const handleSeed = async () => {
    setSeeding(true);
    try {
      const count = await seedPosts();
      Alert.alert('Seeded', `Added ${count} sample posts to Firestore.`);
      refresh();
    } catch (err: any) {
      Alert.alert('Seeding failed', err?.message ?? 'Check your Firestore rules/config.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.brandRow}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.brandText, { color: colors.text }]}>SLAM</Text>
        </View>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={[styles.createButtonText, { color: colors.onPrimary }]}>Create Post</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: 16, paddingBottom: tabBarHeight + 90 }}
          showsVerticalScrollIndicator={false}
        >
          {/* TEMP — delete this button once you've seeded Firestore once */}
          <TouchableOpacity
            style={[styles.seedButton, { borderColor: colors.primary }]}
            onPress={handleSeed}
            disabled={seeding}
            activeOpacity={0.8}
          >
            <Text style={[styles.seedButtonText, { color: colors.primary }]}>
              {seeding ? 'Seeding…' : 'DEV: Seed Sample Posts'}
            </Text>
          </TouchableOpacity>

          <PostComposer
            userName={displayName}
            userAvatar={displayAvatar}
            onPress={() => setModalVisible(true)}
          />

          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onToggleLike={() => toggleLike(post.id)}
                onPressComment={() => setCommentsPostId(post.id)}
                onPressShare={() => handleShare(post)}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.subtleText }]}>
              No posts yet — be the first to share something!
            </Text>
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: tabBarHeight + 20 }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color={colors.onPrimary} />
      </TouchableOpacity>

      <CreatePostModal
        visible={modalVisible}
        userName={displayName}
        userAvatar={displayAvatar}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitPost}
      />

      <CommentsModal
        visible={!!commentsPostId}
        postId={commentsPostId}
        userAvatar={displayAvatar}
        onClose={() => setCommentsPostId(null)}
        onCommentAdded={bumpCommentCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 24, height: 24 },
  brandText: { fontSize: 18, fontFamily: AuthFonts.bold, letterSpacing: 1 },
  createButton: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  createButtonText: { fontSize: 13, fontFamily: AuthFonts.bold },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 13, fontFamily: AuthFonts.regular },
  seedButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  seedButtonText: { fontSize: 12, fontFamily: AuthFonts.bold },
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});