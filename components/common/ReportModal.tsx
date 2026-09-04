import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ReportTargetType } from '@/services/moderationService';

const REASONS: Record<ReportTargetType, string[]> = {
  post: [
    'Spam or scam',
    'Harassment or bullying',
    'Hate speech',
    'Nudity or sexual content',
    'False information',
    'Something else',
  ],
  event: [
    'Spam or scam',
    'Misleading event details',
    'Unsafe or inappropriate',
    'Not a real event',
    'Something else',
  ],
  comment: ['Spam or scam', 'Harassment or bullying', 'Hate speech', 'Something else'],
  user: ['Fake profile', 'Harassment or bullying', 'Inappropriate content', 'Something else'],
};

type Props = {
  visible: boolean;
  targetType: ReportTargetType;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
};

export default function ReportModal({ visible, targetType, onClose, onSubmit }: Props) {
  const colors = useThemeColors();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason(null);
    setDetails('');
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    await onSubmit(reason, details.trim());
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Report</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.subtleText} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.subtleText }]}>
            Why are you reporting this? Your report is anonymous.
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled" style={styles.list}>
            {REASONS[targetType].map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.reasonRow, { borderBottomColor: colors.border }]}
                onPress={() => setReason(option)}
                activeOpacity={0.7}
              >
                <Text style={[styles.reasonText, { color: colors.text }]}>{option}</Text>
                <Ionicons
                  name={reason === option ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={reason === option ? colors.primary : colors.subtleText}
                />
              </TouchableOpacity>
            ))}

            {reason ? (
              <TextInput
                style={[
                  styles.detailsInput,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                ]}
                value={details}
                onChangeText={setDetails}
                placeholder="Add any details (optional)"
                placeholderTextColor={colors.subtleText}
                multiline
              />
            ) : null}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: reason ? colors.primary : colors.border },
            ]}
            onPress={handleSubmit}
            disabled={!reason || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.submitText, { color: reason ? colors.onPrimary : colors.subtleText }]}>
                Submit report
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 16, fontFamily: AuthFonts.bold },
  subtitle: { fontSize: 12, fontFamily: AuthFonts.regular, marginBottom: 12, lineHeight: 17 },
  list: { marginBottom: 12 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  reasonText: { flex: 1, fontSize: 14, fontFamily: AuthFonts.regular },
  detailsInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: AuthFonts.regular,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 14,
  },
  submitButton: { borderRadius: 26, paddingVertical: 14, alignItems: 'center' },
  submitText: { fontSize: 14, fontFamily: AuthFonts.bold },
});