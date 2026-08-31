import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCurrentUser } from '@/services/userService';
import { prepareProfilePhoto } from '@/services/photoService';
import { createGroup } from '@/services/groupsService';

export default function CreateGroup() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { data: currentUser, loading: userLoading } = useAsyncData(
    () => getCurrentUser(user!.uid),
    [user?.uid]
  );

  const [name, setName] = useState('');
  const [mission, setMission] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add a group image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setImageUri(result.assets[0].uri);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please give your group a name.');
      return;
    }
    if (!mission.trim()) {
      setError("Please describe your group's mission.");
      return;
    }

    setError('');
    setSaving(true);
    try {
      const image = imageUri ? await prepareProfilePhoto(imageUri) : undefined;
      const groupId = await createGroup(user!.uid, {
        name: name.trim(),
        description: mission.trim(),
        image,
      });
      // Creator is auto-joined, so drop them straight into their new group's chat.
      router.replace(`/group-chat/${groupId}`);
    } catch (err: any) {
      console.error('Failed to create group:', err);
      setError(err?.message ?? 'Something went wrong creating your group.');
      setSaving(false);
    }
  };

  if (userLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Backstop for the VIP gate — the Groups page hides the Create button for
  // free users, but this makes sure the screen itself can't be used either.
  if (!currentUser?.isVip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Create Group</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.gateContainer}>
          <Ionicons name="star-outline" size={40} color={colors.primary} />
          <Text style={[styles.gateText, { color: colors.text }]}>
            Creating groups is a VIP feature.
          </Text>
          <Text style={[styles.gateSubtext, { color: colors.subtleText }]}>
            Upgrade to VIP to start your own community on SLAM.
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/vip-rewards')}
            activeOpacity={0.85}
          >
            <Text style={[styles.upgradeText, { color: colors.onPrimary }]}>Upgrade to VIP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Group</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.85}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="image-outline" size={28} color={colors.primary} />
            </View>
          )}
          <View style={[styles.imageBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Ionicons name={imageUri ? 'pencil' : 'add'} size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.imageLabel, { color: colors.subtleText }]}>Group image (optional)</Text>

        {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

        <Text style={[styles.fieldLabel, { color: colors.primary }]}>Group name *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Sydney Morning Runners"
          placeholderTextColor={colors.subtleText}
        />

        <Text style={[styles.fieldLabel, { color: colors.primary }]}>Mission *</Text>
        <TextInput
          style={[
            styles.input,
            styles.missionInput,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          value={mission}
          onChangeText={setMission}
          placeholder="What's this group about? Who should join?"
          placeholderTextColor={colors.subtleText}
          multiline
        />

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }, saving && styles.disabled]}
          onPress={handleCreate}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.createButtonText, { color: colors.onPrimary }]}>Create Group</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
  },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: AuthFonts.bold },
  gateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  gateText: { fontSize: 15, fontFamily: AuthFonts.bold, textAlign: 'center' },
  gateSubtext: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center', marginBottom: 10 },
  upgradeButton: { borderRadius: 22, paddingHorizontal: 24, paddingVertical: 12 },
  upgradeText: { fontSize: 13, fontFamily: AuthFonts.bold },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  imagePicker: { width: 100, height: 100, marginBottom: 6 },
  image: { width: 100, height: 100, borderRadius: 20 },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  imageLabel: { fontSize: 11, fontFamily: AuthFonts.regular, marginBottom: 20 },
  errorText: { fontSize: 12, fontFamily: AuthFonts.medium, marginBottom: 12, alignSelf: 'flex-start' },
  fieldLabel: { fontSize: 12, fontFamily: AuthFonts.bold, marginBottom: 6, alignSelf: 'flex-start' },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: AuthFonts.regular,
    marginBottom: 18,
  },
  missionInput: { minHeight: 90, textAlignVertical: 'top' },
  createButton: { alignSelf: 'stretch', borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  createButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  disabled: { opacity: 0.7 },
});