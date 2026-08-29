import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';

const BENEFITS = ["Full Who's Going visibility", 'Bonus SLAM Points (1.5x)', 'Event discounts'];

type Props = {
  isVip: boolean;
  points: number;
  onPress: () => void;
};

export default function VipPromoCard({ isVip, points, onPress }: Props) {
  const colors = useThemeColors();

  if (isVip) {
    return (
      <TouchableOpacity
        style={[styles.vipCard, { backgroundColor: colors.primary }]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.vipRow}>
          <Ionicons name="star" size={18} color="#FFFFFF" />
          <Text style={styles.vipTitle}>You're a SLAM VIP</Text>
        </View>
        <Text style={styles.vipSubtitle}>{points.toLocaleString()} SLAM Points · Tap to view rewards</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <Text style={styles.title}>Get it all with VIP</Text>
      <Text style={styles.description}>
        Make more meaningful connections. Upgrade to VIP to find your people faster.
      </Text>

      <TouchableOpacity style={styles.upgradeButton} onPress={onPress} activeOpacity={0.85}>
        <Text style={[styles.upgradeButtonText, { color: colors.primary }]}>Upgrade from $19.99/mo</Text>
      </TouchableOpacity>

      <View style={styles.benefitsList}>
        {BENEFITS.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.pointsNote}>{points.toLocaleString()} SLAM Points · Tap to view rewards</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, borderRadius: 20, padding: 20 },
  vipCard: { marginHorizontal: 20, borderRadius: 20, padding: 20 },
  vipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  vipTitle: { color: '#FFFFFF', fontSize: 16, fontFamily: AuthFonts.bold },
  vipSubtitle: { color: '#FFFFFF', fontSize: 12, fontFamily: AuthFonts.regular, opacity: 0.9 },
  title: { color: '#FFFFFF', fontSize: 17, fontFamily: AuthFonts.bold, marginBottom: 6 },
  description: { color: '#FFFFFF', fontSize: 12, lineHeight: 18, fontFamily: AuthFonts.regular, opacity: 0.95, marginBottom: 14 },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeButtonText: { fontSize: 14, fontFamily: AuthFonts.bold },
  benefitsList: { gap: 8, marginBottom: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { color: '#FFFFFF', fontSize: 12, fontFamily: AuthFonts.regular },
  pointsNote: { color: '#FFFFFF', fontSize: 11, fontFamily: AuthFonts.medium, opacity: 0.9 },
});