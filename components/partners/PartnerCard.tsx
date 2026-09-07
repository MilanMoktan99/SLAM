import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Partner } from '@/types/models';
import { categoryLabel } from '@/data/partnerCategories';

/** Directory view — who the partner is, rather than the offer itself. */
export default function PartnerCard({ partner, onPress }: { partner: Partner; onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={{ uri: partner.logo }} style={styles.logo} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {partner.name}
        </Text>
        <View style={[styles.categoryPill, { backgroundColor: colors.background }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {categoryLabel(partner.category)}
          </Text>
        </View>
        <Text style={[styles.description, { color: colors.subtleText }]} numberOfLines={2}>
          {partner.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.subtleText} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  logo: { width: 56, height: 56, borderRadius: 12 },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 4 },
  categoryPill: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  categoryText: { fontSize: 10, fontFamily: AuthFonts.bold },
  description: { fontSize: 11, fontFamily: AuthFonts.regular, lineHeight: 15 },
});