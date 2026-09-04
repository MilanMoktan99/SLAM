import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';

export type SheetAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
  destructive?: boolean;
  /** Greys the row out but still fires onPress, so the handler can explain
   * *why* it's unavailable rather than the tap doing nothing. */
  disabled?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title?: string;
  actions: SheetAction[];
  onClose: () => void;
};

export default function ActionSheet({ visible, title, actions, onClose }: Props) {
  const colors = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          {title ? <Text style={[styles.title, { color: colors.subtleText }]}>{title}</Text> : null}

          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.key}
              style={[
                styles.row,
                index < actions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={() => {
                onClose();
                // Let the sheet finish dismissing before the action fires,
                // otherwise navigation or a follow-up modal can get swallowed.
                setTimeout(action.onPress, 250);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={action.icon}
                size={20}
                color={
                  action.disabled ? colors.subtleText : action.destructive ? colors.error : colors.text
                }
              />
              <View style={styles.textWrap}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: action.disabled
                        ? colors.subtleText
                        : action.destructive
                          ? colors.error
                          : colors.text,
                    },
                  ]}
                >
                  {action.label}
                </Text>
                {action.description ? (
                  <Text style={[styles.description, { color: colors.subtleText }]}>
                    {action.description}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.background }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: 28 },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  title: {
    fontSize: 11,
    fontFamily: AuthFonts.bold,
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  textWrap: { flex: 1 },
  label: { fontSize: 15, fontFamily: AuthFonts.medium },
  description: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 2 },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontFamily: AuthFonts.bold },
});