import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getEventById } from '@/services/eventsService';
import { getCurrentUser } from '@/services/userService';
import { rsvpToEvent } from '@/services/rsvpService';
import { getCheckoutResponses, clearCheckoutResponses } from '@/lib/checkoutDraft';
import { recordOrder } from '@/services/ordersService';

const PAYMENT_METHODS = [
  { key: 'paypal', label: 'PayPal', icon: 'logo-paypal' as const },
  { key: 'visa', label: 'Visa', icon: 'card-outline' as const },
  { key: 'mastercard', label: 'Mastercard', icon: 'card' as const },
];

export default function Payment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { user } = useAuth();

  const { data: event, loading: eventLoading } = useAsyncData(() => getEventById(id), [id]);
  const { data: currentUser, loading: userLoading } = useAsyncData(
    () => getCurrentUser(user!.uid),
    [user?.uid]
  );

  const [method, setMethod] = useState('visa');
  const [processing, setProcessing] = useState(false);

  const responses = getCheckoutResponses();

  useEffect(() => {
    // Landed here without completing the form (e.g. a reload wiped the
    // draft) — send them back to fill it in.
    if (!responses) router.replace(`/checkout/${id}`);
  }, [responses, id]);

  const isLoading = eventLoading || userLoading;

  if (isLoading || !event || !responses) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const isVip = !!currentUser?.isVip;
  const price = (isVip ? event.vipPrice : event.standardPrice) ?? 0;
  const savings = isVip && event.standardPrice ? event.standardPrice - price : 0;

  const handlePay = async () => {
    setProcessing(true);
    // No real payment processing — this creates the order record directly.
    // When a real provider (Stripe/PayPal) is integrated, that call goes
    // here and only writes the RSVP once the charge actually succeeds.
    const ticket = {
      orderId: `SLAM-${Date.now().toString(36).toUpperCase()}`,
      amount: price,
      paymentMethod: PAYMENT_METHODS.find((m) => m.key === method)?.label ?? method,
      purchasedAt: new Date().toISOString(),
    };

    const result = await rsvpToEvent(id, user!.uid, responses, ticket);

    if (!result.success) {
      setProcessing(false);
      Alert.alert("Couldn't complete purchase", result.message ?? 'Please try again.');
      return;
    }

    // Record it in the user's purchase history (Settings → Orders & payments).
    await recordOrder(user!.uid, {
      id: ticket.orderId,
      eventId: id,
      eventTitle: event.title,
      amount: ticket.amount,
      paymentMethod: ticket.paymentMethod,
      purchasedAt: ticket.purchasedAt,
    });

    setProcessing(false);
    clearCheckoutResponses();
    router.replace(`/invoice/${id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>{event.title}</Text>
          <Text style={[styles.summaryMeta, { color: colors.subtleText }]}>
            {event.date} · {event.time}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.subtleText }]}>
              Ticket {isVip ? '(VIP price)' : '(Standard)'}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${price}</Text>
          </View>
          {savings > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.primary }]}>VIP savings</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>-${savings}</Text>
            </View>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>${price}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment method</Text>
        {PAYMENT_METHODS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.methodRow,
              {
                backgroundColor: colors.surface,
                borderColor: method === option.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setMethod(option.key)}
            activeOpacity={0.8}
          >
            <Ionicons name={option.icon} size={22} color={colors.primary} />
            <Text style={[styles.methodLabel, { color: colors.text }]}>{option.label}</Text>
            <Ionicons
              name={method === option.key ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={method === option.key ? colors.primary : colors.subtleText}
            />
          </TouchableOpacity>
        ))}

        <View style={[styles.noticeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.subtleText} />
          <Text style={[styles.noticeText, { color: colors.subtleText }]}>
            Payments aren't connected yet — confirming here records your ticket without charging you.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.primary }, processing && styles.disabled]}
          onPress={handlePay}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.payButtonText, { color: colors.onPrimary }]}>Pay ${price}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  summaryTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 4 },
  summaryMeta: { fontSize: 12, fontFamily: AuthFonts.regular },
  divider: { height: 1, marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryLabel: { fontSize: 13, fontFamily: AuthFonts.regular },
  summaryValue: { fontSize: 13, fontFamily: AuthFonts.medium },
  totalLabel: { fontSize: 15, fontFamily: AuthFonts.bold },
  totalValue: { fontSize: 20, fontFamily: AuthFonts.bold },
  sectionTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 12 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  methodLabel: { flex: 1, fontSize: 14, fontFamily: AuthFonts.medium },
  noticeBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  noticeText: { flex: 1, fontSize: 11, fontFamily: AuthFonts.regular, lineHeight: 16 },
  payButton: { borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  payButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  disabled: { opacity: 0.7 },
});