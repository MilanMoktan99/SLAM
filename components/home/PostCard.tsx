import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Post } from '@/types/models';

type Props = {
  post: Post;
  onToggleLike?: () => void;
  onPressComment?: () => void;
  onPressShare?: () => void;
  onPressBookmark?: () => void;
};

function formatCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(count);
}

// Liked state now lives in Firestore (via usePostsFeed), so this component
// is fully controlled by its parent — it just renders post.likedByMe/likeCount
// and reports taps upward, rather than managing its own like state.
export default function PostCard({ post, onToggleLike, onPressComment, onPressShare, onPressBookmark }: Props) {
  const colors = useThemeColors();
  const liked = !!post.likedByMe;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={[styles.authorName, { color: colors.text }]}>{post.authorName}</Text>
          <Text style={[styles.postedAt, { color: colors.subtleText }]}>{post.postedAt}</Text>
        </View>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.subtleText} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>

      {post.image ? (
        <Image source={{ uri: post.image }} style={[styles.postImage, { backgroundColor: colors.background }]} />
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionItem} onPress={onToggleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? colors.primary : colors.subtleText}
          />
          <Text style={[styles.actionText, { color: colors.subtleText }]}>{formatCount(post.likeCount)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={onPressComment}>
          <Ionicons name="chatbubble-outline" size={17} color={colors.subtleText} />
          <Text style={[styles.actionText, { color: colors.subtleText }]}>{formatCount(post.commentCount)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={onPressShare}>
          <Ionicons name="share-outline" size={18} color={colors.subtleText} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onPressBookmark}>
          <Ionicons name="bookmark-outline" size={18} color={colors.subtleText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10 },
  headerText: { flex: 1 },
  authorName: { fontSize: 14, fontFamily: AuthFonts.bold },
  postedAt: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 1 },
  menuButton: { padding: 4 },
  content: { fontSize: 13, lineHeight: 19, fontFamily: AuthFonts.regular },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 12 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 18 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 12, fontFamily: AuthFonts.medium },
});