import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useThemePreference } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCurrentUser } from '@/services/userService';
import { SettingsRow, SettingsSection } from '@/components/settings/SettingsRow';

const APPEARANCE_LABELS = { light: 'Light', dark: 'Dark', system: 'Device' };

export default function Settings() {
  const colors = useThemeColors();
  const { preference } = useThemePreference();
  const { user, signOut } = useAuth();
  const { data: currentUser } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);

  const handleLogOut = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/edit-profile')}
          activeOpacity={0.8}
        >
          {currentUser?.avatar ? (
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.background }]} />
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{currentUser?.name ?? ''}</Text>
            <Text style={[styles.profileMeta, { color: colors.subtleText }]}>
              {currentUser?.isVip ? 'SLAM VIP member' : 'Free member'} · Edit profile
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.subtleText} />
        </TouchableOpacity>

        <SettingsSection title="Your content">
          <SettingsRow icon="bookmark-outline" label="Saved" onPress={() => router.push('/saved')} />
          <SettingsRow
            icon="people-outline"
            label="My Connections"
            onPress={() => router.push('/my-connections')}
          />
          <SettingsRow
            icon="albums-outline"
            label="My Groups"
            isLast
            onPress={() => router.push('/my-groups')}
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/settings-notifications')}
          />
          <SettingsRow
            icon="contrast-outline"
            label="Appearance"
            value={APPEARANCE_LABELS[preference]}
            onPress={() => router.push('/settings-appearance')}
          />
          <SettingsRow
            icon="language-outline"
            label="Language"
            isLast
            onPress={() => router.push('/settings-language')}
          />
        </SettingsSection>

        <SettingsSection title="Membership & payments">
          <SettingsRow
            icon="star-outline"
            label="Subscription"
            value={currentUser?.isVip ? 'VIP' : 'Free'}
            onPress={() => router.push(currentUser?.isVip ? '/manage-subscription' : '/vip-rewards')}
          />
          <SettingsRow
            icon="receipt-outline"
            label="Orders and payments"
            isLast
            onPress={() => router.push('/orders')}
          />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow
            icon="person-circle-outline"
            label="Account settings"
            onPress={() => router.push('/settings-account')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Account status"
            onPress={() => router.push('/settings-account-status')}
          />
          <SettingsRow
            icon="lock-closed-outline"
            label="Privacy centre"
            isLast
            onPress={() => router.push('/settings-privacy')}
          />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow icon="help-circle-outline" label="Help" isLast onPress={() => router.push('/settings-help')} />
        </SettingsSection>

        <SettingsSection title="Login">
          <SettingsRow icon="log-out-outline" label="Log out" isLast destructive onPress={handleLogOut} />
        </SettingsSection>

        <Text style={[styles.version, { color: colors.subtleText }]}>SLAM · Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 24,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 2 },
  profileMeta: { fontSize: 12, fontFamily: AuthFonts.regular },
  version: { textAlign: 'center', fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 8 },
});