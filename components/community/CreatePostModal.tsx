import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  visible: boolean;
  userName: string;
  userAvatar: string;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void>;
};

export default function CreatePostModal({ visible, userName, userAvatar, onClose, onSubmit }: Props) {
  const colors = useThemeColors();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const handlePost = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    setError('');
    try {
      await onSubmit(content.trim());
      setContent(''); // only clear on confirmed success
    } catch (err: any) {
      console.error('Post creation failed:', err);
      setError(err?.message ?? 'Something went wrong posting. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const canPost = content.trim().length > 0 && !posting;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} disabled={posting}>
              <Text style={[styles.cancelText, { color: colors.subtleText }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Create Post</Text>
            <TouchableOpacity
              onPress={handlePost}
              disabled={!canPost}
              style={[styles.postButton, { backgroundColor: canPost ? colors.primary : colors.border }]}
            >
              {posting ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={[styles.postText, { color: canPost ? colors.onPrimary : colors.subtleText }]}>
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

          <View style={styles.authorRow}>
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
            <Text style={[styles.authorName, { color: colors.text }]}>{userName}</Text>
          </View>

          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="What's happening today?"
            placeholderTextColor={colors.subtleText}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
            editable={!posting}
          />

          <View style={styles.imageRow}>
            <Ionicons name="image-outline" size={20} color={colors.primary} />
            <Text style={[styles.imageRowText, { color: colors.primary }]}>Add photo (coming soon)</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 320 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cancelText: { fontSize: 14, fontFamily: AuthFonts.regular },
  title: { fontSize: 15, fontFamily: AuthFonts.bold },
  postButton: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 7, minWidth: 52, alignItems: 'center' },
  postText: { fontSize: 13, fontFamily: AuthFonts.bold },
  errorText: { fontSize: 12, fontFamily: AuthFonts.medium, marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  authorName: { fontSize: 14, fontFamily: AuthFonts.bold },
  input: { fontSize: 14, fontFamily: AuthFonts.regular, minHeight: 100, textAlignVertical: 'top' },
  imageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  imageRowText: { fontSize: 13, fontFamily: AuthFonts.medium },
});