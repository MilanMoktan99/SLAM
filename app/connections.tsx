import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/context/AuthContext';
import { getSuggestedPeople } from '@/services/peopleService';
import { getCurrentUser } from '@/services/userService';
import { getConnectionStatus, connectWithPerson } from '@/services/connectionService';
import { getOrCreateConversation } from '@/services/chatService';
import { SuggestedPerson } from '@/types/models';
import SearchBar from '@/components/events/SearchBar';

export default function Connections() {
  const colors = useThemeColors();
  const { user: authUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: people, loading: peopleLoading } = useAsyncData(
    () => getSuggestedPeople(authUser!.uid),
    [authUser?.uid]
  );
  const { data: currentUser, loading: userLoading } = useAsyncData(
    () => getCurrentUser(authUser!.uid),
    [authUser?.uid]
  );
  const { data: connectionStatus, loading: statusLoading } = useAsyncData(
    () => getConnectionStatus(authUser!.uid),
    [authUser?.uid, refreshKey]
  );

  const isLoading = peopleLoading || userLoading || statusLoading;
  const isVip = !!currentUser?.isVip;

  const filteredPeople = (people ?? []).filter((person) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      person.name.toLowerCase().includes(query) ||
      person.occupation.toLowerCase().includes(query) ||
      person.location.toLowerCase().includes(query)
    );
  });

  const handleConnect = async (personId: string) => {
    if (!authUser) return;
    setConnectingId(personId);
    const result = await connectWithPerson(authUser.uid, personId, isVip);
    if (!result.success) {
      setConnectingId(null);
      Alert.alert('VIP feature', result.message ?? 'Upgrade to VIP for unlimited connections.');
      return;
    }
    setRefreshKey((k) => k + 1);
    // Drop them straight into the chat so they can say hi right away.
    try {
      const conversationId = await getOrCreateConversation(authUser.uid, personId);
      router.push(`/chat/${conversationId}`);
    } catch (err) {
      console.error('Could not open chat after connecting:', err);
    } finally {
      setConnectingId(null);
    }
  };

  const handleMessage = async (personId: string) => {
    if (!authUser) return;
    setMessagingId(personId);
    try {
      const conversationId = await getOrCreateConversation(authUser.uid, personId);
      router.push(`/chat/${conversationId}`);
    } catch (err: any) {
      Alert.alert("Couldn't open chat", err?.message ?? 'Please try again.');
    } finally {
      setMessagingId(null);
    }
  };

  if (isLoading || !connectionStatus) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Women Near You</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.searchWrapper}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {filteredPeople.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={40} color={colors.subtleText} />
          <Text style={[styles.emptyText, { color: colors.subtleText }]}>
            {search.trim()
              ? 'No one matches your search.'
              : 'No one else has joined yet — check back soon!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPeople}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PersonRow
              person={item}
              isConnected={connectionStatus.connectedIds.has(item.id)}
              connectDisabled={!isVip && connectionStatus.hasUsedFree && !connectionStatus.connectedIds.has(item.id)}
              connecting={connectingId === item.id}
              messaging={messagingId === item.id}
              onConnect={() => handleConnect(item.id)}
              onMessage={() => handleMessage(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

type RowProps = {
  person: SuggestedPerson;
  isConnected: boolean;
  connectDisabled: boolean;
  connecting: boolean;
  messaging: boolean;
  onConnect: () => void;
  onMessage: () => void;
};

function PersonRow({ person, isConnected, connectDisabled, connecting, messaging, onConnect, onMessage }: RowProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: person.avatar }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {person.name}
        </Text>
        <Text style={[styles.meta, { color: colors.subtleText }]} numberOfLines={1}>
          {person.occupation}
        </Text>
        {person.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={11} color={colors.subtleText} />
            <Text style={[styles.meta, { color: colors.subtleText }]}>{person.location}</Text>
          </View>
        ) : null}
      </View>
      {isConnected ? (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onMessage}
          disabled={messaging}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionText, { color: colors.onPrimary }]}>{messaging ? '…' : 'Message'}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: connectDisabled ? colors.border : colors.primary }]}
          onPress={onConnect}
          disabled={connecting}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionText, { color: connectDisabled ? colors.subtleText : colors.onPrimary }]}>
            {connecting ? '…' : 'Connect'}
          </Text>
        </TouchableOpacity>
      )}
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
    paddingBottom: 16,
  },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: AuthFonts.bold },
  searchWrapper: { paddingHorizontal: 20, marginBottom: 16 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center', lineHeight: 19 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 2 },
  meta: { fontSize: 11, fontFamily: AuthFonts.regular },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  actionButton: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  actionText: { fontSize: 12, fontFamily: AuthFonts.bold },
});