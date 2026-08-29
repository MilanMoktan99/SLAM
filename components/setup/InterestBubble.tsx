import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AuthColors, AuthFonts } from '@/constants/authTheme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function InterestBubble({ label, selected, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.bubble, selected ? styles.bubbleSelected : styles.bubbleUnselected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, { color: selected ? AuthColors.white : AuthColors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  bubbleSelected: { backgroundColor: AuthColors.primary, borderColor: AuthColors.primary },
  bubbleUnselected: { backgroundColor: AuthColors.white, borderColor: AuthColors.border },
  label: { fontSize: 13, fontFamily: AuthFonts.medium },
});