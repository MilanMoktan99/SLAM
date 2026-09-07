import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getPartnerById } from '@/services/partnersService';
import { getCurrentUser } from '@/services/userService';
import { categoryLabel } from '@/data/partnerCategories';

export default function PartnerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { user } = useAuth();

  const { data: partner, loading } = useAsyncData(() => getPartnerById(id), [id]);
  const { data: currentUser } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);

  const isVip = !!currentUser?.isVip;

  if (loading || !partner) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const locked = partner.vipOnly && !isVip;

  // Uses the share sheet rather than a clipboard dependency — tapping lets
  // you send the code to yourself, or copy it from the share menu.
  const handleShareCode = () => {
    if (!partner.perkCode) return;
    Share.share({ message: `${partner.name} SLAM member code: ${partner.perkCode}` });
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
        <TouchableOpacity
          onPress={() =>
            Share.share({
              message: `${partner.name} — ${partner.perkTitle}\nA SLAM Society member perk.`,
            })
          }
          hitSlop={8}
        >
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: partner.logo }} style={styles.logo} />
        <Text style={[styles.name, { color: colors.text }]}>{partner.name}</Text>
        <View style={[styles.categoryPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {categoryLabel(partner.category)}
          </Text>
        </View>

        <View style={[styles.perkCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.perkLabel}>MEMBER PERK</Text>
          <Text style={styles.perkTitle}>{partner.perkTitle}</Text>
          {partner.perkDetails ? <Text style={styles.perkDetails}>{partner.perkDetails}</Text> : null}
        </View>

        {locked ? (
          <View style={[styles.lockedBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
            <Text style={[styles.lockedText, { color: colors.text }]}>
              This perk is exclusive to SLAM VIP members.
            </Text>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/vip-rewards')}
              activeOpacity={0.85}
            >
              <Text style={[styles.upgradeText, { color: colors.onPrimary }]}>Upgrade to VIP</Text>
            </TouchableOpacity>
          </View>
        ) : partner.perkCode ? (
          <TouchableOpacity
            style={[styles.codeBox, { borderColor: colors.primary, backgroundColor: colors.surface }]}
            onPress={handleShareCode}
            activeOpacity={0.8}
          >
            <View style={styles.codeInfo}>
              <Text style={[styles.codeLabel, { color: colors.subtleText }]}>Promo code</Text>
              <Text style={[styles.codeValue, { color: colors.primary }]}>{partner.perkCode}</Text>
            </View>
            <Ionicons name="share-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.aboutTitle, { color: colors.text }]}>About {partner.name}</Text>
          <Text style={[styles.aboutText, { color: colors.subtleText }]}>{partner.description}</Text>
        </View>

        {partner.website ? (
          <TouchableOpacity
            style={[styles.websiteButton, { borderColor: colors.primary }]}
            onPress={() => Linking.openURL(partner.website!)}
            activeOpacity={0.85}
          >
            <Ionicons name="globe-outline" size={16} color={colors.primary} />
            <Text style={[styles.websiteText, { color: colors.primary }]}>Visit website</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={[styles.footnote, { color: colors.subtleText }]}>
          Show your SLAM membership when redeeming in person. Offers are set by the partner and may change.
        </Text>
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
    paddingBottom: 10,
  },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  logo: { width: 90, height: 90, borderRadius: 20, marginBottom: 12 },
  name: { fontSize: 20, fontFamily: AuthFonts.bold, marginBottom: 8, textAlign: 'center' },
  categoryPill: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 20 },
  categoryText: { fontSize: 11, fontFamily: AuthFonts.bold },
  perkCard: { alignSelf: 'stretch', borderRadius: 18, padding: 18, marginBottom: 16 },
  perkLabel: { color: '#FFFFFF', fontSize: 10, fontFamily: AuthFonts.bold, letterSpacing: 1, opacity: 0.9 },
  perkTitle: { color: '#FFFFFF', fontSize: 19, fontFamily: AuthFonts.bold, marginTop: 6 },
  perkDetails: { color: '#FFFFFF', fontSize: 13, fontFamily: AuthFonts.regular, marginTop: 8, lineHeight: 19, opacity: 0.95 },
  lockedBox: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 16, padding: 18, alignItems: 'center', gap: 10, marginBottom: 16 },
  lockedText: { fontSize: 13, fontFamily: AuthFonts.medium, textAlign: 'center' },
  upgradeButton: { borderRadius: 20, paddingHorizontal: 22, paddingVertical: 10 },
  upgradeText: { fontSize: 13, fontFamily: AuthFonts.bold },
  codeBox: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  codeInfo: { flex: 1 },
  codeLabel: { fontSize: 10, fontFamily: AuthFonts.regular },
  codeValue: { fontSize: 17, fontFamily: AuthFonts.bold, letterSpacing: 1, marginTop: 2 },
  aboutCard: { alignSelf: 'stretch', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  aboutTitle: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 8 },
  aboutText: { fontSize: 13, fontFamily: AuthFonts.regular, lineHeight: 19 },
  websiteButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 13,
    marginBottom: 20,
  },
  websiteText: { fontSize: 14, fontFamily: AuthFonts.bold },
  footnote: { fontSize: 11, fontFamily: AuthFonts.regular, textAlign: 'center', lineHeight: 16 },
});