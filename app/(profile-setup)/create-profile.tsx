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
import { AuthColors, AuthFonts } from '@/constants/authTheme';
import AuthStepIndicator from '@/components/AuthStepIndicator';
import InterestBubble from '@/components/setup/InterestBubble';
import { languageOptions } from '@/data/languageOptions';
import { connectionGoalOptions } from '@/data/connectionGoalOptions';
import { useAuth } from '@/context/AuthContext';
import { prepareProfilePhoto } from '@/services/photoService';
import { saveProfileDetails } from '@/services/onboardingService';

export default function CreateProfile() {
  const { user } = useAuth();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [occupation, setOccupation] = useState('');
  const [company, setCompany] = useState('');
  const [education, setEducation] = useState('');
  const [dob, setDob] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [connectionGoals, setConnectionGoals] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const toggleLanguage = (label: string) => {
    setLanguages((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]));
  };

  const toggleGoal = (label: string) => {
    setConnectionGoals((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setPhotoUri(result.assets[0].uri);
  };

  const handleContinue = async () => {
    if (!photoUri) {
      setError('A profile photo is required.');
      return;
    }
    if (!bio.trim()) {
      setError('Please add a short bio.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      setUploadingPhoto(true);
      const avatar = await prepareProfilePhoto(photoUri);
      setUploadingPhoto(false);

      await saveProfileDetails(user!.uid, {
        avatar,
        bio: bio.trim(),
        city: city.trim() || null,
        area: area.trim() || null,
        dob: dob.trim() || null,
        occupation: occupation.trim() || null,
        company: company.trim() || null,
        education: education.trim() || null,
        languages,
        connectionGoals,
      });

      router.push('/interests');
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setError(err?.message ?? 'Something went wrong saving your profile. Please try again.');
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <AuthStepIndicator currentStep={3} totalSteps={4} />
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.helperText}>
          SLAM is a community for women — please upload a genuine photo of yourself. New profiles are
          reviewed to help keep the community safe.
        </Text>

        <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto} activeOpacity={0.85}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={28} color={AuthColors.primary} />
            </View>
          )}
          <View style={styles.photoBadge}>
            <Ionicons name={photoUri ? 'pencil' : 'add'} size={14} color={AuthColors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.photoLabel}>Profile photo *</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.fieldLabel}>Bio *</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell the community a bit about yourself..."
          placeholderTextColor={AuthColors.subtleText}
          multiline
        />

        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.fieldLabel}>City</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Sydney"
          placeholderTextColor={AuthColors.subtleText}
        />
        <Text style={styles.fieldLabel}>Area</Text>
        <TextInput
          style={styles.input}
          value={area}
          onChangeText={setArea}
          placeholder="e.g. Bondi — kept private, not shown publicly"
          placeholderTextColor={AuthColors.subtleText}
        />

        <Text style={styles.sectionTitle}>Professional</Text>
        <Text style={styles.fieldLabel}>Occupation</Text>
        <TextInput
          style={styles.input}
          value={occupation}
          onChangeText={setOccupation}
          placeholder="What do you do?"
          placeholderTextColor={AuthColors.subtleText}
        />
        <Text style={styles.fieldLabel}>Company</Text>
        <TextInput
          style={styles.input}
          value={company}
          onChangeText={setCompany}
          placeholder="Where do you work?"
          placeholderTextColor={AuthColors.subtleText}
        />
        <Text style={styles.fieldLabel}>Education</Text>
        <TextInput
          style={styles.input}
          value={education}
          onChangeText={setEducation}
          placeholder="School or university"
          placeholderTextColor={AuthColors.subtleText}
        />

        <Text style={styles.sectionTitle}>Personal</Text>
        <Text style={styles.fieldLabel}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD — kept private, not shown publicly"
          placeholderTextColor={AuthColors.subtleText}
        />

        <Text style={styles.sectionTitle}>Languages</Text>
        <View style={styles.bubbleWrap}>
          {languageOptions.map((lang) => (
            <InterestBubble key={lang} label={lang} selected={languages.includes(lang)} onPress={() => toggleLanguage(lang)} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Looking to connect for</Text>
        <View style={styles.bubbleWrap}>
          {connectionGoalOptions.map((goal) => (
            <InterestBubble key={goal} label={goal} selected={connectionGoals.includes(goal)} onPress={() => toggleGoal(goal)} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={AuthColors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {uploadingPhoto ? 'Processing photo...' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuthColors.white },
  scroll: { padding: 24, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: AuthColors.text, marginBottom: 8, alignSelf: 'flex-start' },
  helperText: {
    fontSize: 12,
    color: AuthColors.subtleText,
    lineHeight: 17,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  photoPicker: { width: 100, height: 100, marginBottom: 6 },
  photo: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AuthColors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AuthColors.border,
    borderStyle: 'dashed',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AuthColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AuthColors.white,
  },
  photoLabel: { fontSize: 11, color: AuthColors.subtleText, marginBottom: 16 },
  errorText: { color: AuthColors.error, fontSize: 12, marginBottom: 12, alignSelf: 'flex-start' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AuthColors.text,
    alignSelf: 'flex-start',
    marginTop: 18,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    color: AuthColors.primary,
    fontWeight: '600',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: AuthColors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: AuthColors.text,
    marginBottom: 16,
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  bubbleWrap: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'flex-start' },
  primaryButton: {
    alignSelf: 'stretch',
    backgroundColor: AuthColors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: AuthColors.white, fontSize: 16, fontWeight: '700' },
});