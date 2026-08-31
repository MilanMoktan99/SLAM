import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FormField } from '@/types/models';

type Props = {
  field: FormField;
  value: string | string[];
  error?: string;
  onChange: (value: string | string[]) => void;
};

/** Renders one form field according to its type — the same component powers
 * the attendee checkout form and the host's live preview. */
export default function FormFieldInput({ field, value, error, onChange }: Props) {
  const colors = useThemeColors();

  const toggleOption = (option: string) => {
    const current = Array.isArray(value) ? value : [];
    onChange(current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.primary }]}>
        {field.label}
        {field.required ? ' *' : ''}
      </Text>

      {field.type === 'checkbox' ? (
        <View style={styles.optionList}>
          {(field.options ?? []).map((option) => {
            const selected = Array.isArray(value) && value.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={styles.optionRow}
                onPress={() => toggleOption(option)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={selected ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={selected ? colors.primary : colors.subtleText}
                />
                <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : field.type === 'radio' || field.type === 'select' ? (
        <View style={styles.optionList}>
          {(field.options ?? []).map((option) => {
            const selected = value === option;
            return (
              <TouchableOpacity
                key={option}
                style={styles.optionRow}
                onPress={() => onChange(option)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selected ? colors.primary : colors.subtleText}
                />
                <Text style={[styles.optionText, { color: colors.text }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <TextInput
          style={[
            styles.input,
            field.type === 'textarea' && styles.textarea,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: error ? colors.error : colors.border,
            },
          ]}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          placeholder={field.label}
          placeholderTextColor={colors.subtleText}
          multiline={field.type === 'textarea'}
          keyboardType={
            field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : 'default'
          }
          autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
        />
      )}

      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { fontSize: 12, fontFamily: AuthFonts.bold, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: AuthFonts.regular,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  optionList: { gap: 10, marginTop: 4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionText: { fontSize: 13, fontFamily: AuthFonts.regular, flex: 1 },
  errorText: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 4 },
});