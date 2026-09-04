import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCurrentUser } from '@/services/userService';
import SettingsHeader from '@/components/settings/SettingsHeader';

export default function SettingsAccountStatus() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { data: currentUser, loading } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);

  if (loading || !currentUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SettingsHeader title="Account status" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const checks = [
    { label: 'Profile photo', done: !!currentUser.avatar },
    { label: 'Bio', done: !!currentUser.bio },
    { label: 'Interests', done: currentUser.interests.length > 0 },
    { label: 'Location', done: !!currentUser.city },
    { label: 'Occupation', done: !!currentUser.occupation },
  ];
  const completed = checks.filter((c) => c.done).length;
  const percent = Math.round((completed / checks.length) * 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SettingsHeader title="Account status" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.statusTitle, { color: colors.text }]}>Account in good standing</Text>
          <Text style={[styles.statusSubtitle, { color: colors.subtleText }]}>
            No restrictions on your account. You have full access to SLAM.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Membership</Text>
          <Row label="Plan" value={currentUser.isVip ? 'SLAM VIP' : 'Free member'} />
          {currentUser.isVip && currentUser.vipPlan ? (
            <Row label="Billing" value={currentUser.vipPlan === 'annual' ? 'Annual' : 'Monthly'} />
          ) : null}
          <Row label="SLAM Points" value={currentUser.points.toLocaleString()} />
          <Row label="Referral code" value={currentUser.referralCode || '—'} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Profile completeness</Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${percent}%` }]} />
          </View>
          <Text style={[styles.percentText, { color: colors.subtleText }]}>{percent}% complete</Text>

          {checks.map((check) => (
            <View key={check.label} style={styles.checkRow}>
              <Ionicons
                name={check.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={17}
                color={check.done ? colors.primary : colors.subtleText}
              />
              <Text style={[styles.checkLabel, { color: check.done ? colors.text : colors.subtleText }]}>
                {check.label}
              </Text>
            </View>
          ))}
        </View>
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
  statusCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 20 },
  badge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statusTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 4 },
  statusSubtitle: { fontSize: 12, fontFamily: AuthFonts.regular, textAlign: 'center', lineHeight: 17 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 13, fontFamily: AuthFonts.regular },
  rowValue: { fontSize: 13, fontFamily: AuthFonts.medium },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  percentText: { fontSize: 11, fontFamily: AuthFonts.regular, marginBottom: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  checkLabel: { fontSize: 13, fontFamily: AuthFonts.regular },
});