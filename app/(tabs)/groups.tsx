import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { getMyGroups, getSuggestedGroups, joinGroup } from '@/services/groupsService';
import { seedGroups } from '@/scripts/seedGroups'; // TEMP — remove once you've seeded once
import { Group } from '@/types/models';

import SectionHeader from '@/components/home/SectionHeader';
import MyGroupCard from '@/components/groups/MyGroupCard';
import SuggestedGroupRow from '@/components/groups/SuggestedGroupRow';

export default function Groups() {
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [suggested, setSuggested] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [mine, suggestedGroups] = await Promise.all([getMyGroups(user.uid), getSuggestedGroups(user.uid)]);
    setMyGroups(mine);
    setSuggested(suggestedGroups);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleJoin = async (group: Group) => {
    if (!user) return;
    setJoiningId(group.id);
    try {
      await joinGroup(group.id, user.uid);
      await load();
    } catch (err: any) {
      Alert.alert("Couldn't join", err?.message ?? 'Please try again.');
    } finally {
      setJoiningId(null);
    }
  };

  // TEMP — one-time button to push data/mockGroups.ts into Firestore.
  const handleSeed = async () => {
    setSeeding(true);
    try {
      const count = await seedGroups();
      Alert.alert('Seeded', `Added ${count} sample groups to Firestore.`);
      await load();
    } catch (err: any) {
      Alert.alert('Seeding failed', err?.message ?? 'Check your Firestore rules/config.');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: 60, paddingBottom: tabBarHeight + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>Groups</Text>

      {/* TEMP — delete this button once you've seeded Firestore once */}
      <TouchableOpacity
        style={[styles.seedButton, { borderColor: colors.primary }]}
        onPress={handleSeed}
        disabled={seeding}
        activeOpacity={0.8}
      >
        <Text style={[styles.seedButtonText, { color: colors.primary }]}>
          {seeding ? 'Seeding…' : 'DEV: Seed Sample Groups'}
        </Text>
      </TouchableOpacity>

      {myGroups.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="My Groups" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.myGroupsList}
          >
            {myGroups.map((group) => (
              <MyGroupCard key={group.id} group={group} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Suggested Groups" />
        {suggested.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.subtleText }]}>
            You've joined every group so far — nice!
          </Text>
        ) : (
          suggested.map((group) => (
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 20, fontFamily: AuthFonts.bold, paddingHorizontal: 20, marginBottom: 16 },
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
  section: { marginTop: 8, marginBottom: 20 },
  myGroupsList: { paddingHorizontal: 20 },
  emptyText: { paddingHorizontal: 20, fontSize: 13, fontFamily: AuthFonts.regular },
});