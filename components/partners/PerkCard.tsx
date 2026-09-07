import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Partner } from '@/types/models';

/** Offer-first view — leads with the discount, matching the website's
 * "Member Perks" directory cards. */
export default function PerkCard({ partner, onPress }: { partner: Partner; onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Image source={{ uri: partner.logo }} style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {partner.name}
          </Text>
          {partner.vipOnly ? (
            <View style={[styles.vipPill, { backgroundColor: colors.primary }]}>
              <Ionicons name="star" size={9} color={colors.onPrimary} />
              <Text style={[styles.vipText, { color: colors.onPrimary }]}>VIP only</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={[styles.perkTitle, { color: colors.primary }]}>{partner.perkTitle}</Text>
      {partner.perkDetails ? (
        <Text style={[styles.perkDetails, { color: colors.subtleText }]} numberOfLines={2}>
          {partner.perkDetails}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  logo: { width: 48, height: 48, borderRadius: 10 },
  headerText: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontFamily: AuthFonts.bold },
  vipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  vipText: { fontSize: 9, fontFamily: AuthFonts.bold },
  perkTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 4 },
  perkDetails: { fontSize: 12, fontFamily: AuthFonts.regular, lineHeight: 17, marginBottom: 12 },
  button: { borderRadius: 20, paddingVertical: 11, alignItems: 'center', marginTop: 6 },
  buttonText: { fontSize: 13, fontFamily: AuthFonts.bold },
});