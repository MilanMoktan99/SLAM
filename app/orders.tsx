import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getMyOrders } from '@/services/ordersService';
import SettingsHeader from '@/components/settings/SettingsHeader';

export default function Orders() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { data: orders, loading } = useAsyncData(() => getMyOrders(user!.uid), [user?.uid]);

  const total = (orders ?? []).reduce((sum, order) => sum + order.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SettingsHeader title="Orders and payments" />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : !orders || orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={40} color={colors.subtleText} />
          <Text style={[styles.emptyText, { color: colors.subtleText }]}>
            No purchases yet. Tickets you buy will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.totalLabel}>Total spent</Text>
              <Text style={styles.totalValue}>${total}</Text>
              <Text style={styles.totalMeta}>
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/invoice/${item.eventId}`)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                <Ionicons name="ticket-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.eventTitle}
                </Text>
                <Text style={[styles.meta, { color: colors.subtleText }]} numberOfLines={1}>
                  {item.paymentMethod} · {new Date(item.purchasedAt).toLocaleDateString()}
                </Text>
                <Text style={[styles.orderId, { color: colors.subtleText }]}>{item.id}</Text>
              </View>
              <Text style={[styles.amount, { color: colors.text }]}>${item.amount}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center', lineHeight: 19 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  totalCard: { borderRadius: 16, padding: 18, marginBottom: 20 },
  totalLabel: { color: '#FFFFFF', fontSize: 12, fontFamily: AuthFonts.medium, opacity: 0.9 },
  totalValue: { color: '#FFFFFF', fontSize: 30, fontFamily: AuthFonts.bold, marginVertical: 2 },
  totalMeta: { color: '#FFFFFF', fontSize: 11, fontFamily: AuthFonts.regular, opacity: 0.9 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  eventTitle: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 2 },
  meta: { fontSize: 11, fontFamily: AuthFonts.regular },
  orderId: { fontSize: 10, fontFamily: AuthFonts.regular, marginTop: 2 },
  amount: { fontSize: 15, fontFamily: AuthFonts.bold },
});