import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  isLast?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (v: boolean) => void };
};

export function SettingsRow({ icon, label, value, isLast, destructive, onPress, toggle }: RowProps) {
  const colors = useThemeColors();
  const tint = destructive ? colors.error : colors.text;

  const content = (
    <View style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={17} color={destructive ? colors.error : colors.primary} />
      </View>
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
      {value ? <Text style={[styles.value, { color: colors.subtleText }]}>{value}</Text> : null}
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.subtleText} />
      )}
    </View>
  );

  if (toggle) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.subtleText }]}>{title.toUpperCase()}</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: AuthFonts.bold,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 14, fontFamily: AuthFonts.medium },
  value: { fontSize: 12, fontFamily: AuthFonts.regular, marginRight: 4 },
});