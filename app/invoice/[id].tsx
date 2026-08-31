import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getEventById } from '@/services/eventsService';
import { getRsvpRecord } from '@/services/rsvpService';

export default function Invoice() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { user } = useAuth();

  const { data: event, loading: eventLoading } = useAsyncData(() => getEventById(id), [id]);
  const { data: record, loading: recordLoading } = useAsyncData(
    () => getRsvpRecord(id, user!.uid),
    [id, user?.uid]
  );

  const isLoading = eventLoading || recordLoading;

  if (isLoading || !event || !record) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const ticket = record.ticket;
  const attendeeName = [record.formResponses.firstName, record.formResponses.lastName]
    .filter(Boolean)
    .join(' ');
  const purchaseDate = ticket ? new Date(ticket.purchasedAt).toLocaleDateString() : '';

  const handleShare = () => {
    if (!ticket) return;
    Share.share({
      message: `SLAM ticket — ${event.title}\nOrder: ${ticket.orderId}\n${event.date} · ${event.time}\n${event.location}`,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Your Ticket</Text>
        <TouchableOpacity onPress={handleShare} hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.successRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={30} color="#FFFFFF" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>You're going!</Text>
          <Text style={[styles.successSubtitle, { color: colors.subtleText }]}>
            Show this ticket at the door to check in.
          </Text>
        </View>

        <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.subtleText} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {event.date} · {event.time}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={15} color={colors.subtleText} />
            <Text style={[styles.detailText, { color: colors.text }]}>{event.location}</Text>
          </View>

          <View style={[styles.dashedDivider, { borderColor: colors.border }]} />

          {ticket ? (
            <>
              <Text style={[styles.receiptHeading, { color: colors.primary }]}>Receipt</Text>
              <ReceiptRow label="Order ID" value={ticket.orderId} />
              {attendeeName ? <ReceiptRow label="Attendee" value={attendeeName} /> : null}
              <ReceiptRow label="Payment method" value={ticket.paymentMethod} />
              <ReceiptRow label="Purchased" value={purchaseDate} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total paid</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>${ticket.amount}</Text>
              </View>
            </>
          ) : (
            <Text style={[styles.detailText, { color: colors.subtleText }]}>
              This is a free RSVP — no payment was required.
            </Text>
          )}

          <View
            style={[
              styles.statusPill,
              { backgroundColor: record.checkedIn ? colors.primary : colors.background, borderColor: colors.primary },
            ]}
          >
            <Ionicons
              name={record.checkedIn ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={record.checkedIn ? colors.onPrimary : colors.primary}
            />
            <Text
              style={[styles.statusText, { color: record.checkedIn ? colors.onPrimary : colors.primary }]}
            >
              {record.checkedIn ? 'Checked in' : 'Not checked in yet'}
            </Text>
          </View>
        </View>

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
      </ScrollView>
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, { color: colors.subtleText }]}>{label}</Text>
      <Text style={[styles.receiptValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
  },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: AuthFonts.bold },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  successRow: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  successTitle: { fontSize: 20, fontFamily: AuthFonts.bold, marginBottom: 4 },
  successSubtitle: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center' },
  ticketCard: { alignSelf: 'stretch', borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 24 },
  eventTitle: { fontSize: 16, fontFamily: AuthFonts.bold, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  detailText: { flex: 1, fontSize: 12, fontFamily: AuthFonts.regular },
  dashedDivider: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 16 },
  receiptHeading: { fontSize: 12, fontFamily: AuthFonts.bold, marginBottom: 10 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
  receiptLabel: { fontSize: 12, fontFamily: AuthFonts.regular },
  receiptValue: { fontSize: 12, fontFamily: AuthFonts.medium, flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontFamily: AuthFonts.bold },
  totalValue: { fontSize: 18, fontFamily: AuthFonts.bold },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 16,
  },
  statusText: { fontSize: 11, fontFamily: AuthFonts.bold },
  homeButton: { alignSelf: 'stretch', borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginBottom: 14 },
  homeButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  secondaryLink: { fontSize: 13, fontFamily: AuthFonts.medium },
});