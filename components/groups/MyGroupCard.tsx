import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Group } from '@/types/models';

type Props = {
  group: Group;
  onPressChat?: () => void;
};

export default function MyGroupCard({ group, onPressChat }: Props) {
  const colors = useThemeColors();
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {group.image ? (
        <Image source={{ uri: group.image }} style={styles.image} />
      ) : (
        <View style={[styles.iconBox, { backgroundColor: isDark ? group.colorDark : group.colorLight }]}>
          <Ionicons name={group.icon as any} size={24} color={colors.primary} />
        </View>
      )}
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {group.name}
      </Text>
      <TouchableOpacity
        style={[styles.chatButton, { backgroundColor: colors.primary }]}
        onPress={onPressChat}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-outline" size={12} color={colors.onPrimary} />
        <Text style={[styles.chatText, { color: colors.onPrimary }]}>Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 130, borderRadius: 16, borderWidth: 1, padding: 10, marginRight: 12, alignItems: 'center' },
  image: { width: 60, height: 60, borderRadius: 14, marginBottom: 8 },
  iconBox: { width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  name: { fontSize: 12, fontFamily: AuthFonts.bold, textAlign: 'center', marginBottom: 8, minHeight: 30 },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
    paddingVertical: 6,
    width: '100%',
  },
  chatText: { fontSize: 11, fontFamily: AuthFonts.bold },
});