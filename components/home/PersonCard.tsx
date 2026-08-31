import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SuggestedPerson } from '@/types/models';

type Props = {
  person: SuggestedPerson;
  onPressConnect?: () => void;
  connectDisabled?: boolean; // styled gray, but stays tappable so the parent can explain why (e.g. "used your free connection")
};

export default function PersonCard({ person, onPressConnect, connectDisabled }: Props) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: person.avatar }} style={styles.avatar} />
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {person.name}
      </Text>
      <Text style={[styles.occupation, { color: colors.subtleText }]} numberOfLines={1}>
        {person.occupation}
      </Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={12} color={colors.subtleText} />
        <Text style={[styles.locationText, { color: colors.subtleText }]}>{person.location}</Text>
      </View>
      <TouchableOpacity
        style={[styles.connectButton, { backgroundColor: connectDisabled ? colors.border : colors.primary }]}
        onPress={onPressConnect}
        activeOpacity={0.85}
      >
        <Text style={[styles.connectText, { color: connectDisabled ? colors.subtleText : colors.onPrimary }]}>
          Connect
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 150, borderRadius: 16, borderWidth: 1, padding: 14, alignItems: 'center', marginRight: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 10 },
  name: { fontSize: 14, fontFamily: AuthFonts.bold },
  occupation: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, marginBottom: 12 },
  locationText: { fontSize: 11, fontFamily: AuthFonts.regular },
  connectButton: { borderRadius: 20, paddingVertical: 8, width: '100%', alignItems: 'center' },
  connectText: { fontSize: 12, fontFamily: AuthFonts.bold },
});