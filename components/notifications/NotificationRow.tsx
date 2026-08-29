import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { AppNotification, NotificationType } from '@/types/models';

const ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  like: 'heart',
  comment: 'chatbubble',
  rsvp_confirmed: 'calendar',
  event_reminder: 'alarm',
  profile_incomplete: 'person-circle',
  vip_prompt: 'star',
  points_earned: 'sparkles',
};

type Props = {
  notification: AppNotification;
  onPress: () => void;
};

export default function NotificationRow({ notification, onPress }: Props) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: notification.read ? colors.background : colors.surface, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
        <Ionicons name={ICONS[notification.type]} size={18} color={colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text }]}>{notification.title}</Text>
        <Text style={[styles.body, { color: colors.subtleText }]} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={[styles.time, { color: colors.subtleText }]}>{notification.createdAt}</Text>
      </View>
      {!notification.read ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontFamily: AuthFonts.bold, marginBottom: 2 },
  body: { fontSize: 12, fontFamily: AuthFonts.regular, lineHeight: 17, marginBottom: 4 },
  time: { fontSize: 10, fontFamily: AuthFonts.regular },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
});