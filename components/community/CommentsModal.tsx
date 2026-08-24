import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { getComments, addComment } from '@/services/commentsService';
import { Comment } from '@/types/models';

type Props = {
  visible: boolean;
  postId: string | null;
  userAvatar: string;
  onClose: () => void;
  onCommentAdded: (postId: string) => void; // lets the parent bump commentCount locally
};

export default function CommentsModal({ visible, postId, userAvatar, onClose, onCommentAdded }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible || !postId) {
      setComments([]);
      setText('');
      setError('');
      return;
    }
    setLoading(true);
    getComments(postId)
      .then(setComments)
      .catch((err) => {
        console.error('Failed to load comments:', err);
        setError('Could not load comments.');
      })
      .finally(() => setLoading(false));
  }, [visible, postId]);

  const handleAdd = async () => {
    if (!text.trim() || !postId || !user || posting) return;
    setPosting(true);
    setError('');
    try {
      const newComment = await addComment(postId, user.uid, text.trim());
      setComments((prev) => [...prev, newComment]);
      setText('');
      onCommentAdded(postId);
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      setError(err?.message ?? 'Something went wrong posting your comment.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.subtleText} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <ScrollView style={styles.list}>
              {comments.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.subtleText }]}>
                  No comments yet — be the first to say something.
                </Text>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentRow}>
                    <Image source={{ uri: comment.authorAvatar }} style={styles.avatar} />
                    <View style={styles.commentBody}>
                      <Text style={[styles.commentAuthor, { color: colors.text }]}>{comment.authorName}</Text>
                      <Text style={[styles.commentText, { color: colors.text }]}>{comment.text}</Text>
                      <Text style={[styles.commentTime, { color: colors.subtleText }]}>{comment.postedAt}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

          <View style={[styles.inputRow, { borderColor: colors.border }]}>
            <Image source={{ uri: userAvatar }} style={styles.inputAvatar} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.subtleText}
              value={text}
              onChangeText={setText}
              editable={!posting}
            />
            <TouchableOpacity onPress={handleAdd} disabled={!text.trim() || posting} hitSlop={8}>
              {posting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="send" size={20} color={text.trim() ? colors.primary : colors.subtleText} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 15, fontFamily: AuthFonts.bold },
  loading: { marginVertical: 24 },
  list: { marginBottom: 12 },
  emptyText: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center', marginVertical: 20 },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  commentBody: { flex: 1 },
  commentAuthor: { fontSize: 12, fontFamily: AuthFonts.bold },
  commentText: { fontSize: 13, fontFamily: AuthFonts.regular, marginTop: 2 },
  commentTime: { fontSize: 10, fontFamily: AuthFonts.regular, marginTop: 3 },
  errorText: { fontSize: 12, fontFamily: AuthFonts.medium, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  inputAvatar: { width: 28, height: 28, borderRadius: 14 },
  input: { flex: 1, fontSize: 13, fontFamily: AuthFonts.regular, paddingVertical: 6 },
});