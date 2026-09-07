import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePostsFeed } from '@/hooks/usePostsFeed';
import { usePullToRefresh, useTabPressRefresh } from '@/hooks/useRefresh';
import { useAuth } from '@/context/AuthContext';
import { createPost } from '@/services/postsService';
import { getDisplayProfile } from '@/services/profileService';
import { seedPosts } from '@/scripts/seedPosts'; // TEMP — remove this import once you've seeded once
import { reportContent } from '@/services/moderationService';
import { Post } from '@/types/models';

import PostCard from '@/components/home/PostCard';
import PostComposer from '@/components/community/PostComposer';
import CreatePostModal from '@/components/community/CreatePostModal';
import ActionSheet, { SheetAction } from '@/components/common/ActionSheet';
import ReportModal from '@/components/common/ReportModal';
import PartnersPerksView from '@/components/partners/PartnersPerksView';
import CommentsModal from '@/components/community/CommentsModal';

export default function Community() {
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();

  const {
    posts,
    savedIds,
    loading: postsLoading,
    refresh,
    toggleLike,
    bumpCommentCount,
    toggleSave,
    hidePost,
  } = usePostsFeed();

  const [view, setView] = useState<'feed' | 'partners'>('feed');
  const [menuPost, setMenuPost] = useState<Post | null>(null);
  const [reportPost, setReportPost] = useState<Post | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const { refreshing, onRefresh } = usePullToRefresh(useCallback(() => refresh(), [refresh]));
  useTabPressRefresh(scrollRef, onRefresh);
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

  const handleSubmitPost = async (content: string, image?: string) => {
    // No try/catch here on purpose — if this throws, CreatePostModal's own
    // handler catches it and shows the error inline, and the modal stays
    // open instead of closing on a failed post.
    await createPost(content, user!.uid, image);
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

  const postActions = (post: Post): SheetAction[] => [
    {
      key: 'save',
      label: savedIds.has(post.id) ? 'Remove from saved' : 'Save post',
      icon: savedIds.has(post.id) ? 'bookmark' : 'bookmark-outline',
      description: 'Find it later in Settings → Saved',
      onPress: () => toggleSave(post),
    },
    {
      key: 'share',
      label: 'Share post',
      icon: 'share-outline',
      onPress: () => handleShare(post),
    },
    {
      key: 'hide',
      label: 'Hide post',
      icon: 'eye-off-outline',
      description: "You won't see this in your feed again",
      onPress: () => hidePost(post.id),
    },
    {
      key: 'report',
      label: 'Report post',
      icon: 'flag-outline',
      destructive: true,
      onPress: () => setReportPost(post),
    },
  ];

  const handleReportPost = async (reason: string, details: string) => {
    if (!user || !reportPost) return;
    await reportContent(user.uid, 'post', reportPost.id, reason, details);
    setReportPost(null);
    Alert.alert('Report submitted', 'Thanks — our team will review this post.');
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
          onPress={() =>
            view === 'feed' ? setModalVisible(true) : router.push('/list-business')
          }
          activeOpacity={0.85}
        >
          <Text style={[styles.createButtonText, { color: colors.onPrimary }]}>
            {view === 'feed' ? 'Create Post' : 'List Business'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.viewTabs, { borderBottomColor: colors.border }]}>
        {([
          { key: 'feed', label: 'Feeds' },
          { key: 'partners', label: 'Partners & Perks' },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.viewTab}
            onPress={() => setView(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.viewTabLabel, { color: view === tab.key ? colors.primary : colors.subtleText }]}
            >
              {tab.label}
            </Text>
            {view === tab.key ? (
              <View style={[styles.viewTabUnderline, { backgroundColor: colors.primary }]} />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {view === 'partners' ? (
        <PartnersPerksView bottomPadding={tabBarHeight + 90} />
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: tabBarHeight + 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
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
                isSaved={savedIds.has(post.id)}
                onToggleSave={() => toggleSave(post)}
                onPressMenu={() => setMenuPost(post)}
              />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.subtleText }]}>
              No posts yet — be the first to share something!
            </Text>
          )}
        </ScrollView>
      )}

      {view === 'feed' ? (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, bottom: tabBarHeight + 20 }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color={colors.onPrimary} />
        </TouchableOpacity>
      ) : null}

      <ActionSheet
        visible={!!menuPost}
        title="POST OPTIONS"
        actions={menuPost ? postActions(menuPost) : []}
        onClose={() => setMenuPost(null)}
      />

      <ReportModal
        visible={!!reportPost}
        targetType="post"
        onClose={() => setReportPost(null)}
        onSubmit={handleReportPost}
      />

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
  viewTabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 20 },
  viewTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  viewTabLabel: { fontSize: 14, fontFamily: AuthFonts.bold },
  viewTabUnderline: { position: 'absolute', bottom: -1, height: 2, width: 60, borderRadius: 1 },
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