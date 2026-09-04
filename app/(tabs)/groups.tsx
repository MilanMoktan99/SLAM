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
  Modal,
  RefreshControl,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { getMyGroups, getSuggestedGroups, joinGroup, sortGroups, GroupSort } from '@/services/groupsService';
import { getCurrentUser } from '@/services/userService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePullToRefresh, useTabPressRefresh } from '@/hooks/useRefresh';
import { Group } from '@/types/models';

import SectionHeader from '@/components/home/SectionHeader';
import SearchBar from '@/components/events/SearchBar';
import MyGroupCard from '@/components/groups/MyGroupCard';
import SuggestedGroupRow from '@/components/groups/SuggestedGroupRow';

const SUGGESTED_LIMIT = 10;

const SORT_OPTIONS: { key: GroupSort; label: string }[] = [
  { key: 'popular', label: 'Most members' },
  { key: 'newest', label: 'Newest' },
  { key: 'name', label: 'Name (A–Z)' },
];

export default function Groups() {
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [suggested, setSuggested] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<GroupSort>('popular');
  const [filterVisible, setFilterVisible] = useState(false);

  const { data: currentUser } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);
  const isVip = !!currentUser?.isVip;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [mine, suggestedGroups] = await Promise.all([
      getMyGroups(user.uid),
      getSuggestedGroups(user.uid, SUGGESTED_LIMIT),
    ]);
    setMyGroups(mine);
    setSuggested(suggestedGroups);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const scrollRef = useRef<ScrollView>(null);
  const { refreshing, onRefresh } = usePullToRefresh(load);
  useTabPressRefresh(scrollRef, onRefresh);

  const handleJoin = async (group: Group) => {
    if (!user) return;
    setJoiningId(group.id);
    try {
      await joinGroup(group.id, user.uid);
      await load(); // moves it out of Suggested and into My Groups
    } catch (err: any) {
      Alert.alert("Couldn't join", err?.message ?? 'Please try again.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreatePress = () => {
    if (!isVip) {
      Alert.alert('VIP feature', 'You need to upgrade to VIP to create groups.');
      return;
    }
    router.push('/create-group');
  };

  const matchesSearch = (group: Group) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return group.name.toLowerCase().includes(query) || group.description.toLowerCase().includes(query);
  };

  const visibleMyGroups = myGroups.filter(matchesSearch);
  const visibleSuggested = sortGroups(suggested.filter(matchesSearch), sort);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.brandRow}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.brandText, { color: colors.text }]}>SLAM</Text>
        </View>
        <TouchableOpacity onPress={() => setFilterVisible(true)}>
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <View style={styles.searchWrapper}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>

        {visibleMyGroups.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="My Groups"
              actionLabel="See all"
              onPressAction={() => router.push('/my-groups')}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.myGroupsList}>
              {visibleMyGroups.map((group) => (
                <MyGroupCard
                  key={group.id}
                  group={group}
                  onPressChat={() => router.push(`/group-chat/${group.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Suggested Groups" actionLabel="Create" onPressAction={handleCreatePress} />
          {visibleSuggested.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.subtleText }]}>
              {search.trim() ? 'No groups match your search.' : "You've joined every group so far — nice!"}
            </Text>
          ) : (
            visibleSuggested.map((group) => (
              <SuggestedGroupRow
                key={group.id}
                group={group}
                joining={joiningId === group.id}
                onJoin={() => handleJoin(group)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setFilterVisible(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sort groups by</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.modalOption}
                onPress={() => {
                  setSort(option.key);
                  setFilterVisible(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: colors.text }]}>{option.label}</Text>
                {sort === option.key ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  searchWrapper: { paddingHorizontal: 20, marginBottom: 8 },
  section: { marginTop: 16 },
  myGroupsList: { paddingHorizontal: 20 },
  emptyText: { paddingHorizontal: 20, fontSize: 13, fontFamily: AuthFonts.regular },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  modalTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 12 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  modalOptionText: { fontSize: 14, fontFamily: AuthFonts.regular },
});