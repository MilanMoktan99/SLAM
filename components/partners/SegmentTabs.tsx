import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props<T extends string> = {
  segments: { key: T; label: string }[];
  selected: T;
  onSelect: (key: T) => void;
};

/** Pill-style segmented control used inside Partners & Perks. */
export default function SegmentTabs<T extends string>({ segments, selected, onSelect }: Props<T>) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {segments.map((segment) => {
        const isActive = segment.key === selected;
        return (
          <TouchableOpacity
            key={segment.key}
            style={[styles.segment, isActive && { backgroundColor: colors.primary }]}
            onPress={() => onSelect(segment.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, { color: isActive ? colors.onPrimary : colors.subtleText }]}>
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: 22, borderWidth: 1, padding: 4, marginHorizontal: 20 },
  segment: { flex: 1, borderRadius: 18, paddingVertical: 9, alignItems: 'center' },
  label: { fontSize: 12, fontFamily: AuthFonts.bold },
});