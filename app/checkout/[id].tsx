import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getEventById } from '@/services/eventsService';
import { getCurrentUser } from '@/services/userService';
import { getRsvpStatus, rsvpToEvent } from '@/services/rsvpService';
import { setCheckoutResponses } from '@/lib/checkoutDraft';
import { defaultFormFields } from '@/data/defaultFormFields';
import { FormResponses } from '@/types/models';
import FormFieldInput from '@/components/forms/FromFieldInput';

export default function Checkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { user } = useAuth();

  const { data: event, loading: eventLoading } = useAsyncData(() => getEventById(id), [id]);
  const { data: currentUser, loading: userLoading } = useAsyncData(
    () => getCurrentUser(user!.uid),
    [user?.uid]
  );
  const { data: rsvpStatus, loading: statusLoading } = useAsyncData(
    () => getRsvpStatus(id, user!.uid),
    [id, user?.uid]
  );

  const [responses, setResponses] = useState<FormResponses>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Events created before the form builder existed have no formFields —
  // fall back to the standard set so checkout still works for them.
  const fields = event?.formFields?.length ? event.formFields : defaultFormFields;

  // Prefill what we already know about them, so they're not retyping it.
  useEffect(() => {
    if (!currentUser) return;
    const [firstName, ...rest] = (currentUser.name ?? '').split(' ');
    setResponses((prev) => ({
      firstName: prev.firstName ?? firstName ?? '',
      lastName: prev.lastName ?? rest.join(' '),
      email: prev.email ?? currentUser.email ?? '',
      phone: prev.phone ?? currentUser.phone ?? '',
      ...prev,
    }));
  }, [currentUser]);

  // Already registered? Skip the form — send them to their confirmation/invoice.
  useEffect(() => {
    if (!rsvpStatus?.isGoing) return;
    router.replace(rsvpStatus.ticket ? `/invoice/${id}` : `/confirmation/${id}`);
  }, [rsvpStatus, id]);

  const isLoading = eventLoading || userLoading || statusLoading;

  if (isLoading || !event) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const isPaid = event.pricingType === 'paid';
  const price = currentUser?.isVip ? event.vipPrice : event.standardPrice;

  const validate = () => {
    const next: Record<string, string> = {};
    fields.forEach((field) => {
      if (!field.required) return;
      const value = responses[field.id];
      const empty = Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim();
      if (empty) next[field.id] = 'This field is required';
      else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        next[field.id] = 'Enter a valid email address';
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (isPaid) {
      // Paid events go through payment before the RSVP is written.
      setCheckoutResponses(responses);
      router.push(`/payment/${id}`);
      return;
    }

    setSubmitting(true);
    const result = await rsvpToEvent(id, user!.uid, responses, null);
    setSubmitting(false);

    if (!result.success) {
      Alert.alert("Couldn't complete RSVP", result.message ?? 'Please try again.');
      return;
    }
    router.replace(`/confirmation/${id}`);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isPaid ? 'Checkout' : 'RSVP'}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
          <Text style={[styles.eventMeta, { color: colors.subtleText }]}>
            {event.date} · {event.time}
          </Text>
          <Text style={[styles.eventMeta, { color: colors.subtleText }]}>{event.location}</Text>
          {isPaid && price !== undefined ? (
            <Text style={[styles.eventPrice, { color: colors.primary }]}>
              ${price}
              {currentUser?.isVip ? ' (VIP price)' : ''}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your details</Text>

        {fields.map((field) => (
          <FormFieldInput
            key={field.id}
            field={field}
            value={responses[field.id] ?? (field.type === 'checkbox' ? [] : '')}
            error={errors[field.id]}
            onChange={(value) => setResponses((prev) => ({ ...prev, [field.id]: value }))}
          />
        ))}

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, submitting && styles.disabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.onPrimary }]}>
              {isPaid ? 'Proceed to Checkout' : 'Confirm RSVP'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  eventCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  eventTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 6 },
  eventMeta: { fontSize: 12, fontFamily: AuthFonts.regular, marginBottom: 2 },
  eventPrice: { fontSize: 18, fontFamily: AuthFonts.bold, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 14 },
  submitButton: { borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  submitButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  disabled: { opacity: 0.7 },
});