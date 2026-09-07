import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePullToRefresh } from '@/hooks/useRefresh';
import { getPartners, getProducts } from '@/services/partnersService';
import { getCurrentUser } from '@/services/userService';
import { seedPartners } from '@/scripts/seedPartners'; // TEMP — remove once seeded
import { PARTNER_CATEGORIES } from '@/data/partnerCategories';
import { PartnerCategory } from '@/types/models';

import SearchBar from '@/components/events/SearchBar';
import SegmentTabs from '@/components/partners/SegmentTabs';
import PartnerCard from '@/components/partners/PartnerCard';
import PerkCard from '@/components/partners/PerkCard';
import ProductCard from '@/components/partners/ProductCard';

type Segment = 'partners' | 'perks' | 'shop';

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: 'partners', label: 'Our Partners' },
  { key: 'perks', label: 'Browse Perks' },
  { key: 'shop', label: 'Shop' },
];

export default function PartnersPerksView({ bottomPadding }: { bottomPadding: number }) {
  const colors = useThemeColors();
  const { user } = useAuth();

  const [segment, setSegment] = useState<Segment>('perks');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PartnerCategory | 'all'>('all');
  const [filterVisible, setFilterVisible] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: partners, loading: partnersLoading } = useAsyncData(getPartners, [refreshKey]);
  const { data: products, loading: productsLoading } = useAsyncData(getProducts, [refreshKey]);
  const { data: currentUser } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);

  const isVip = !!currentUser?.isVip;
  const loading = partnersLoading || productsLoading;

  const { refreshing, onRefresh } = usePullToRefresh(
    useCallback(async () => setRefreshKey((k) => k + 1), [])
  );

  const query = search.trim().toLowerCase();

  const filteredPartners = (partners ?? []).filter((partner) => {
    const matchesCategory = category === 'all' || partner.category === category;
    const matchesSearch =
      !query ||
      partner.name.toLowerCase().includes(query) ||
      partner.description.toLowerCase().includes(query) ||
      partner.perkTitle.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const filteredProducts = (products ?? []).filter(
    (product) =>
      !query ||
      product.name.toLowerCase().includes(query) ||
      (product.partnerName ?? '').toLowerCase().includes(query)
  );

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedPartners();
      Alert.alert('Seeded', `Added ${result.partners} partners and ${result.products} products.`);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      Alert.alert('Seeding failed', err?.message ?? 'Check your Firestore rules/config.');
    } finally {
      setSeeding(false);
    }
  };

  const activeCategoryLabel =
    category === 'all'
      ? 'All categories'
      : PARTNER_CATEGORIES.find((c) => c.key === category)?.label ?? 'All categories';

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar value={search} onChangeText={setSearch} />
          </View>
          {segment !== 'shop' ? (
            <TouchableOpacity
              style={[styles.filterButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setFilterVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="options-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <SegmentTabs segments={SEGMENTS} selected={segment} onSelect={setSegment} />

        {segment !== 'shop' && category !== 'all' ? (
          <TouchableOpacity
            style={[styles.activeFilter, { backgroundColor: colors.primary }]}
            onPress={() => setCategory('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.activeFilterText, { color: colors.onPrimary }]}>{activeCategoryLabel}</Text>
            <Ionicons name="close" size={13} color={colors.onPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {segment === 'shop' ? (
        <FlatList
          key="shop-grid"
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[styles.gridContent, { paddingBottom: bottomPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListHeaderComponent={<SeedButton seeding={seeding} onPress={handleSeed} />}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.subtleText }]}>
              {query ? 'No products match your search.' : 'No products listed yet.'}
            </Text>
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      ) : (
        <FlatList
          key="partner-list"
          data={filteredPartners}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListHeaderComponent={<SeedButton seeding={seeding} onPress={handleSeed} />}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.subtleText }]}>
              {query || category !== 'all'
                ? 'No partners match your filters.'
                : 'No partners listed yet.'}
            </Text>
          }
          renderItem={({ item }) =>
            segment === 'partners' ? (
              <PartnerCard partner={item} onPress={() => router.push(`/partner/${item.id}`)} />
            ) : (
              <PerkCard partner={item} onPress={() => router.push(`/partner/${item.id}`)} />
            )
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPadding - 40 }]}
        onPress={() =>
          isVip
            ? router.push('/list-business')
            : Alert.alert('VIP feature', 'You need to upgrade to VIP to list your business with SLAM.')
        }
        activeOpacity={0.85}
      >
        <Ionicons name="storefront-outline" size={22} color={colors.onPrimary} />
      </TouchableOpacity>

      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setFilterVisible(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filter by category</Text>
            <ScrollView>
              <FilterRow
                label="All categories"
                selected={category === 'all'}
                onPress={() => {
                  setCategory('all');
                  setFilterVisible(false);
                }}
              />
              {PARTNER_CATEGORIES.map((option) => (
                <FilterRow
                  key={option.key}
                  label={option.label}
                  selected={category === option.key}
                  onPress={() => {
                    setCategory(option.key);
                    setFilterVisible(false);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function FilterRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity style={styles.filterRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.filterRowText, { color: colors.text }]}>{label}</Text>
      {selected ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
    </TouchableOpacity>
  );
}

// TEMP — delete this and its usages once you've seeded Firestore once.
function SeedButton({ seeding, onPress }: { seeding: boolean; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.seedButton, { borderColor: colors.primary }]}
      onPress={onPress}
      disabled={seeding}
      activeOpacity={0.8}
    >
      <Text style={[styles.seedButtonText, { color: colors.primary }]}>
        {seeding ? 'Seeding…' : 'DEV: Seed Partners & Shop'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: { paddingTop: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, marginBottom: 12 },
  filterButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activeFilterText: { fontSize: 11, fontFamily: AuthFonts.bold },
  gridContent: { paddingHorizontal: 14 },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
    fontSize: 13,
    fontFamily: AuthFonts.regular,
    lineHeight: 19,
  },
  seedButton: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  seedButtonText: { fontSize: 12, fontFamily: AuthFonts.bold },
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 12 },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  filterRowText: { fontSize: 14, fontFamily: AuthFonts.regular },
});