import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCurrentUser } from '@/services/userService';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { SettingsRow, SettingsSection } from '@/components/settings/SettingsRow';

export default function SettingsAccount() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { data: currentUser } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);

  const notYet = (feature: string) =>
    Alert.alert(feature, `${feature} isn't available yet — it's coming in a future update.`);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SettingsHeader title="Account settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <SettingsSection title="Your details">
          <SettingsRow icon="person-outline" label="Edit profile" onPress={() => router.push('/edit-profile')} />
          <SettingsRow icon="mail-outline" label="Email" value={currentUser?.email ?? ''} onPress={() => router.push('/edit-profile')} />
          <SettingsRow
            icon="call-outline"
            label="Phone"
            value={currentUser?.phone ?? 'Not set'}
            isLast
            onPress={() => router.push('/edit-profile')}
          />
        </SettingsSection>

        <SettingsSection title="Security">
          <SettingsRow icon="key-outline" label="Change password" onPress={() => notYet('Change password')} />
          <SettingsRow
            icon="phone-portrait-outline"
            label="Two-factor authentication"
            isLast
            onPress={() => notYet('Two-factor authentication')}
          />
        </SettingsSection>

        <SettingsSection title="Danger zone">
          <SettingsRow
            icon="pause-circle-outline"
            label="Deactivate account"
            onPress={() => notYet('Deactivating your account')}
          />
          <SettingsRow
            icon="trash-outline"
            label="Delete account"
            isLast
            destructive
            onPress={() => notYet('Deleting your account')}
          />
        </SettingsSection>

        <Text style={[styles.note, { color: colors.subtleText }]}>
          Password changes, 2FA, and account deletion need extra backend work and aren't wired up yet.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  note: { fontSize: 11, fontFamily: AuthFonts.regular, textAlign: 'center', lineHeight: 16 },
});