import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getGroupById } from '@/services/groupsService';
import { listenToGroupMessages, sendGroupMessage } from '@/services/groupChatService';
import { GroupMessage } from '@/types/models';

export default function GroupChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { user } = useAuth();
  const listRef = useRef<FlatList>(null);

  const { data: group } = useAsyncData(() => getGroupById(id), [id]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = listenToGroupMessages(id, (data) => {
      setMessages(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  const handleSend = async () => {
    if (!text.trim() || !user || !id || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      await sendGroupMessage(id, user.uid, content);
    } catch (err) {
      console.error('Failed to send group message:', err);
      setText(content); // restore so they don't lose what they typed
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        {group?.image ? (
          <Image source={{ uri: group.image }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerIcon, { backgroundColor: colors.background }]}>
            <Ionicons name={(group?.icon ?? 'people') as any} size={18} color={colors.primary} />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
            {group?.name ?? 'Group'}
          </Text>
          <Text style={[styles.headerMeta, { color: colors.subtleText }]}>
            {group?.memberCount ?? 0} members
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={36} color={colors.subtleText} />
          <Text style={[styles.emptyText, { color: colors.subtleText }]}>
            No messages yet — say hi to the group!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messagesFlatList}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => {
            const isMine = item.senderId === user?.uid;
            return (
              <View style={[styles.messageRow, isMine ? styles.rowMine : styles.rowTheirs]}>
                {!isMine ? <Image source={{ uri: item.senderAvatar }} style={styles.senderAvatar} /> : null}
                <View style={styles.bubbleWrap}>
                  {!isMine ? (
                    <Text style={[styles.senderName, { color: colors.subtleText }]}>{item.senderName}</Text>
                  ) : null}
                  <View
                    style={[
                      styles.bubble,
                      isMine
                        ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                        : {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderWidth: 1,
                            borderBottomLeftRadius: 4,
                          },
                    ]}
                  >
                    <Text style={[styles.messageText, { color: isMine ? colors.onPrimary : colors.text }]}>
                      {item.text}
                    </Text>
                  </View>
                  <Text style={[styles.time, { color: colors.subtleText }]}>{item.createdAt}</Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
          value={text}
          onChangeText={setText}
          placeholder="Message the group..."
          placeholderTextColor={colors.subtleText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: text.trim() ? colors.primary : colors.border }]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Ionicons name="send" size={18} color={text.trim() ? colors.onPrimary : colors.subtleText} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: 34, height: 34, borderRadius: 10 },
  headerIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  headerName: { fontSize: 15, fontFamily: AuthFonts.bold },
  headerMeta: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyText: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center' },
  messagesFlatList: { flex: 1 },
  messagesList: { padding: 20, paddingBottom: 10 },
  messageRow: { flexDirection: 'row', marginBottom: 12, gap: 8, maxWidth: '85%' },
  rowMine: { alignSelf: 'flex-end' },
  rowTheirs: { alignSelf: 'flex-start' },
  senderAvatar: { width: 28, height: 28, borderRadius: 14, marginTop: 16 },
  bubbleWrap: { flexShrink: 1 },
  senderName: { fontSize: 10, fontFamily: AuthFonts.medium, marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  messageText: { fontSize: 14, fontFamily: AuthFonts.regular, lineHeight: 19 },
  time: { fontSize: 10, fontFamily: AuthFonts.regular, marginTop: 3, marginHorizontal: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: AuthFonts.regular,
    maxHeight: 100,
  },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});