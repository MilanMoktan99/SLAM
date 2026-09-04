import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { getCurrentUser } from '@/services/userService';
import { getRewards, redeemReward } from '@/services/rewardsService';
import { getReferralInfo } from '@/services/referralsService';
import { VIP_PLANS } from '@/data/vipPlans';
import { CurrentUser, Reward } from '@/types/models';

import SectionHeader from '@/components/home/SectionHeader';
import PointsWalletCard from '@/components/vip/PointsWalletCard';
import VipPlanCard from '@/components/vip/VipPlanCard';
import RewardCard from '@/components/vip/RewardCard';
import ReferralCard from '@/components/vip/ReferralCard';

const VIP_BENEFITS = [
  'Event discounts',
  'VIP-only perks',
  'Bonus SLAM Points (1.5x)',
  'More event connections',
  "Full Who's Going visibility",
  'Priority access where available',
];

type ReferralInfo = { code: string; count: number; remainingForFreeVip: number };

export default function VipRewards() {
  const colors = useThemeColors();
  const { user: authUser } = useAuth();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    const [userData, rewardsData, referralData] = await Promise.all([
      getCurrentUser(authUser.uid),
      getRewards(),
      getReferralInfo(authUser.uid),
    ]);
    setUser(userData);
    setRewards(rewardsData);
    setReferral(referralData);
    setLoading(false);
  }, [authUser]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Upgrading now goes through the VIP checkout screen, which handles
  // payment method selection and activates the subscription there.
  const handleUpgrade = (plan: 'monthly' | 'annual') => {
    router.push({ pathname: '/vip-checkout', params: { plan } });
  };

  const handleRedeem = async (reward: Reward) => {
    if (!authUser) return;
    const result = await redeemReward(reward.id, authUser.uid);
    Alert.alert(result.success ? 'Reward redeemed' : "Can't redeem yet", result.message);
    if (result.success) loadData();
  };

  const handleShareInvite = () => {
    if (!referral) return;
    Share.share({
      message: `Join me on SLAM! Use my invite code ${referral.code} when you sign up.`,
    });
  };

  if (loading || !user || !referral) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.text }]}>VIP & SLAM Points</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <PointsWalletCard balance={user.points} />

        {!user.isVip ? (
          <View style={styles.section}>
            <SectionHeader title="Upgrade to VIP" subtitle="Event discounts, bonus points, and more" />
            <View style={styles.planRow}>
              <VipPlanCard
                planName="Monthly VIP"
                price={`$${VIP_PLANS.monthly.price}/mo`}
                onPressUpgrade={() => handleUpgrade('monthly')}
              />
              <VipPlanCard
                planName="Annual VIP"
                price={`$${VIP_PLANS.annual.price}/yr`}
                billingNote="Save ~17%"
                badge="Best value"
                onPressUpgrade={() => handleUpgrade('annual')}
              />
            </View>
            <View style={[styles.benefitsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {VIP_BENEFITS.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[styles.benefitText, { color: colors.text }]}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.vipStatusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/manage-subscription')}
            activeOpacity={0.8}
          >
            <Text style={[styles.vipStatusTitle, { color: colors.primary }]}>You're a SLAM VIP</Text>
            <Text style={[styles.vipStatusPlan, { color: colors.subtleText }]}>
              {user.vipPlan === 'annual' ? 'Annual plan' : 'Monthly plan'} · Manage subscription
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <SectionHeader title="Rewards" subtitle="Redeem your SLAM Points" />
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              currentPoints={user.points}
              onRedeem={() => handleRedeem(reward)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Referrals" />
          <ReferralCard
            code={referral.code}
            count={referral.count}
            remainingForFreeVip={referral.remainingForFreeVip}
            onShare={handleShareInvite}
          />
        </View>
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
  pageTitle: { fontSize: 16, fontFamily: AuthFonts.bold },
  section: { marginTop: 8, marginBottom: 20 },
  planRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
  benefitsCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  benefitText: { fontSize: 13, fontFamily: AuthFonts.regular },
  vipStatusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  vipStatusTitle: { fontSize: 17, fontFamily: AuthFonts.bold, marginBottom: 4 },
  vipStatusPlan: { fontSize: 12, fontFamily: AuthFonts.regular },
});