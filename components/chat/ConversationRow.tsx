import React from 'react';
import { TouchableOpacity, View, Image, Text, StyleSheet } from 'react-native';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Conversation } from '@/types/models';

type Props = {
  conversation: Conversation;
  isUnread: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

export default function ConversationRow({ conversation, isUnread, onPress, onLongPress }: Props) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      activeOpacity={0.7}
    >
      <Image source={{ uri: conversation.otherUserAvatar }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {conversation.otherUserName}
        </Text>
        <Text
          style={[
            styles.preview,
            { color: isUnread ? colors.text : colors.subtleText, fontFamily: isUnread ? AuthFonts.bold : AuthFonts.regular },
          ]}
          numberOfLines={1}
        >
          {conversation.lastMessage || 'Say hello 👋'}
        </Text>
      </View>
      <View style={styles.rightCol}>
        <Text style={[styles.time, { color: colors.subtleText }]}>{conversation.lastMessageAt}</Text>
        {isUnread ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 3 },
  preview: { fontSize: 12 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  time: { fontSize: 10, fontFamily: AuthFonts.regular },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});