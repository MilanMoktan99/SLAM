import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts, AuthColors } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  onPressNotifications?: () => void;
  onPressMessages?: () => void;
  unreadCount?: number;
};

export default function AppHeader({ onPressNotifications, onPressMessages, unreadCount = 0 }: Props) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.brandRow}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.brandText, { color: colors.text }]}>SLAM</Text>
      </View>

      <View style={styles.iconsRow}>
        <TouchableOpacity onPress={onPressNotifications} style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity onPress={onPressMessages} style={styles.iconButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AuthColors.border,
    marginTop: 40
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 26, height: 26 },
  brandText: { fontSize: 20, fontFamily: AuthFonts.bold, letterSpacing: 1 },
  iconsRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  iconButton: { padding: 2 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
});