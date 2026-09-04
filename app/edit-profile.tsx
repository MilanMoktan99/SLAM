import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/context/AuthContext';
import { getCurrentUser, updateCurrentUser } from '@/services/userService';
import { prepareProfilePhoto } from '@/services/photoService';
import { interestOptions } from '@/data/interestOptions';
import { languageOptions } from '@/data/languageOptions';
import { connectionGoalOptions } from '@/data/connectionGoalOptions';

import InterestTag from '@/components/profile/InterestTag';
import SelectTagsModal from '@/components/profile/SelectTagsModal';

type TagField = 'interests' | 'languages' | 'connectionGoals';

const TAG_CONFIG: Record<TagField, { title: string; options: string[]; placeholder: string }> = {
  interests: { title: 'Interests', options: interestOptions, placeholder: 'Add your own interest...' },
  languages: { title: 'Languages', options: languageOptions, placeholder: 'Add another language...' },
  connectionGoals: {
    title: 'Looking to connect for',
    options: connectionGoalOptions,
    placeholder: 'Add your own...',
  },
};

export default function EditProfile() {
  const colors = useThemeColors();
  const { user: authUser } = useAuth();
  const { data: user, loading } = useAsyncData(() => getCurrentUser(authUser!.uid), [authUser?.uid]);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [connectionGoals, setConnectionGoals] = useState<string[]>([]);
  const [editingField, setEditingField] = useState<TagField | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio);
    setAvatar(user.avatar);
    setInterests(user.interests ?? []);
    setLanguages(user.languages ?? []);
    setConnectionGoals(user.connectionGoals ?? []);
  }, [user]);

  const valuesFor = (field: TagField) =>
    field === 'interests' ? interests : field === 'languages' ? languages : connectionGoals;

  const setValuesFor = (field: TagField, next: string[]) => {
    if (field === 'interests') setInterests(next);
    else if (field === 'languages') setLanguages(next);
    else setConnectionGoals(next);
  };

  const removeTag = (field: TagField, value: string) => {
    setValuesFor(
      field,
      valuesFor(field).filter((item) => item !== value)
    );
  };

  const handleChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingPhoto(true);
    try {
      setAvatar(await prepareProfilePhoto(result.assets[0].uri));
    } catch (err: any) {
      Alert.alert('Could not use that photo', err?.message ?? 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!authUser) return;
    setSaving(true);
    try {
      await updateCurrentUser(authUser.uid, {
        name: name.trim(),
        bio: bio.trim(),
        avatar,
        interests,
        languages,
        connectionGoals,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, { color: saving ? colors.subtleText : colors.primary }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={handleChangePhoto}
          activeOpacity={0.85}
          disabled={uploadingPhoto}
        >
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.cameraBadge}>
            {uploadingPhoto ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="camera" size={22} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={[styles.email, { color: colors.subtleText }]}>{user.email}</Text>

        <Text style={[styles.fieldLabel, { color: colors.subtleText }]}>Name</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.fieldLabel, { color: colors.subtleText }]}>Bio</Text>
        <TextInput
          style={[
            styles.input,
            styles.bioInput,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          value={bio}
          onChangeText={setBio}
          multiline
        />

        {(Object.keys(TAG_CONFIG) as TagField[]).map((field) => (
          <View key={field} style={styles.tagSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{TAG_CONFIG[field].title}</Text>
            <View style={styles.tagWrap}>
              {valuesFor(field).map((value) => (
                <InterestTag key={value} label={value} removable onRemove={() => removeTag(field, value)} />
              ))}
              <TouchableOpacity
                style={[styles.addMoreButton, { borderColor: colors.border }]}
                onPress={() => setEditingField(field)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={14} color={colors.text} />
                <Text style={[styles.addMoreText, { color: colors.text }]}>
                  {valuesFor(field).length === 0 ? 'Add' : 'Add more...'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity onPress={() => Alert.alert('Social links', 'Coming soon.')}>
          <Text style={[styles.socialLinksText, { color: colors.text }]}>Add Social Links</Text>
        </TouchableOpacity>
      </ScrollView>

      {editingField ? (
        <SelectTagsModal
          visible={!!editingField}
          title={TAG_CONFIG[editingField].title}
          options={TAG_CONFIG[editingField].options}
          selected={valuesFor(editingField)}
          placeholder={TAG_CONFIG[editingField].placeholder}
          onClose={() => setEditingField(null)}
          onSave={(next) => {
            setValuesFor(editingField, next);
            setEditingField(null);
          }}
        />
      ) : null}
    </View>
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
    paddingBottom: 10,
  },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontFamily: AuthFonts.bold },
  scroll: { paddingHorizontal: 20, paddingBottom: 60, alignItems: 'center' },
  avatarWrapper: { marginTop: 10 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  cameraBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  email: { fontSize: 13, fontFamily: AuthFonts.regular, marginTop: 10, marginBottom: 20 },
  fieldLabel: { alignSelf: 'flex-start', fontSize: 11, fontFamily: AuthFonts.medium, marginBottom: 4 },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: AuthFonts.regular,
    marginBottom: 16,
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  tagSection: { alignSelf: 'stretch', marginTop: 8 },
  sectionTitle: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 10 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 10,
  },
  addMoreText: { fontSize: 13, fontFamily: AuthFonts.medium },
  socialLinksText: {
    alignSelf: 'flex-start',
    fontSize: 13,
    fontFamily: AuthFonts.medium,
    textDecorationLine: 'underline',
    marginTop: 20,
  },
});