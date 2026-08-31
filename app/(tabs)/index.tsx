import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, Share, Alert } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePostsFeed } from '@/hooks/usePostsFeed';
import { useAuth } from '@/context/AuthContext';

import { getUpcomingEvents } from '@/services/eventsService';
import { getSuggestedPeople } from '@/services/peopleService';
import { getCurrentUser } from '@/services/userService';
import { getDisplayProfile } from '@/services/profileService';
import { listenToUnreadCount } from '@/services/notificationsService';
import { getConnectionStatus, connectWithPerson } from '@/services/connectionService';
import { Post } from '@/types/models';

import AppHeader from '@/components/home/AppHeader';
import SectionHeader from '@/components/home/SectionHeader';
import EventCard from '@/components/home/EventCard';
import PersonCard from '@/components/home/PersonCard';
import PostCard from '@/components/home/PostCard';
import VipBanner from '@/components/home/VipBanner';
import CommentsModal from '@/components/community/CommentsModal';

export default function Home() {
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionRefreshKey, setConnectionRefreshKey] = useState(0);

  const { data: events, loading: eventsLoading } = useAsyncData(getUpcomingEvents);
  const { data: people, loading: peopleLoading } = useAsyncData(
    () => getSuggestedPeople(user!.uid),
    [user?.uid]
  );
  const { posts, loading: postsLoading, toggleLike, bumpCommentCount } = usePostsFeed();
  const { data: currentUser, loading: userLoading } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);
  const { data: myProfile } = useAsyncData(() => getDisplayProfile(user!.uid), [user?.uid]);
  const { data: connectionStatus } = useAsyncData(
    () => getConnectionStatus(user!.uid),
    [user?.uid, connectionRefreshKey]
  );

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToUnreadCount(user.uid, setUnreadCount);
    return unsubscribe;
  }, [user]);

  const isLoading = eventsLoading || peopleLoading || postsLoading || userLoading;
  const nextEvent = events?.[0];
  const visiblePeople = (people ?? []).filter((person) => !connectionStatus?.connectedIds.has(person.id));
  const displayAvatar =
    myProfile?.avatar ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email?.split('@')[0] ?? 'Member')}&background=E85D75&color=fff`;

  const handleShare = (post: Post) => {
    Share.share({
      message: `${post.authorName} on SLAM: "${post.content}"`,
    });
  };

  const handleConnect = async (personId: string) => {
    if (!user) return;
    const isVip = !!currentUser?.isVip;
    const result = await connectWithPerson(user.uid, personId, isVip);
    if (!result.success) {
      Alert.alert(
        "Can't connect right now",
        result.message ?? "You've used your free connection — upgrade to VIP for unlimited connections."
      );
      return;
    }
    setConnectionRefreshKey((k) => k + 1); // removes them from this list now that they're connected
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        unreadCount={unreadCount}
        onPressNotifications={() => router.push('/notifications')}
        onPressMessages={() => router.push('/chats')}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {nextEvent ? (
            <View style={styles.section}>
              <SectionHeader title="Upcoming Event" actionLabel="View all" onPressAction={() => router.push('/events')} />
              <EventCard
                event={nextEvent}
                onPressRsvp={() => router.push(`/event/${nextEvent.id}`)}
                onPressAttendees={() => router.push(`/event/${nextEvent.id}/attendees`)}
              />
            </View>
          ) : null}

          {visiblePeople.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Women Near You"
                actionLabel="See all"
                subtitle="Connect people with similar interest"
                onPressAction={() => router.push('/connections')}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.peopleList}
              >
                {visiblePeople.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    connectDisabled={!currentUser?.isVip && !!connectionStatus?.hasUsedFree}
                    onPressConnect={() => handleConnect(person.id)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {posts && posts.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Latest posts"
                actionLabel="View all posts"
                onPressAction={() => router.push('/(tabs)/community')}
              />
              {posts.slice(0, 2).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onToggleLike={() => toggleLike(post.id)}
                  onPressComment={() => setCommentsPostId(post.id)}
                  onPressShare={() => handleShare(post)}
                />
              ))}
            </View>
          ) : null}

          {currentUser && !currentUser.isVip ? (
            <VipBanner onPress={() => router.push('/vip-rewards')} />
          ) : null}
        </ScrollView>
      )}

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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 20, marginBottom: 4 },
  peopleList: { paddingHorizontal: 20 },
});