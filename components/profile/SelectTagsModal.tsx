import React, { useEffect, useState } from 'react';
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

type Props = {
  visible: boolean;
  title: string;
  /** Preset options shown as chips — the ones the user saw during onboarding. */
  options: string[];
  selected: string[];
  placeholder?: string;
  onClose: () => void;
  onSave: (selected: string[]) => void;
};

/**
 * Multi-select picker used for Interests, Languages and Connection Goals.
 * Shows the same preset chips people saw during signup *and* lets them add
 * their own — previously "add more" only offered a blank text box, so the
 * presets were invisible after onboarding.
 */
export default function SelectTagsModal({
  visible,
  title,
  options,
  selected,
  placeholder = 'Add your own...',
  onClose,
  onSave,
}: Props) {
  const colors = useThemeColors();
  const [draft, setDraft] = useState<string[]>(selected);
  const [customText, setCustomText] = useState('');

  // Re-sync whenever the sheet reopens, so it always reflects current values.
  useEffect(() => {
    if (visible) {
      setDraft(selected);
      setCustomText('');
    }
  }, [visible, selected]);

  // Presets plus anything custom the user already had, so nothing disappears.
  const allOptions = [...options, ...draft.filter((item) => !options.includes(item))];

  const toggle = (label: string) => {
    setDraft((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]));
  };

  const handleAddCustom = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    if (!draft.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setDraft((prev) => [...prev, trimmed]);
    }
    setCustomText('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.cancelText, { color: colors.subtleText }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => onSave(draft)}
            >
              <Text style={[styles.saveText, { color: colors.onPrimary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.hint, { color: colors.subtleText }]}>
            Tap to select. {draft.length} selected.
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled" style={styles.list}>
            <View style={styles.chipWrap}>
              {allOptions.map((option) => {
                const isSelected = draft.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => toggle(option)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? colors.onPrimary : colors.text }]}>
                      {option}
                    </Text>
                    {isSelected ? <Ionicons name="checkmark" size={13} color={colors.onPrimary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.customRow}>
            <TextInput
              style={[
                styles.customInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
              ]}
              value={customText}
              onChangeText={setCustomText}
              placeholder={placeholder}
              placeholderTextColor={colors.subtleText}
              onSubmitEditing={handleAddCustom}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddCustom}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cancelText: { fontSize: 14, fontFamily: AuthFonts.regular },
  title: { fontSize: 15, fontFamily: AuthFonts.bold },
  saveButton: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 7 },
  saveText: { fontSize: 13, fontFamily: AuthFonts.bold },
  hint: { fontSize: 11, fontFamily: AuthFonts.regular, marginBottom: 14 },
  list: { marginBottom: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: { fontSize: 13, fontFamily: AuthFonts.medium },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: AuthFonts.regular,
  },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});