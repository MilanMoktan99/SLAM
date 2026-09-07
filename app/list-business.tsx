import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCurrentUser } from '@/services/userService';
import { prepareProfilePhoto } from '@/services/photoService';
import { createPartner } from '@/services/partnersService';
import { PARTNER_CATEGORIES } from '@/data/partnerCategories';
import { PartnerCategory } from '@/types/models';

export default function ListBusiness() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { data: currentUser, loading } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);

  const [name, setName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [category, setCategory] = useState<PartnerCategory>('other');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [perkTitle, setPerkTitle] = useState('');
  const [perkDetails, setPerkDetails] = useState('');
  const [perkCode, setPerkCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add your business logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setLogoUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return setError('Please add your business name.');
    if (!logoUri) return setError('Please add a logo or business image.');
    if (!description.trim()) return setError('Please describe what your business does.');
    if (!perkTitle.trim()) return setError('Please add the perk you\u2019re offering SLAM members.');

    setError('');
    setSaving(true);
    try {
      const logo = await prepareProfilePhoto(logoUri);
      const partnerId = await createPartner(user!.uid, {
        name: name.trim(),
        logo,
        category,
        description: description.trim(),
        website: website.trim() || undefined,
        perkTitle: perkTitle.trim(),
        perkDetails: perkDetails.trim() || undefined,
        perkCode: perkCode.trim() || undefined,
      });
      router.replace(`/partner/${partnerId}`);
    } catch (err: any) {
      console.error('Failed to list business:', err);
      setError(err?.message ?? 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!currentUser?.isVip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="List Your Business" />
        <View style={styles.gateContainer}>
          <Ionicons name="storefront-outline" size={40} color={colors.primary} />
          <Text style={[styles.gateText, { color: colors.text }]}>
            Partnering with SLAM is a VIP feature.
          </Text>
          <Text style={[styles.gateSubtext, { color: colors.subtleText }]}>
            Upgrade to VIP to list your business in the partner directory and offer perks to the community.
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/vip-rewards')}
            activeOpacity={0.85}
          >
            <Text style={[styles.upgradeText, { color: colors.onPrimary }]}>Upgrade to VIP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header title="List Your Business" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.intro, { color: colors.subtleText }]}>
          Join the SLAM partner directory. Offer members a perk, and get your business in front of the
          community.
        </Text>

        <TouchableOpacity style={styles.logoPicker} onPress={handlePickLogo} activeOpacity={0.85}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logo} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="image-outline" size={26} color={colors.primary} />
            </View>
          )}
          <View style={[styles.logoBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Ionicons name={logoUri ? 'pencil' : 'add'} size={13} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.logoLabel, { color: colors.subtleText }]}>Business logo or image *</Text>

        {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

        <Field label="Business name *" value={name} onChangeText={setName} placeholder="e.g. Gwapa Beauty" />

        <Text style={[styles.fieldLabel, { color: colors.primary }]}>Category *</Text>
        <View style={styles.pillRow}>
          {PARTNER_CATEGORIES.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.pill,
                {
                  backgroundColor: category === option.key ? colors.primary : colors.surface,
                  borderColor: category === option.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setCategory(option.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, { color: category === option.key ? colors.onPrimary : colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field
          label="About your business *"
          value={description}
          onChangeText={setDescription}
          placeholder="What do you offer, and who is it for?"
          multiline
        />
        <Field
          label="Website"
          value={website}
          onChangeText={setWebsite}
          placeholder="https://yourbusiness.com.au"
          autoCapitalize="none"
        />

        <View style={[styles.perkSection, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your member perk</Text>
          <Field
            label="Perk headline *"
            value={perkTitle}
            onChangeText={setPerkTitle}
            placeholder="e.g. 20% off Sitewide"
          />
          <Field
            label="Perk details"
            value={perkDetails}
            onChangeText={setPerkDetails}
            placeholder="Any conditions members should know about"
            multiline
          />
          <Field
            label="Promo code"
            value={perkCode}
            onChangeText={setPerkCode}
            placeholder="e.g. SLAM20"
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, saving && styles.disabled]}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>Publish Listing</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Header({ title }: { title: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.primary }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      <View style={{ width: 34 }} />
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'characters' | 'sentences';
}) {
  const colors = useThemeColors();
  return (
    <>
      <Text style={[styles.fieldLabel, { color: colors.primary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textarea,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtleText}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
      />
    </>
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
  gateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  gateText: { fontSize: 15, fontFamily: AuthFonts.bold, textAlign: 'center' },
  gateSubtext: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center', marginBottom: 10, lineHeight: 19 },
  upgradeButton: { borderRadius: 22, paddingHorizontal: 24, paddingVertical: 12 },
  upgradeText: { fontSize: 13, fontFamily: AuthFonts.bold },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  intro: { fontSize: 12, fontFamily: AuthFonts.regular, lineHeight: 18, marginBottom: 20, alignSelf: 'flex-start' },
  logoPicker: { width: 90, height: 90, marginBottom: 6 },
  logo: { width: 90, height: 90, borderRadius: 20 },
  logoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  logoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  logoLabel: { fontSize: 11, fontFamily: AuthFonts.regular, marginBottom: 18 },
  errorText: { fontSize: 12, fontFamily: AuthFonts.medium, marginBottom: 12, alignSelf: 'flex-start' },
  fieldLabel: { fontSize: 12, fontFamily: AuthFonts.bold, marginBottom: 6, alignSelf: 'flex-start' },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: AuthFonts.regular,
    marginBottom: 16,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignSelf: 'flex-start' },
  pill: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  pillText: { fontSize: 11, fontFamily: AuthFonts.medium },
  perkSection: { alignSelf: 'stretch', borderTopWidth: 1, paddingTop: 20, marginTop: 6 },
  sectionTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 14 },
  submitButton: { alignSelf: 'stretch', borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  submitButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  disabled: { opacity: 0.7 },
});