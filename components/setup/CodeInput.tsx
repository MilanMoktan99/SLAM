import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { AuthColors, AuthFonts } from '@/constants/authTheme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  editable?: boolean;
};

const LENGTH = 4;

export default function CodeInput({ value, onChange, hasError, editable = true }: Props) {
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const digits = text.replace(/\D/g, '');
    if (!digits) return;

    // Handle a pasted full code as well as single keystrokes.
    if (digits.length > 1) {
      onChange(digits.slice(0, LENGTH));
      inputs.current[Math.min(digits.length, LENGTH) - 1]?.focus();
      return;
    }

    const next = value.split('');
    next[index] = digits;
    onChange(next.join('').slice(0, LENGTH));

    if (index < LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key !== 'Backspace') return;

    const next = value.split('');
    if (next[index]) {
      // Clear this box first.
      next[index] = '';
      onChange(next.join(''));
    } else if (index > 0) {
      // Already empty — step back and clear the previous one.
      next[index - 1] = '';
      onChange(next.join(''));
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: LENGTH }).map((_, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          style={[
            styles.box,
            value[index] ? styles.boxFilled : null,
            hasError ? styles.boxError : null,
          ]}
          value={value[index] ?? ''}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={LENGTH} // allows paste; single entry is handled above
          editable={editable}
          selectTextOnFocus
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  box: {
    width: 58,
    height: 66,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: AuthColors.border,
    backgroundColor: AuthColors.white,
    fontSize: 24,
    fontFamily: AuthFonts.bold,
    color: AuthColors.text,
  },
  boxFilled: { borderColor: AuthColors.primary },
  boxError: { borderColor: AuthColors.error },
});