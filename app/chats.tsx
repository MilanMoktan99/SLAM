import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { listenToConversations, getOrCreateConversation } from '@/services/chatService';
import { getSuggestedPeople } from '@/services/peopleService';
import { getMyGroups, getSuggestedGroups, joinGroup } from '@/services/groupsService';
import { getCurrentUser } from '@/services/userService';
import { getConnectionStatus, connectWithPerson } from '@/services/connectionService';
import { Conversation, Group } from '@/types/models';

import SearchBar from '@/components/events/SearchBar';
import ConversationRow from '@/components/chat/ConversationRow';
import SuggestedGroupRow from '@/components/groups/SuggestedGroupRow';

const SUGGESTED_LIMIT = 10;

type Tab = 'chats' | 'groups';

export default function ChatsScreen() {
  const colors = useThemeColors();
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('chats');
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: currentUser } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);
  const { data: myProfile } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);
  const { data: people } = useAsyncData(() => getSuggestedPeople(user!.uid), [user?.uid, refreshKey]);
  const { data: connectionStatus } = useAsyncData(
    () => getConnectionStatus(user!.uid),
    [user?.uid, refreshKey]
  );
  const { data: myGroups } = useAsyncData(() => getMyGroups(user!.uid), [user?.uid, refreshKey]);
  const { data: suggestedGroups } = useAsyncData(
    () => getSuggestedGroups(user!.uid, SUGGESTED_LIMIT),
    [user?.uid, refreshKey]
  );

  const isVip = !!currentUser?.isVip;

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToConversations(user.uid, (data) => {
      setConversations(data);
      setConversationsLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const query = search.trim().toLowerCase();
  const filteredConversations = conversations.filter(
    (c) => !query || c.otherUserName.toLowerCase().includes(query)
  );
  const suggestedPeople = (people ?? [])
    .filter((p) => !connectionStatus?.connectedIds.has(p.id))
    .filter((p) => !query || p.name.toLowerCase().includes(query))
    .slice(0, SUGGESTED_LIMIT);
  const filteredMyGroups = (myGroups ?? []).filter((g) => !query || g.name.toLowerCase().includes(query));
  const filteredSuggestedGroups = (suggestedGroups ?? []).filter(
    (g) => !query || g.name.toLowerCase().includes(query)
  );

  const handleConnect = async (personId: string) => {
    if (!user) return;
    setBusyId(personId);
    const result = await connectWithPerson(user.uid, personId, isVip);
    setBusyId(null);
    if (!result.success) {
      Alert.alert(
        "Can't connect right now",
        result.message ?? "You've used your free connection — upgrade to VIP for unlimited connections."
      );
      return;
    }
    setRefreshKey((k) => k + 1);
  };

  const handleJoinGroup = async (group: Group) => {
    if (!user) return;
    setBusyId(group.id);
    try {
      await joinGroup(group.id, user.uid);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      Alert.alert("Couldn't join", err?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMessagePerson = async (personId: string) => {
    if (!user) return;
    const conversationId = await getOrCreateConversation(user.uid, personId);
    router.push(`/chat/${conversationId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
            {myProfile?.name ?? ''}
          </Text>
          {myProfile?.avatar ? <Image source={{ uri: myProfile.avatar }} style={styles.headerAvatar} /> : null}
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['chats', 'groups'] as Tab[]).map((key) => (
          <TouchableOpacity key={key} style={styles.tabButton} onPress={() => setTab(key)} activeOpacity={0.7}>
            <Text
              style={[
                styles.tabLabel,
                { color: tab === key ? colors.primary : colors.subtleText },
              ]}
            >
              {key === 'chats' ? 'Chats' : 'Groups'}
            </Text>
            {tab === key ? <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} /> : null}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {tab === 'chats' ? (
          <>
            {conversationsLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : filteredConversations.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.subtleText }]}>
                No conversations yet — connect with someone to start chatting.
              </Text>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  isUnread={
                    !!conversation.lastMessageSenderId && conversation.lastMessageSenderId !== user?.uid
                  }
                  onPress={() => router.push(`/chat/${conversation.id}`)}
                />
              ))
            )}

            {suggestedPeople.length > 0 ? (
              <View style={styles.suggestedSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>People to connect with</Text>
                {suggestedPeople.map((person) => (
                  <View
                    key={person.id}
                    style={[styles.personRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Image source={{ uri: person.avatar }} style={styles.personAvatar} />
                    <View style={styles.personInfo}>
                      <Text style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
                        {person.name}
                      </Text>
                      <Text style={[styles.personMeta, { color: colors.subtleText }]} numberOfLines={1}>
                        {person.occupation}
                        {person.location ? ` · ${person.location}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor:
                            !isVip && connectionStatus?.hasUsedFree ? colors.border : colors.primary,
                        },
                      ]}
                      onPress={() => handleConnect(person.id)}
                      disabled={busyId === person.id}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          {
                            color:
                              !isVip && connectionStatus?.hasUsedFree ? colors.subtleText : colors.onPrimary,
                          },
                        ]}
                      >
                        {busyId === person.id ? '…' : 'Connect'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <>
            {filteredMyGroups.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.subtleText }]}>
                You have not joined any groups yet.
              </Text>
            ) : (
              filteredMyGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[styles.groupRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/group-chat/${group.id}`)}
                  activeOpacity={0.7}
                >
                  {group.image ? (
                    <Image source={{ uri: group.image }} style={styles.groupImage} />
                  ) : (
                    <View
                      style={[
                        styles.groupIconBox,
                        { backgroundColor: isDark ? group.colorDark : group.colorLight },
                      ]}
                    >
                      <Ionicons name={group.icon as any} size={22} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.personInfo}>
                    <Text style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
                      {group.name}
                    </Text>
                    <Text style={[styles.personMeta, { color: colors.subtleText }]}>
                      {group.memberCount.toLocaleString()} members
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.subtleText} />
                </TouchableOpacity>
              ))
            )}

            {filteredSuggestedGroups.length > 0 ? (
              <View style={styles.suggestedSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Groups you might like</Text>
                {filteredSuggestedGroups.map((group) => (
                  <SuggestedGroupRow
                    key={group.id}
                    group={group}
                    joining={busyId === group.id}
                    onJoin={() => handleJoinGroup(group)}
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
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
    paddingBottom: 12,
  },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerName: { fontSize: 13, fontFamily: AuthFonts.bold, maxWidth: 140 },
  headerAvatar: { width: 34, height: 34, borderRadius: 17 },
  searchWrapper: { paddingHorizontal: 20, marginBottom: 12 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 20 },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 14, fontFamily: AuthFonts.bold },
  tabUnderline: { position: 'absolute', bottom: -1, height: 2, width: 40, borderRadius: 1 },
  scroll: { paddingTop: 12, paddingBottom: 40 },
  loader: { marginTop: 30 },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 40,
    fontSize: 13,
    fontFamily: AuthFonts.regular,
    lineHeight: 19,
  },
  suggestedSection: { marginTop: 24 },
  sectionTitle: { fontSize: 15, fontFamily: AuthFonts.bold, paddingHorizontal: 20, marginBottom: 12 },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  personAvatar: { width: 48, height: 48, borderRadius: 24 },
  personInfo: { flex: 1 },
  personName: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 2 },
  personMeta: { fontSize: 11, fontFamily: AuthFonts.regular },
  actionButton: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  actionText: { fontSize: 12, fontFamily: AuthFonts.bold },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  groupImage: { width: 48, height: 48, borderRadius: 12 },
  groupIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});