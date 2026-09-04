import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  NotificationPrefs,
  defaultNotificationPrefs,
} from '@/services/settingsService';
import SettingsHeader from '@/components/settings/SettingsHeader';
import { SettingsRow, SettingsSection } from '@/components/settings/SettingsRow';

export default function SettingsNotifications() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getNotificationPrefs(user.uid).then((data) => {
      setPrefs(data);
      setLoading(false);
    });
  }, [user]);

  const update = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value })); // optimistic
    if (user) updateNotificationPrefs(user.uid, { [key]: value });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SettingsHeader title="Notifications" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SettingsHeader title="Notifications" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <SettingsSection title="Activity">
          <SettingsRow
            icon="heart-outline"
            label="Likes on your posts"
            toggle={{ value: prefs.likes, onChange: (v) => update('likes', v) }}
          />
          <SettingsRow
            icon="chatbubble-outline"
            label="Comments on your posts"
            isLast
            toggle={{ value: prefs.comments, onChange: (v) => update('comments', v) }}
          />
        </SettingsSection>

        <SettingsSection title="Events & groups">
          <SettingsRow
            icon="calendar-outline"
            label="Event reminders and RSVPs"
            toggle={{ value: prefs.events, onChange: (v) => update('events', v) }}
          />
          <SettingsRow
            icon="people-outline"
            label="Group activity"
            isLast
            toggle={{ value: prefs.groups, onChange: (v) => update('groups', v) }}
          />
        </SettingsSection>

        <SettingsSection title="From SLAM">
          <SettingsRow
            icon="megaphone-outline"
            label="News and offers"
            isLast
            toggle={{ value: prefs.marketing, onChange: (v) => update('marketing', v) }}
          />
        </SettingsSection>

        <Text style={[styles.note, { color: colors.subtleText }]}>
          These control in-app notifications. Push notifications to your lock screen aren't available yet.
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