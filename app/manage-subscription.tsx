import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { getVipStatus, cancelVipSubscription, VipStatus } from '@/services/vipService';
import { VIP_PLANS, VIP_BENEFITS, VIP_CANCELLATION_WINDOW_DAYS } from '@/data/vipPlans';
import SettingsHeader from '@/components/settings/SettingsHeader';

function formatDate(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export default function ManageSubscription() {
  const colors = useThemeColors();
  const { user } = useAuth();

  const [status, setStatus] = useState<VipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setStatus(await getVipStatus(user.uid));
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCancel = () => {
    Alert.alert(
      'Cancel VIP?',
      "You'll lose VIP benefits straight away, including unlimited connections and full Who's Going visibility.",
      [
        { text: 'Keep VIP', style: 'cancel' },
        {
          text: 'Cancel subscription',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setCancelling(true);
            const result = await cancelVipSubscription(user.uid);
            setCancelling(false);
            Alert.alert(result.success ? 'Subscription cancelled' : "Couldn't cancel", result.message);
            if (result.success) router.replace('/vip-rewards');
            else load(); // window may have closed since the screen loaded
          },
        },
      ]
    );
  };

  if (loading || !status) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SettingsHeader title="Subscription" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!status.isVip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SettingsHeader title="Subscription" />
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={40} color={colors.subtleText} />
          <Text style={[styles.emptyText, { color: colors.subtleText }]}>
            You're on the free plan. Upgrade to VIP for discounts, unlimited connections and bonus points.
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/vip-rewards')}
            activeOpacity={0.85}
          >
            <Text style={[styles.upgradeText, { color: colors.onPrimary }]}>See VIP plans</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const planDetails = status.plan ? VIP_PLANS[status.plan] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SettingsHeader title="Subscription" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.planCard, { backgroundColor: colors.primary }]}>
          <View style={styles.planHeader}>
            <Ionicons name="star" size={18} color="#FFFFFF" />
            <Text style={styles.planLabel}>Active</Text>
          </View>
          <Text style={styles.planName}>{planDetails?.label ?? 'SLAM VIP'}</Text>
          <Text style={styles.planPrice}>
            ${planDetails?.price} / {planDetails?.period}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row label="Started" value={formatDate(status.startedAt)} />
          <Row label="Renews on" value={formatDate(status.renewsOn)} />
          <Row label="Billing" value={status.plan === 'annual' ? 'Yearly' : 'Monthly'} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Your VIP benefits</Text>
          {VIP_BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        {status.canCancel ? (
          <>
            <View style={[styles.windowBox, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.windowText, { color: colors.text }]}>
                You have {status.daysLeftToCancel} {status.daysLeftToCancel === 1 ? 'day' : 'days'} left to
                cancel for a full refund.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.error }, cancelling && styles.disabled]}
              onPress={handleCancel}
              disabled={cancelling}
              activeOpacity={0.85}
            >
              {cancelling ? (
                <ActivityIndicator color={colors.error} />
              ) : (
                <Text style={[styles.cancelText, { color: colors.error }]}>Cancel subscription</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.windowBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.subtleText} />
              <Text style={[styles.windowText, { color: colors.subtleText }]}>
                Your {VIP_CANCELLATION_WINDOW_DAYS}-day cancellation window has closed. Your VIP plan stays
                active until {formatDate(status.renewsOn)}.
              </Text>
            </View>

            <View style={[styles.cancelButton, styles.disabledButton, { borderColor: colors.border }]}>
              <Text style={[styles.cancelText, { color: colors.subtleText }]}>Cancel subscription</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.subtleText }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 14 },
  emptyText: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center', lineHeight: 19 },
  upgradeButton: { borderRadius: 22, paddingHorizontal: 24, paddingVertical: 12 },
  upgradeText: { fontSize: 13, fontFamily: AuthFonts.bold },
  planCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  planLabel: { color: '#FFFFFF', fontSize: 11, fontFamily: AuthFonts.bold, letterSpacing: 0.5 },
  planName: { color: '#FFFFFF', fontSize: 22, fontFamily: AuthFonts.bold },
  planPrice: { color: '#FFFFFF', fontSize: 13, fontFamily: AuthFonts.regular, opacity: 0.9, marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rowLabel: { fontSize: 13, fontFamily: AuthFonts.regular },
  rowValue: { fontSize: 13, fontFamily: AuthFonts.medium },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  benefitText: { flex: 1, fontSize: 13, fontFamily: AuthFonts.regular },
  windowBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  windowText: { flex: 1, fontSize: 12, fontFamily: AuthFonts.regular, lineHeight: 17 },
  cancelButton: { borderWidth: 1, borderRadius: 26, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 14, fontFamily: AuthFonts.bold },
  disabled: { opacity: 0.7 },
  disabledButton: { opacity: 0.5 },
});