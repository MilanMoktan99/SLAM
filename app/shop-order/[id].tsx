import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getOrderById } from '@/services/ordersService';

const STATUS_LABELS: Record<string, string> = {
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function ShopOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { user } = useAuth();

  const { data: order, loading } = useAsyncData(() => getOrderById(user!.uid, id), [user?.uid, id]);

  if (loading || !order) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const purchaseDate = order.purchasedAt ? new Date(order.purchasedAt).toLocaleDateString() : '';
  const itemsTotal = (order.items ?? []).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = order.amount - itemsTotal;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/(tabs)/community')}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Your Order</Text>
        <TouchableOpacity
          onPress={() => Share.share({ message: `SLAM order ${order.id} — $${order.amount.toFixed(2)}` })}
          hitSlop={8}
        >
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.successRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={30} color="#FFFFFF" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Order confirmed!</Text>
          <Text style={[styles.successSubtitle, { color: colors.subtleText }]}>
            Thanks for your order. We'll email you when it ships.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={[styles.orderLabel, { color: colors.subtleText }]}>Order number</Text>
              <Text style={[styles.orderId, { color: colors.text }]}>{order.id}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: colors.primary }]}>
              <Text style={[styles.statusText, { color: colors.onPrimary }]}>
                {STATUS_LABELS[order.status ?? 'processing']}
              </Text>
            </View>
          </View>

          <View style={[styles.dashedDivider, { borderColor: colors.border }]} />

          {(order.items ?? []).map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.itemQty, { color: colors.subtleText }]}>Qty {item.quantity}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.text }]}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Row label="Items" value={`$${itemsTotal.toFixed(2)}`} />
          <Row label="Shipping" value={shippingCost <= 0 ? 'Free' : `$${shippingCost.toFixed(2)}`} />
          <Row label="Payment" value={order.paymentMethod} />
          <Row label="Ordered" value={purchaseDate} />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total paid</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>${order.amount.toFixed(2)}</Text>
          </View>
        </View>

        {order.shipping ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Delivering to</Text>
            <Text style={[styles.addressText, { color: colors.subtleText }]}>
              {order.shipping.fullName}
              {'\n'}
              {order.shipping.address}
              {'\n'}
              {order.shipping.suburb} {order.shipping.postcode}
              {'\n'}
              {order.shipping.phone}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/(tabs)/community')}
          activeOpacity={0.85}
        >
          <Text style={[styles.homeButtonText, { color: colors.onPrimary }]}>Continue shopping</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/orders')} activeOpacity={0.7}>
          <Text style={[styles.secondaryLink, { color: colors.primary }]}>View all orders</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.subtleText }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
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
    paddingBottom: 16,
  },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: AuthFonts.bold },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  successRow: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  successTitle: { fontSize: 20, fontFamily: AuthFonts.bold, marginBottom: 4 },
  successSubtitle: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center' },
  card: { alignSelf: 'stretch', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontFamily: AuthFonts.bold, marginBottom: 8 },
  addressText: { fontSize: 13, fontFamily: AuthFonts.regular, lineHeight: 20 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderLabel: { fontSize: 10, fontFamily: AuthFonts.regular },
  orderId: { fontSize: 15, fontFamily: AuthFonts.bold, marginTop: 2 },
  statusPill: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { fontSize: 11, fontFamily: AuthFonts.bold },
  dashedDivider: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  itemImage: { width: 48, height: 48, borderRadius: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontFamily: AuthFonts.medium },
  itemQty: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 2 },
  itemPrice: { fontSize: 13, fontFamily: AuthFonts.bold },
  divider: { height: 1, marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 12, fontFamily: AuthFonts.regular },
  rowValue: { fontSize: 12, fontFamily: AuthFonts.medium },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontFamily: AuthFonts.bold },
  totalValue: { fontSize: 18, fontFamily: AuthFonts.bold },
  homeButton: { alignSelf: 'stretch', borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginBottom: 14 },
  homeButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  secondaryLink: { fontSize: 13, fontFamily: AuthFonts.medium },
});