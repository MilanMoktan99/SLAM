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
import { setEventDraft } from '@/lib/eventDraft';
import { defaultFormFields } from '@/data/defaultFormFields';
import { EventCategory, EventPricingType } from '@/types/models';

const CATEGORIES: { key: EventCategory; label: string }[] = [
  { key: 'social', label: 'Social' },
  { key: 'business', label: 'Business' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'getaways', label: 'Getaways' },
];

export default function CreateEvent() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { data: currentUser, loading } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('social');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [pricingType, setPricingType] = useState<EventPricingType>('free');
  const [standardPrice, setStandardPrice] = useState('');
  const [vipPrice, setVipPrice] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add an event image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setImageUri(result.assets[0].uri);
  };

  const handleNext = async () => {
    if (!title.trim()) return setError('Please add an event name.');
    if (!imageUri) return setError('Please add a background image.');
    if (!date.trim()) return setError('Please add a date.');
    if (!time.trim()) return setError('Please add a time.');
    if (!location.trim()) return setError('Please add a location.');
    if (!description.trim()) return setError('Please describe the event.');
    if (pricingType === 'paid') {
      if (!standardPrice.trim() || isNaN(Number(standardPrice))) {
        return setError('Enter a valid standard ticket price.');
      }
      if (!vipPrice.trim() || isNaN(Number(vipPrice))) {
        return setError('Enter a valid VIP ticket price.');
      }
    }

    setError('');
    setProcessing(true);
    try {
      const image = await prepareProfilePhoto(imageUri);
      setEventDraft({
        title: title.trim(),
        category,
        image,
        date: date.trim(),
        time: time.trim(),
        location: location.trim(),
        description: description.trim(),
        pricingType,
        standardPrice: pricingType === 'paid' ? Number(standardPrice) : undefined,
        vipPrice: pricingType === 'paid' ? Number(vipPrice) : undefined,
        capacity: Number(capacity) || 20,
        formFields: defaultFormFields,
      });
      router.push('/create-event-form');
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong preparing your event.');
    } finally {
      setProcessing(false);
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
        <Header title="Create Event" />
        <View style={styles.gateContainer}>
          <Ionicons name="star-outline" size={40} color={colors.primary} />
          <Text style={[styles.gateText, { color: colors.text }]}>Hosting events is a VIP feature.</Text>
          <Text style={[styles.gateSubtext, { color: colors.subtleText }]}>
            Upgrade to VIP to create and host your own SLAM events.
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
      <Header title="Create Event" subtitle="Step 1 of 2 — Event details" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.85}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="image-outline" size={28} color={colors.primary} />
              <Text style={[styles.imagePlaceholderText, { color: colors.subtleText }]}>
                Add background image *
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

        <Field label="Event name *" value={title} onChangeText={setTitle} placeholder="e.g. Walk and Talk — May Edition" />

        <Text style={[styles.fieldLabel, { color: colors.primary }]}>Category</Text>
        <View style={styles.pillRow}>
          {CATEGORIES.map((option) => (
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

        <Field label="Date *" value={date} onChangeText={setDate} placeholder="e.g. 19 May 2026" />
        <Field label="Time *" value={time} onChangeText={setTime} placeholder="e.g. 9:30 am - 11:00 am" />
        <Field label="Location *" value={location} onChangeText={setLocation} placeholder="Venue and address" />
        <Field
          label="About the event *"
          value={description}
          onChangeText={setDescription}
          placeholder="What should attendees know?"
          multiline
        />
        <Field label="Capacity" value={capacity} onChangeText={setCapacity} placeholder="20" keyboardType="numeric" />

        <Text style={[styles.fieldLabel, { color: colors.primary }]}>Ticketing *</Text>
        <View style={styles.pillRow}>
          {(['free', 'paid'] as EventPricingType[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.pill,
                {
                  backgroundColor: pricingType === option ? colors.primary : colors.surface,
                  borderColor: pricingType === option ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setPricingType(option)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, { color: pricingType === option ? colors.onPrimary : colors.text }]}>
                {option === 'free' ? 'Free (RSVP)' : 'Paid (Tickets)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {pricingType === 'paid' ? (
          <>
            <Field
              label="Standard price ($) *"
              value={standardPrice}
              onChangeText={setStandardPrice}
              placeholder="49"
              keyboardType="numeric"
            />
            <Field
              label="VIP price ($) *"
              value={vipPrice}
              onChangeText={setVipPrice}
              placeholder="39"
              keyboardType="numeric"
            />
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }, processing && styles.disabled]}
          onPress={handleNext}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.nextButtonText, { color: colors.onPrimary }]}>
              Next: Build attendee form
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: colors.primary }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.headerText}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.headerSubtitle, { color: colors.subtleText }]}>{subtitle}</Text> : null}
      </View>
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
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
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
        keyboardType={keyboardType}
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
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
  },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontFamily: AuthFonts.bold },
  headerSubtitle: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 2 },
  gateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  gateText: { fontSize: 15, fontFamily: AuthFonts.bold, textAlign: 'center' },
  gateSubtext: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center', marginBottom: 10 },
  upgradeButton: { borderRadius: 22, paddingHorizontal: 24, paddingVertical: 12 },
  upgradeText: { fontSize: 13, fontFamily: AuthFonts.bold },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  imagePicker: { marginBottom: 18 },
  image: { width: '100%', height: 160, borderRadius: 16 },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  imagePlaceholderText: { fontSize: 12, fontFamily: AuthFonts.regular },
  errorText: { fontSize: 12, fontFamily: AuthFonts.medium, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontFamily: AuthFonts.bold, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: AuthFonts.regular,
    marginBottom: 16,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontSize: 12, fontFamily: AuthFonts.medium },
  nextButton: { borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  nextButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  disabled: { opacity: 0.7 },
});