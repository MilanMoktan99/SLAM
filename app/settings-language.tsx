import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { getLanguage, updateLanguage } from '@/services/settingsService';
import SettingsHeader from '@/components/settings/SettingsHeader';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ne', label: 'नेपाली (Nepali)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
];

export default function SettingsLanguage() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [selected, setSelected] = useState('en');

  useEffect(() => {
    if (!user) return;
    getLanguage(user.uid).then(setSelected);
  }, [user]);

  const handleSelect = (code: string) => {
    setSelected(code);
    if (user) updateLanguage(user.uid, code);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SettingsHeader title="Language" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.noticeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.subtleText} />
          <Text style={[styles.noticeText, { color: colors.subtleText }]}>
            SLAM is only available in English right now. Your choice is saved and will apply once other
            languages are added.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {LANGUAGES.map((language, index) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.row,
                index < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={() => handleSelect(language.code)}
              activeOpacity={0.7}
            >
              <Text style={[styles.label, { color: colors.text }]}>{language.label}</Text>
              {selected === language.code ? (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  noticeBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  noticeText: { flex: 1, fontSize: 11, fontFamily: AuthFonts.regular, lineHeight: 16 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  label: { flex: 1, fontSize: 14, fontFamily: AuthFonts.regular },
});