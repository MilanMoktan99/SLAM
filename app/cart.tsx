import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCart } from '@/context/CartContext';

export default function Cart() {
  const colors = useThemeColors();
  const { items, subtotal, itemCount, setQuantity, removeItem } = useCart();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Your Cart</Text>
        <View style={{ width: 34 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={40} color={colors.subtleText} />
          <Text style={[styles.emptyText, { color: colors.subtleText }]}>
            Your cart is empty. Browse the shop to find something you like.
          </Text>
          <TouchableOpacity
            style={[styles.browseButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.browseText, { color: colors.onPrimary }]}>Browse shop</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.productId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.partnerName ? (
                    <Text style={[styles.partner, { color: colors.subtleText }]} numberOfLines={1}>
                      {item.partnerName}
                    </Text>
                  ) : null}
                  <Text style={[styles.price, { color: colors.primary }]}>${item.price}</Text>

                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[styles.qtyButton, { borderColor: colors.border }]}
                      onPress={() => setQuantity(item.productId, item.quantity - 1)}
                      hitSlop={6}
                    >
                      <Ionicons name="remove" size={15} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyValue, { color: colors.text }]}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={[styles.qtyButton, { borderColor: colors.border }]}
                      onPress={() => setQuantity(item.productId, item.quantity + 1)}
                      hitSlop={6}
                    >
                      <Ionicons name="add" size={15} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeItem(item.productId)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={17} color={colors.subtleText} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />

          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.subtotalRow}>
              <Text style={[styles.subtotalLabel, { color: colors.subtleText }]}>
                Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </Text>
              <Text style={[styles.subtotalValue, { color: colors.text }]}>${subtotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/shop-checkout')}
              activeOpacity={0.85}
            >
              <Text style={[styles.checkoutText, { color: colors.onPrimary }]}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 14 },
  emptyText: { fontSize: 13, fontFamily: AuthFonts.regular, textAlign: 'center', lineHeight: 19 },
  browseButton: { borderRadius: 22, paddingHorizontal: 24, paddingVertical: 12 },
  browseText: { fontSize: 13, fontFamily: AuthFonts.bold },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  row: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 12, gap: 12 },
  image: { width: 80, height: 80, borderRadius: 12 },
  info: { flex: 1 },
  name: { fontSize: 13, fontFamily: AuthFonts.bold },
  partner: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 2 },
  price: { fontSize: 14, fontFamily: AuthFonts.bold, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyButton: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 14, fontFamily: AuthFonts.bold, minWidth: 18, textAlign: 'center' },
  removeButton: { marginLeft: 'auto' },
  footer: { borderTopWidth: 1, padding: 20, paddingBottom: 30 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  subtotalLabel: { fontSize: 13, fontFamily: AuthFonts.regular },
  subtotalValue: { fontSize: 20, fontFamily: AuthFonts.bold },
  checkoutButton: { borderRadius: 26, paddingVertical: 15, alignItems: 'center' },
  checkoutText: { fontSize: 15, fontFamily: AuthFonts.bold },
});