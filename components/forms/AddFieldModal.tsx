import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FormField, FormFieldType } from '@/types/models';

const FIELD_TYPES: { key: FormFieldType; label: string }[] = [
  { key: 'text', label: 'Short text' },
  { key: 'textarea', label: 'Long text' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'checkbox', label: 'Checkboxes (multi-select)' },
  { key: 'radio', label: 'Radio buttons (pick one)' },
];

const NEEDS_OPTIONS: FormFieldType[] = ['checkbox', 'radio', 'select'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (field: FormField) => void;
};

export default function AddFieldModal({ visible, onClose, onAdd }: Props) {
  const colors = useThemeColors();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FormFieldType>('text');
  const [required, setRequired] = useState(false);
  const [optionsText, setOptionsText] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setLabel('');
    setType('text');
    setRequired(false);
    setOptionsText('');
    setError('');
  };

  const handleAdd = () => {
    if (!label.trim()) {
      setError('Give this question a label.');
      return;
    }
    const options = optionsText
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean);

    if (NEEDS_OPTIONS.includes(type) && options.length < 2) {
      setError('Add at least two options, one per line.');
      return;
    }

    onAdd({
      id: `custom_${Date.now()}`,
      label: label.trim(),
      type,
      required,
      options: NEEDS_OPTIONS.includes(type) ? options : undefined,
    });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Add a question</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color={colors.subtleText} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.primary }]}>Question</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. What do you hope to get from this event?"
              placeholderTextColor={colors.subtleText}
            />

            <Text style={[styles.fieldLabel, { color: colors.primary }]}>Answer type</Text>
            <View style={styles.typeList}>
              {FIELD_TYPES.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.typePill,
                    {
                      backgroundColor: type === option.key ? colors.primary : colors.background,
                      borderColor: type === option.key ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setType(option.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.typeText, { color: type === option.key ? colors.onPrimary : colors.text }]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {NEEDS_OPTIONS.includes(type) ? (
              <>
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>Options (one per line)</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.optionsInput,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                  value={optionsText}
                  onChangeText={setOptionsText}
                  placeholder={'Networking\nLearning\nMaking friends'}
                  placeholderTextColor={colors.subtleText}
                  multiline
                />
              </>
            ) : null}

            <TouchableOpacity style={styles.requiredRow} onPress={() => setRequired(!required)} activeOpacity={0.7}>
              <Ionicons
                name={required ? 'checkbox' : 'square-outline'}
                size={20}
                color={required ? colors.primary : colors.subtleText}
              />
              <Text style={[styles.requiredText, { color: colors.text }]}>Required</Text>
            </TouchableOpacity>

            {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>Add question</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 15, fontFamily: AuthFonts.bold },
  fieldLabel: { fontSize: 12, fontFamily: AuthFonts.bold, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: AuthFonts.regular,
    marginBottom: 14,
  },
  optionsInput: { minHeight: 90, textAlignVertical: 'top' },
  typeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  typePill: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  typeText: { fontSize: 12, fontFamily: AuthFonts.medium },
  requiredRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  requiredText: { fontSize: 13, fontFamily: AuthFonts.regular },
  errorText: { fontSize: 12, fontFamily: AuthFonts.medium, marginBottom: 10 },
  addButton: { borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  addButtonText: { fontSize: 14, fontFamily: AuthFonts.bold },
});