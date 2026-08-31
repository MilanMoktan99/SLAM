import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { getEventDraft, clearEventDraft } from '@/lib/eventDraft';
import { createEvent } from '@/services/eventsService';
import { FormField } from '@/types/models';
import AddFieldModal from '@/components/forms/AddFieldModal';

const TYPE_LABELS: Record<string, string> = {
  text: 'Short text',
  textarea: 'Long text',
  email: 'Email',
  phone: 'Phone',
  checkbox: 'Checkboxes',
  radio: 'Radio buttons',
  select: 'Dropdown',
};

export default function CreateEventForm() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const draft = getEventDraft();

  const [fields, setFields] = useState<FormField[]>(draft?.formFields ?? []);
  const [addVisible, setAddVisible] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    // Someone landed here without going through step 1 (e.g. a reload) —
    // send them back rather than publishing an empty event.
    if (!draft) router.replace('/create-event');
  }, [draft]);

  if (!draft) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const handleRemove = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handlePublish = async () => {
    if (fields.length === 0) {
      Alert.alert('Add at least one question', 'Attendees need at least one field to fill in.');
      return;
    }
    setPublishing(true);
    try {
      const eventId = await createEvent(user!.uid, { ...draft, formFields: fields });
      clearEventDraft();
      router.replace(`/event/${eventId}`);
    } catch (err: any) {
      console.error('Failed to publish event:', err);
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
      setPublishing(false);
    }
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
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Attendee Form</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subtleText }]}>
            Step 2 of 2 — {draft.pricingType === 'paid' ? 'Ticket buyers' : 'RSVPs'} fill this in
          </Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.intro, { color: colors.subtleText }]}>
          These are the questions attendees answer when they {draft.pricingType === 'paid' ? 'buy a ticket' : 'RSVP'}.
          The standard details are included by default — add your own below.
        </Text>

        {fields.map((field) => (
          <View
            key={field.id}
            style={[styles.fieldRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.fieldInfo}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {field.label}
                {field.required ? ' *' : ''}
              </Text>
              <Text style={[styles.fieldMeta, { color: colors.subtleText }]}>
                {TYPE_LABELS[field.type] ?? field.type}
                {field.options ? ` · ${field.options.length} options` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleRemove(field.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.subtleText} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.primary }]}
          onPress={() => setAddVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Add a question</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishButton, { backgroundColor: colors.primary }, publishing && styles.disabled]}
          onPress={handlePublish}
          disabled={publishing}
          activeOpacity={0.85}
        >
          {publishing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.publishButtonText, { color: colors.onPrimary }]}>Publish Event</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <AddFieldModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdd={(field) => {
          setFields((prev) => [...prev, field]);
          setAddVisible(false);
        }}
      />
    </View>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  intro: { fontSize: 12, fontFamily: AuthFonts.regular, lineHeight: 18, marginBottom: 18 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  fieldInfo: { flex: 1 },
  fieldLabel: { fontSize: 13, fontFamily: AuthFonts.bold, marginBottom: 2 },
  fieldMeta: { fontSize: 11, fontFamily: AuthFonts.regular },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  addButtonText: { fontSize: 13, fontFamily: AuthFonts.bold },
  publishButton: { borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  publishButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  disabled: { opacity: 0.7 },
});