import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useCart } from '@/context/CartContext';
import { ShopProduct } from '@/types/models';

export default function ProductCard({ product }: { product: ShopProduct }) {
  const colors = useThemeColors();
  const { addItem, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const inCart = items.find((item) => item.productId === product.id);

  const handleAdd = () => {
    addItem(product);
    // Brief confirmation so the tap clearly registered.
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: product.image }} style={styles.image} />
      {inCart ? (
        <View style={[styles.qtyBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.qtyBadgeText}>{inCart.quantity}</Text>
        </View>
      ) : null}

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>
        {product.partnerName ? (
          <Text style={[styles.partner, { color: colors.subtleText }]} numberOfLines={1}>
            {product.partnerName}
          </Text>
        ) : null}
        <Text style={[styles.price, { color: colors.primary }]}>${product.price}</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: justAdded ? colors.border : colors.primary }]}
          onPress={handleAdd}
          activeOpacity={0.85}
        >
          {justAdded ? (
            <>
              <Ionicons name="checkmark" size={13} color={colors.subtleText} />
              <Text style={[styles.buttonText, { color: colors.subtleText }]}>Added</Text>
            </>
          ) : (
            <>
              <Ionicons name="bag-add-outline" size={13} color={colors.onPrimary} />
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Add</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  image: { width: '100%', height: 130 },
  qtyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  qtyBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  info: { padding: 10 },
  name: { fontSize: 13, fontFamily: AuthFonts.bold, marginBottom: 2, minHeight: 34 },
  partner: { fontSize: 10, fontFamily: AuthFonts.regular, marginBottom: 4 },
  price: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 16,
    paddingVertical: 8,
  },
  buttonText: { fontSize: 12, fontFamily: AuthFonts.bold },
});