import React, { useState } from 'react';
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
import { subscribeToVip } from '@/services/vipService';
import { awardPoints } from '@/services/pointsService';
import { recordOrder } from '@/services/ordersService';
import { POINTS_RULES } from '@/data/pointsRules';
import { VIP_PLANS, VIP_BENEFITS, VIP_CANCELLATION_WINDOW_DAYS } from '@/data/vipPlans';
import { VipPlan } from '@/types/models';

const PAYMENT_METHODS = [
  { key: 'paypal', label: 'PayPal', icon: 'logo-paypal' as const },
  { key: 'visa', label: 'Visa', icon: 'card-outline' as const },
  { key: 'mastercard', label: 'Mastercard', icon: 'card' as const },
];

export default function VipCheckout() {
  const { plan: planParam } = useLocalSearchParams<{ plan?: string }>();
  const colors = useThemeColors();
  const { user } = useAuth();

  const plan: VipPlan = planParam === 'annual' ? 'annual' : 'monthly';
  const planDetails = VIP_PLANS[plan];

  const [method, setMethod] = useState('visa');
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    setProcessing(true);
    try {
      // No real payment processing yet — when a provider is integrated,
      // the charge happens here and only a successful charge should
      // activate the subscription below.
      await subscribeToVip(user.uid, plan);
      await awardPoints(user.uid, 'Joined VIP', POINTS_RULES.joinVip);
      await recordOrder(user.uid, {
        id: `VIP-${Date.now().toString(36).toUpperCase()}`,
        eventId: '',
        eventTitle: `${planDetails.label} subscription`,
        amount: planDetails.price,
        paymentMethod: PAYMENT_METHODS.find((m) => m.key === method)?.label ?? method,
        purchasedAt: new Date().toISOString(),
      });

      router.replace('/manage-subscription');
    } catch (err: any) {
      console.error('VIP subscription failed:', err);
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
      setProcessing(false);
    }
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Upgrade to VIP</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.planCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.planLabel}>{planDetails.label}</Text>
          <Text style={styles.planPrice}>
            ${planDetails.price}
            <Text style={styles.planPeriod}> / {planDetails.period}</Text>
          </Text>
          {planDetails.note ? <Text style={styles.planNote}>{planDetails.note}</Text> : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>What you get</Text>
          {VIP_BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
            </View>
          ))}
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

        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.subtleText }]}>{planDetails.label}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${planDetails.price}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total due today</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>${planDetails.price}</Text>
          </View>
        </View>

        <View style={[styles.noticeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.subtleText }]}>
            Changed your mind? You can cancel for a full refund within {VIP_CANCELLATION_WINDOW_DAYS} days of
            subscribing. After that your plan runs until it renews.
          </Text>
        </View>

        <View style={[styles.noticeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.subtleText} />
          <Text style={[styles.noticeText, { color: colors.subtleText }]}>
            Payments aren't connected yet — confirming here activates VIP without charging you.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.primary }, processing && styles.disabled]}
          onPress={handleSubscribe}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.payButtonText, { color: colors.onPrimary }]}>
              Subscribe · ${planDetails.price}/{planDetails.period}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  planCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  planLabel: { color: '#FFFFFF', fontSize: 13, fontFamily: AuthFonts.medium, opacity: 0.9 },
  planPrice: { color: '#FFFFFF', fontSize: 32, fontFamily: AuthFonts.bold, marginTop: 4 },
  planPeriod: { fontSize: 14, fontFamily: AuthFonts.regular },
  planNote: { color: '#FFFFFF', fontSize: 12, fontFamily: AuthFonts.regular, opacity: 0.9, marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  cardTitle: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  benefitText: { flex: 1, fontSize: 13, fontFamily: AuthFonts.regular },
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
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 14, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, fontFamily: AuthFonts.regular },
  summaryValue: { fontSize: 13, fontFamily: AuthFonts.medium },
  divider: { height: 1, marginVertical: 10 },
  totalLabel: { fontSize: 15, fontFamily: AuthFonts.bold },
  totalValue: { fontSize: 20, fontFamily: AuthFonts.bold },
  noticeBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  noticeText: { flex: 1, fontSize: 11, fontFamily: AuthFonts.regular, lineHeight: 16 },
  payButton: { borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
  payButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  disabled: { opacity: 0.7 },
});