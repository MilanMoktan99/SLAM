import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ShopProduct } from '@/types/models';

export default function ProductCard({ product }: { product: ShopProduct }) {
  const colors = useThemeColors();

  const handleShop = () => {
    if (product.url) {
      Linking.openURL(product.url);
      return;
    }
    // No checkout for shop items yet — event tickets are the only paid flow
    // that's wired up.
    Alert.alert(product.name, 'Shop checkout is coming soon. For now, browse and save what you like!');
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: product.image }} style={styles.image} />
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
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleShop}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Shop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  image: { width: '100%', height: 130 },
  info: { padding: 10 },
  name: { fontSize: 13, fontFamily: AuthFonts.bold, marginBottom: 2, minHeight: 34 },
  partner: { fontSize: 10, fontFamily: AuthFonts.regular, marginBottom: 4 },
  price: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 8 },
  button: { borderRadius: 16, paddingVertical: 8, alignItems: 'center' },
  buttonText: { fontSize: 12, fontFamily: AuthFonts.bold },
});