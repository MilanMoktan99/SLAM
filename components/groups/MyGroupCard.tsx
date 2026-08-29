import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Group } from '@/types/models';

type Props = {
  group: Group;
  onPress?: () => void;
};

export default function MyGroupCard({ group, onPress }: Props) {
  const colors = useThemeColors();
  const isDark = useColorScheme() === 'dark';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? group.colorDark : group.colorLight }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={group.icon as any} size={22} color={colors.primary} />
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {group.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: 110, height: 90, borderRadius: 16, padding: 12, marginRight: 12, justifyContent: 'space-between' },
  name: { fontSize: 12, fontFamily: AuthFonts.bold },
});