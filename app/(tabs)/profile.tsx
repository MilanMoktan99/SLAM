import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePullToRefresh, useTabPressRefresh } from '@/hooks/useRefresh';
import { getCurrentUser, updateCurrentUser } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import { CurrentUser } from '@/types/models';

import ProfileHeader from '@/components/profile/ProfileHeader';
import InterestTag from '@/components/profile/InterestTag';
import PrivateInfoRow from '@/components/profile/PrivateInfoRow';
import EditFieldModal from '@/components/profile/EditFieldModal';
import VipPromoCard from '@/components/profile/VipPromoCard';

type EditableField =
  | 'email'
  | 'dob'
  | 'phone'
  | 'area'
  | 'city'
  | 'occupation'
  | 'company'
  | 'education'
  | null;

const FIELD_LABELS: Record<Exclude<EditableField, null>, string> = {
  email: 'Email',
  dob: 'Date of Birth',
  phone: 'Phone',
  area: 'Area',
  city: 'City',
  occupation: 'Occupation',
  company: 'Company',
  education: 'Education',
};

export default function Profile() {
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { user: authUser } = useAuth();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<EditableField>(null);

  // Refetch every time this tab gains focus — this is what makes edits made
  // on the Edit Profile screen (or the quick-edit modal below) show up here
  // as soon as you come back, without any extra plumbing.
  const reload = useCallback(
    async (silent = false) => {
      if (!authUser) return;
      if (!silent) setLoading(true);
      const data = await getCurrentUser(authUser.uid);
      setUser(data);
      setLoading(false);
    },
    [authUser]
  );

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const scrollRef = useRef<ScrollView>(null);
  const { refreshing, onRefresh } = usePullToRefresh(useCallback(() => reload(true), [reload]));
  useTabPressRefresh(scrollRef, onRefresh);

  const handleSaveField = async (value: string) => {
    if (!editingField || !authUser) return;
    const updated = await updateCurrentUser(authUser.uid, { [editingField]: value });
    setUser(updated);
    setEditingField(null);
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
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <ProfileHeader
          name={user.name}
          avatar={user.avatar}
          onPressSettings={() => router.push('/settings')}
          onPressEdit={() => router.push('/edit-profile')}
          onPressShare={() => Alert.alert('Share Profile', 'Sharing coming soon.')}
        />

        <TouchableOpacity
          style={styles.myConnectionsLink}
          onPress={() => router.push('/my-connections')}
          activeOpacity={0.7}
        >
          <Ionicons name="people-outline" size={16} color={colors.primary} />
          <Text style={[styles.myConnectionsText, { color: colors.primary }]}>My Connections</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.vipCardWrapper}>
          <VipPromoCard isVip={user.isVip} points={user.points} onPress={() => router.push('/vip-rewards')} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About me</Text>
          <Text style={[styles.bio, { color: colors.subtleText }]}>{user.bio}</Text>
        </View>

        {user.interests && user.interests.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            <View style={styles.interestsWrap}>
              {user.interests.map((interest) => (
                <InterestTag key={interest} label={interest} />
              ))}
            </View>
          </View>
        ) : null}

        {user.languages && user.languages.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Languages</Text>
            <View style={styles.interestsWrap}>
              {user.languages.map((lang) => (
                <InterestTag key={lang} label={lang} />
              ))}
            </View>
          </View>
        ) : null}

        {user.connectionGoals && user.connectionGoals.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Looking to connect for</Text>
            <View style={styles.interestsWrap}>
              {user.connectionGoals.map((goal) => (
                <InterestTag key={goal} label={goal} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <PrivateInfoRow
              label="City"
              value={user.city || 'Not set'}
              onPress={() => setEditingField('city')}
            />
            <PrivateInfoRow
              label="Occupation"
              value={user.occupation || 'Not set'}
              onPress={() => setEditingField('occupation')}
            />
            <PrivateInfoRow
              label="Company"
              value={user.company || 'Not set'}
              onPress={() => setEditingField('company')}
            />
            <PrivateInfoRow
              label="Education"
              value={user.education || 'Not set'}
              isLast
              onPress={() => setEditingField('education')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Private Information</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <PrivateInfoRow
              label="Membership"
              value={user.isVip ? 'VIP' : 'Free'}
              onPress={() => router.push('/vip-rewards')}
            />
            <PrivateInfoRow label="Email" value={user.email} onPress={() => setEditingField('email')} />
            <PrivateInfoRow label="DOB" value={user.dob} onPress={() => setEditingField('dob')} />
            <PrivateInfoRow label="Phone" value={user.phone} onPress={() => setEditingField('phone')} />
            <PrivateInfoRow
              label="Area"
              value={user.area || 'Not set'}
              isLast
              onPress={() => setEditingField('area')}
            />
          </View>
        </View>

      </ScrollView>

      {editingField ? (
        <EditFieldModal
          visible={!!editingField}
          title={`Edit ${FIELD_LABELS[editingField]}`}
          initialValue={String(user[editingField] ?? '')}
          keyboardType={
            editingField === 'email' ? 'email-address' : editingField === 'phone' ? 'phone-pad' : 'default'
          }
          onClose={() => setEditingField(null)}
          onSave={handleSaveField}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  myConnectionsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  myConnectionsText: { fontSize: 13, fontFamily: AuthFonts.bold },
  vipCardWrapper: { marginTop: 12 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 10 },
  bio: { fontSize: 13, lineHeight: 20, fontFamily: AuthFonts.regular },
  interestsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  infoCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
});