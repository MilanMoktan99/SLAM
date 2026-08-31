import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getMyConnections } from '@/services/connectionService';
import { getOrCreateConversation } from '@/services/chatService';

export default function MyConnections() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { data: connections, loading } = useAsyncData(() => getMyConnections(user!.uid), [user?.uid]);

  const handleMessage = async (otherUserId: string) => {
    if (!user) return;
    const conversationId = await getOrCreateConversation(user.uid, otherUserId);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Connections</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !connections || connections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={40} color={colors.subtleText} />
          <Text style={[styles.emptyText, { color: colors.subtleText }]}>
            You haven't connected with anyone yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={connections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: colors.primary }]}
                onPress={() => handleMessage(item.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.messageText, { color: colors.onPrimary }]}>Message</Text>
              </TouchableOpacity>
            </View>
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
  avatar: { width: 48, height: 48, borderRadius: 24 },
  name: { flex: 1, fontSize: 14, fontFamily: AuthFonts.bold },
  messageButton: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  messageText: { fontSize: 12, fontFamily: AuthFonts.bold },
});