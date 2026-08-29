import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthColors, AuthFonts } from '@/constants/authTheme';
import AuthStepIndicator from '@/components/AuthStepIndicator';
import InterestBubble from '@/components/setup/InterestBubble';
import { interestOptions } from '@/data/interestOptions';
import { useAuth } from '@/context/AuthContext';
import { completeOnboarding } from '@/services/onboardingService';

export default function Interests() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const allOptions = [...interestOptions, ...customOptions];

  const toggle = (label: string) => {
    setSelected((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]));
  };

  const handleAddCustom = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    if (!allOptions.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setCustomOptions((prev) => [...prev, trimmed]);
    }
    if (!selected.includes(trimmed)) {
      setSelected((prev) => [...prev, trimmed]);
    }
    setCustomText('');
  };

  const handleFinish = async () => {
    if (selected.length === 0) {
      setError('Pick at least one interest so we can find your people.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      // Stack.Protected picks this up automatically once profileCompleted
      // flips true in Firestore — no explicit navigation call needed.
      await completeOnboarding(user!.uid, selected);
    } catch (err: any) {
      setSaving(false);
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AuthStepIndicator currentStep={4} totalSteps={4} />
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>Pick a few interests — you can always change these later.</Text>

        <View style={styles.bubbleWrap}>
          {allOptions.map((option) => (
            <InterestBubble
              key={option}
              label={option}
              selected={selected.includes(option)}
              onPress={() => toggle(option)}
            />
          ))}
        </View>

        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            value={customText}
            onChangeText={setCustomText}
            placeholder="Add your own..."
            placeholderTextColor={AuthColors.subtleText}
            onSubmitEditing={handleAddCustom}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddCustom} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={AuthColors.white} />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleFinish} activeOpacity={0.85} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={AuthColors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Get Started</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuthColors.white },
  scroll: { padding: 24, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', fontFamily: AuthFonts.heading, color: AuthColors.text, marginBottom: 6 },
  subtitle: { fontSize: 13, color: AuthColors.subtleText, fontFamily: AuthFonts.regular, marginBottom: 24 },
  bubbleWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: AuthColors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: AuthFonts.regular,
    color: AuthColors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AuthColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: AuthColors.error, fontSize: 12, marginTop: 12, fontFamily: AuthFonts.regular },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: AuthColors.border },
  primaryButton: { backgroundColor: AuthColors.primary, borderRadius: 28, paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: AuthColors.white, fontSize: 16, fontWeight: '700', fontFamily: AuthFonts.bold },
});