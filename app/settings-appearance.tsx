import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useThemePreference, ThemePreference } from '@/context/ThemeContext';
import SettingsHeader from '@/components/settings/SettingsHeader';

const OPTIONS: { key: ThemePreference; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'light', label: 'Light', description: 'Always use the light theme', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', description: 'Always use the dark theme', icon: 'moon-outline' },
  {
    key: 'system',
    label: 'Use device settings',
    description: "Match whatever your phone is set to",
    icon: 'phone-portrait-outline',
  },
];

export default function SettingsAppearance() {
  const colors = useThemeColors();
  const { preference, setPreference } = useThemePreference();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SettingsHeader title="Appearance" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.row,
                index < OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={() => setPreference(option.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                <Ionicons name={option.icon} size={17} color={colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.label, { color: colors.text }]}>{option.label}</Text>
                <Text style={[styles.description, { color: colors.subtleText }]}>{option.description}</Text>
              </View>
              <Ionicons
                name={preference === option.key ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={preference === option.key ? colors.primary : colors.subtleText}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.note, { color: colors.subtleText }]}>
          Your choice is saved on this device and applies across the app.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 16, gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: 14, fontFamily: AuthFonts.medium, marginBottom: 2 },
  description: { fontSize: 11, fontFamily: AuthFonts.regular },
  note: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 14, textAlign: 'center', lineHeight: 16 },
});