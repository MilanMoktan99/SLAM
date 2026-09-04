import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Post } from '@/types/models';

type Props = {
  post: Post;
  isSaved?: boolean;
  onToggleLike?: () => void;
  onPressComment?: () => void;
  onPressShare?: () => void;
  onToggleSave?: () => void;
  onPressMenu?: () => void;
};

function formatCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(count);
}

// Liked state now lives in Firestore (via usePostsFeed), so this component
// is fully controlled by its parent — it just renders post.likedByMe/likeCount
// and reports taps upward, rather than managing its own like state.
export default function PostCard({
  post,
  isSaved,
  onToggleLike,
  onPressComment,
  onPressShare,
  onToggleSave,
  onPressMenu,
}: Props) {
  const colors = useThemeColors();
  const liked = !!post.likedByMe;
  const [imageExpanded, setImageExpanded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={[styles.authorName, { color: colors.text }]}>{post.authorName}</Text>
          <Text style={[styles.postedAt, { color: colors.subtleText }]}>{post.postedAt}</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={onPressMenu} hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.subtleText} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>

      {post.image ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setImageExpanded(true)}>
          <Image source={{ uri: post.image }} style={[styles.postImage, { backgroundColor: colors.background }]} />
        </TouchableOpacity>
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
        <TouchableOpacity onPress={onToggleSave}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isSaved ? colors.primary : colors.subtleText}
          />
        </TouchableOpacity>
      </View>

      {/* Tap a post image to view it full-screen */}
      <Modal visible={imageExpanded} transparent animationType="fade" onRequestClose={() => setImageExpanded(false)}>
        <TouchableOpacity
          style={styles.lightbox}
          activeOpacity={1}
          onPress={() => setImageExpanded(false)}
        >
          <Image source={{ uri: post.image }} style={styles.lightboxImage} resizeMode="contain" />
          <View style={styles.lightboxClose}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </Modal>
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
  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  lightboxImage: { width: '100%', height: '80%' },
  lightboxClose: { position: 'absolute', top: 60, right: 24 },
});