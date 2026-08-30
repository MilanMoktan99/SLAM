import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ChatMessage } from '@/types/models';

type Props = {
  message: ChatMessage;
  isMine: boolean;
};

export default function MessageBubble({ message, isMine }: Props) {
  const colors = useThemeColors();

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
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
        <Text style={[styles.text, { color: isMine ? colors.onPrimary : colors.text }]}>{message.text}</Text>
      </View>
      <Text style={[styles.time, { color: colors.subtleText }]}>{message.createdAt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 12, maxWidth: '78%' },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  text: { fontSize: 14, fontFamily: AuthFonts.regular, lineHeight: 19 },
  time: { fontSize: 10, fontFamily: AuthFonts.regular, marginTop: 3, marginHorizontal: 4 },
});