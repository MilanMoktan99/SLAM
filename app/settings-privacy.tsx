import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import SettingsHeader from '@/components/settings/SettingsHeader';

const TOPICS = [
  {
    icon: 'eye-off-outline' as const,
    title: 'What stays private',
    body: 'Your email, phone number, date of birth and exact area are only visible to you. Other members never see them.',
  },
  {
    icon: 'people-outline' as const,
    title: 'What others can see',
    body: 'Your name, photo, bio, city, occupation, interests, languages and what you\u2019re looking to connect for.',
  },
  {
    icon: 'lock-closed-outline' as const,
    title: "Who's Going visibility",
    body: 'Free members see the first three attendees of an event. VIP members can see the full list. Your own attendance is visible to others going to the same event.',
  },
  {
    icon: 'chatbubbles-outline' as const,
    title: 'Messages',
    body: 'Direct messages are between you and the person you connected with. Group messages are visible to everyone in that group.',
  },
  {
    icon: 'server-outline' as const,
    title: 'Your data',
    body: 'Your profile and activity are stored securely. You can edit or remove most information at any time from your profile.',
  },
];

export default function SettingsPrivacy() {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SettingsHeader title="Privacy centre" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.intro, { color: colors.subtleText }]}>
          SLAM is a women's community, and keeping it safe means being clear about what's shared and what
          isn't.
        </Text>

        {TOPICS.map((topic) => (
          <View
            key={topic.title}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                <Ionicons name={topic.icon} size={17} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{topic.title}</Text>
            </View>
            <Text style={[styles.cardBody, { color: colors.subtleText }]}>{topic.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  intro: { fontSize: 13, fontFamily: AuthFonts.regular, lineHeight: 19, marginBottom: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: AuthFonts.bold },
  cardBody: { fontSize: 12, fontFamily: AuthFonts.regular, lineHeight: 18 },
});