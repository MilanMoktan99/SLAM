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
import { getConversationHeader, listenToMessages, sendMessage } from '@/services/chatService';
import { ChatMessage } from '@/types/models';
import MessageBubble from '@/components/chat/MessageBubble';

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { user } = useAuth();
  const listRef = useRef<FlatList>(null);

  const [header, setHeader] = useState<{ otherUserName: string; otherUserAvatar: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    getConversationHeader(id, user.uid).then(setHeader);
  }, [id, user?.uid]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = listenToMessages(id, (data) => {
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
      await sendMessage(id, user.uid, content);
    } catch (err: any) {
      console.error('Failed to send message:', err);
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
        {header ? (
          <>
            <Image source={{ uri: header.otherUserAvatar }} style={styles.headerAvatar} />
            <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
              {header.otherUserName}
            </Text>
          </>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messagesFlatList}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => <MessageBubble message={item} isMine={item.senderId === user?.uid} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
          value={text}
          onChangeText={setText}
          placeholder="Message..."
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
  headerAvatar: { width: 34, height: 34, borderRadius: 17 },
  headerName: { fontSize: 15, fontFamily: AuthFonts.bold, flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messagesFlatList: { flex: 1 },
  messagesList: { padding: 20, paddingBottom: 10 },
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