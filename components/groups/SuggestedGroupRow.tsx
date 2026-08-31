import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Group } from '@/types/models';

type Props = {
  group: Group;
  joining?: boolean;
  onJoin?: () => void;
};

export default function SuggestedGroupRow({ group, joining, onJoin }: Props) {
  const colors = useThemeColors();
  const isDark = useColorScheme() === 'dark';

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {group.image ? (
        <Image source={{ uri: group.image }} style={styles.image} />
      ) : (
        <View style={[styles.iconBox, { backgroundColor: isDark ? group.colorDark : group.colorLight }]}>
          <Ionicons name={group.icon as any} size={22} color={colors.primary} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={[styles.description, { color: colors.subtleText }]} numberOfLines={1}>
          {group.description}
        </Text>
        <Text style={[styles.meta, { color: colors.subtleText }]}>
          {group.memberCount.toLocaleString()} joined
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.joinButton, { backgroundColor: colors.primary }]}
        onPress={onJoin}
        disabled={joining}
        activeOpacity={0.85}
      >
        <Text style={[styles.joinText, { color: colors.onPrimary }]}>{joining ? '…' : 'Join'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  image: { width: 52, height: 52, borderRadius: 12 },
  iconBox: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 2 },
  description: { fontSize: 11, fontFamily: AuthFonts.regular, marginBottom: 2 },
  meta: { fontSize: 11, fontFamily: AuthFonts.regular },
  joinButton: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8 },
  joinText: { fontSize: 12, fontFamily: AuthFonts.bold },
});