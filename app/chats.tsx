import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { listenToConversations } from '@/services/chatService';
import { Conversation } from '@/types/models';
import ConversationRow from '@/components/chat/ConversationRow';

export default function ChatsScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToConversations(user.uid, (data) => {
      setConversations(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chats</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={40} color={colors.subtleText} />
          <Text style={[styles.emptyText, { color: colors.subtleText }]}>
            No conversations yet — connect with someone at an event to start chatting.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              isUnread={!!item.lastMessageSenderId && item.lastMessageSenderId !== user?.uid}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          )}
        />
      )}
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
    paddingBottom: 16,
  },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: AuthFonts.bold },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center', lineHeight: 19 },
});