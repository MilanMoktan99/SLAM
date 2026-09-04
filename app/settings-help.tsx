import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import SettingsHeader from '@/components/settings/SettingsHeader';

const FAQS = [
  {
    q: 'How do SLAM Points work?',
    a: 'You earn points for real participation — creating your account, completing your profile, checking in at events, joining VIP and inviting friends. Points can be redeemed for event credit, merch and VIP upgrades. VIP members earn points faster.',
  },
  {
    q: 'What do I get with VIP?',
    a: 'Event discounts, VIP-only perks, bonus SLAM Points, more event connections, full Who\u2019s Going visibility and priority access where available.',
  },
  {
    q: 'Why can I only connect with one person?',
    a: 'Free members get one connection. VIP members get unlimited connections across events and the community.',
  },
  {
    q: 'How do I RSVP to an event?',
    a: 'Open the event, tap RSVP or Get Tickets, and fill in the short form from the host. Free events confirm straight away; paid events go through checkout first.',
  },
  {
    q: 'How do I create a group or event?',
    a: 'Hosting groups and events is a VIP feature. Once you\u2019re VIP, use the Create button on the Groups or Events page.',
  },
  {
    q: "I checked in but didn't get points",
    a: 'Points are only awarded for checking in at the event, not for RSVPing. Make sure you tapped Check In on the event page while you were there.',
  },
];

export default function SettingsHelp() {
  const colors = useThemeColors();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SettingsHeader title="Help" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently asked</Text>

        {FAQS.map((faq, index) => (
          <TouchableOpacity
            key={faq.q}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setOpenIndex(openIndex === index ? null : index)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.question, { color: colors.text }]}>{faq.q}</Text>
              <Ionicons
                name={openIndex === index ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.subtleText}
              />
            </View>
            {openIndex === index ? (
              <Text style={[styles.answer, { color: colors.subtleText }]}>{faq.a}</Text>
            ) : null}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 12 }]}>Still need help?</Text>
        <TouchableOpacity
          style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => Linking.openURL('mailto:support@slamsociety.com')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
            <Ionicons name="mail-outline" size={17} color={colors.primary} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactLabel, { color: colors.text }]}>Email support</Text>
            <Text style={[styles.contactValue, { color: colors.subtleText }]}>support@slamsociety.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.subtleText} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  question: { flex: 1, fontSize: 13, fontFamily: AuthFonts.medium },
  answer: { fontSize: 12, fontFamily: AuthFonts.regular, lineHeight: 18, marginTop: 10 },
  contactCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 14, fontFamily: AuthFonts.medium, marginBottom: 2 },
  contactValue: { fontSize: 12, fontFamily: AuthFonts.regular },
});