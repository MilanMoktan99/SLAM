import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getEventById } from '@/services/eventsService';

export default function Confirmation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { data: event, loading } = useAsyncData(() => getEventById(id), [id]);

  if (loading || !event) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
        <Ionicons name="checkmark" size={44} color="#FFFFFF" />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>You're going!</Text>
      <Text style={[styles.subtitle, { color: colors.subtleText }]}>
        You're confirmed for <Text style={{ fontFamily: AuthFonts.bold }}>{event.title}</Text>
      </Text>

      <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.subtleText} />
          <Text style={[styles.detailText, { color: colors.text }]}>
            {event.date} · {event.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={colors.subtleText} />
          <Text style={[styles.detailText, { color: colors.text }]}>{event.location}</Text>
        </View>
      </View>

      <Text style={[styles.note, { color: colors.subtleText }]}>
        Your RSVP unlocks the event chat, attendee visibility, and 1 free connection for this event.
        Check in at the event to earn your SLAM Points.
      </Text>

      <TouchableOpacity
        style={[styles.homeButton, { backgroundColor: colors.primary }]}
        onPress={() => router.replace('/(tabs)')}
        activeOpacity={0.85}
      >
        <Text style={[styles.homeButtonText, { color: colors.onPrimary }]}>Go back to Home</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace(`/event/${id}`)} activeOpacity={0.7}>
        <Text style={[styles.secondaryLink, { color: colors.primary }]}>View event details</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontFamily: AuthFonts.bold, marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: AuthFonts.regular, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  detailsCard: { alignSelf: 'stretch', borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, marginBottom: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { flex: 1, fontSize: 13, fontFamily: AuthFonts.regular },
  note: { fontSize: 12, fontFamily: AuthFonts.regular, textAlign: 'center', lineHeight: 18, marginBottom: 28 },
  homeButton: { alignSelf: 'stretch', borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginBottom: 14 },
  homeButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  secondaryLink: { fontSize: 13, fontFamily: AuthFonts.medium },
});