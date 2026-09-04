import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { preparePostPhoto } from '@/services/photoService';

type Props = {
  visible: boolean;
  userName: string;
  userAvatar: string;
  onClose: () => void;
  onSubmit: (content: string, image?: string) => Promise<void>;
};

export default function CreatePostModal({ visible, userName, userAvatar, onClose, onSubmit }: Props) {
  const colors = useThemeColors();
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setContent('');
    setImageUri(null);
    setError('');
  };

  const handlePickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        fromCamera
          ? 'Please allow camera access to take a photo.'
          : 'Please allow photo access to add a photo.'
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });

    if (result.canceled || !result.assets?.[0]) return;
    setImageUri(result.assets[0].uri);
  };

  const handlePost = async () => {
    if (!content.trim() && !imageUri) return;
    setPosting(true);
    setError('');
    try {
      const image = imageUri ? await preparePostPhoto(imageUri) : undefined;
      await onSubmit(content.trim(), image);
      reset(); // only clear on confirmed success
    } catch (err: any) {
      console.error('Post creation failed:', err);
      setError(err?.message ?? 'Something went wrong posting. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const canPost = (content.trim().length > 0 || !!imageUri) && !posting;

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

          <ScrollView keyboardShouldPersistTaps="handled">
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

            {imageUri ? (
              <View style={styles.previewWrapper}>
                <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}
                  disabled={posting}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.toolbar, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => handlePickImage(false)}
              disabled={posting}
            >
              <Ionicons name="image-outline" size={22} color={colors.primary} />
              <Text style={[styles.toolbarText, { color: colors.primary }]}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => handlePickImage(true)}
              disabled={posting}
            >
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
              <Text style={[styles.toolbarText, { color: colors.primary }]}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%', minHeight: 340 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cancelText: { fontSize: 14, fontFamily: AuthFonts.regular },
  title: { fontSize: 15, fontFamily: AuthFonts.bold },
  postButton: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 7, minWidth: 52, alignItems: 'center' },
  postText: { fontSize: 13, fontFamily: AuthFonts.bold },
  errorText: { fontSize: 12, fontFamily: AuthFonts.medium, marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  authorName: { fontSize: 14, fontFamily: AuthFonts.bold },
  input: { fontSize: 14, fontFamily: AuthFonts.regular, minHeight: 90, textAlignVertical: 'top' },
  previewWrapper: { marginTop: 14, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: 220, borderRadius: 14 },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: { flexDirection: 'row', gap: 20, borderTopWidth: 1, paddingTop: 14, marginTop: 14 },
  toolbarButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolbarText: { fontSize: 13, fontFamily: AuthFonts.medium },
});