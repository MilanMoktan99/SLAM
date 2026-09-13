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
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthFonts } from '@/constants/authTheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCurrentUser } from '@/services/userService';
import { recordShopOrder } from '@/services/ordersService';
import { ShippingDetails } from '@/types/models';

const PAYMENT_METHODS = [
  { key: 'paypal', label: 'PayPal', icon: 'logo-paypal' as const },
  { key: 'visa', label: 'Visa', icon: 'card-outline' as const },
  { key: 'mastercard', label: 'Mastercard', icon: 'card' as const },
];

const SHIPPING_FLAT_RATE = 9.95;
const FREE_SHIPPING_THRESHOLD = 100;

export default function ShopCheckout() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { items, subtotal, itemCount, clearCart } = useCart();
  const { data: currentUser } = useAsyncData(() => getCurrentUser(user!.uid), [user?.uid]);

  const [shipping, setShipping] = useState<ShippingDetails>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    suburb: '',
    postcode: '',
  });
  const [method, setMethod] = useState('visa');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // Prefill from their profile so they're not retyping what we already know.
  useEffect(() => {
    if (!currentUser) return;
    setShipping((prev) => ({
      ...prev,
      fullName: prev.fullName || currentUser.name || '',
      email: prev.email || currentUser.email || '',
      phone: prev.phone || currentUser.phone || '',
    }));
  }, [currentUser]);

  // An empty cart here means they got back after ordering — send them home.
  useEffect(() => {
    if (items.length === 0 && !processing) router.replace('/(tabs)/community');
  }, [items.length, processing]);

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  const total = subtotal + shippingCost;

  const update = (field: keyof ShippingDetails, value: string) =>
    setShipping((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!shipping.fullName.trim()) next.fullName = 'Required';
    if (!shipping.email.trim()) next.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) next.email = 'Enter a valid email';
    if (!shipping.phone.trim()) next.phone = 'Required';
    if (!shipping.address.trim()) next.address = 'Required';
    if (!shipping.suburb.trim()) next.suburb = 'Required';
    if (!shipping.postcode.trim()) next.postcode = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate() || !user) return;
    setProcessing(true);
    try {
      // No real payment processing — see the notice below. When a provider
      // is integrated, the charge happens here and the order is only
      // recorded once it succeeds.
      const orderId = `SHOP-${Date.now().toString(36).toUpperCase()}`;
      await recordShopOrder(user.uid, {
        id: orderId,
        items,
        amount: total,
        paymentMethod: PAYMENT_METHODS.find((m) => m.key === method)?.label ?? method,
        purchasedAt: new Date().toISOString(),
        shipping,
      });
      clearCart();
      router.replace(`/shop-order/${orderId}`);
    } catch (err: any) {
      console.error('Order failed:', err);
      Alert.alert("Couldn't place order", err?.message ?? 'Please try again.');
      setProcessing(false);
    }
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order summary</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {items.map((item) => (
            <View key={item.productId} style={styles.summaryRow}>
              <Image source={{ uri: item.image }} style={styles.summaryImage} />
              <View style={styles.summaryInfo}>
                <Text style={[styles.summaryName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.summaryQty, { color: colors.subtleText }]}>Qty {item.quantity}</Text>
              </View>
              <Text style={[styles.summaryPrice, { color: colors.text }]}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery details</Text>
        <Field label="Full name *" value={shipping.fullName} onChangeText={(v) => update('fullName', v)} error={errors.fullName} />
        <Field label="Email *" value={shipping.email} onChangeText={(v) => update('email', v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
        <Field label="Phone *" value={shipping.phone} onChangeText={(v) => update('phone', v)} error={errors.phone} keyboardType="phone-pad" />
        <Field label="Street address *" value={shipping.address} onChangeText={(v) => update('address', v)} error={errors.address} />
        <View style={styles.fieldRow}>
          <View style={{ flex: 2 }}>
            <Field label="Suburb *" value={shipping.suburb} onChangeText={(v) => update('suburb', v)} error={errors.suburb} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Postcode *" value={shipping.postcode} onChangeText={(v) => update('postcode', v)} error={errors.postcode} keyboardType="numeric" />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment method</Text>
        {PAYMENT_METHODS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.methodRow,
              { backgroundColor: colors.surface, borderColor: method === option.key ? colors.primary : colors.border },
            ]}
            onPress={() => setMethod(option.key)}
            activeOpacity={0.8}
          >
            <Ionicons name={option.icon} size={22} color={colors.primary} />
            <Text style={[styles.methodLabel, { color: colors.text }]}>{option.label}</Text>
            <Ionicons
              name={method === option.key ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={method === option.key ? colors.primary : colors.subtleText}
            />
          </TouchableOpacity>
        ))}

        <View style={[styles.card, styles.totalsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TotalRow label={`Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`} value={`$${subtotal.toFixed(2)}`} />
          <TotalRow
            label="Shipping"
            value={shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
            highlight={shippingCost === 0}
          />
          {shippingCost > 0 ? (
            <Text style={[styles.shippingNote, { color: colors.subtleText }]}>
              Free shipping on orders over ${FREE_SHIPPING_THRESHOLD}
            </Text>
          ) : null}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={[styles.noticeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.subtleText} />
          <Text style={[styles.noticeText, { color: colors.subtleText }]}>
            Payments aren't connected yet — placing this order records it without charging you.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.placeButton, { backgroundColor: colors.primary }, processing && styles.disabled]}
          onPress={handlePlaceOrder}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.placeButtonText, { color: colors.onPrimary }]}>
              Place Order · ${total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  error,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences';
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.primary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border },
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error ? <Text style={[styles.fieldError, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

function TotalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const colors = useThemeColors();
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalRowLabel, { color: colors.subtleText }]}>{label}</Text>
      <Text style={[styles.totalRowValue, { color: highlight ? colors.primary : colors.text }]}>{value}</Text>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontFamily: AuthFonts.bold, marginBottom: 12, marginTop: 8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  summaryImage: { width: 44, height: 44, borderRadius: 10 },
  summaryInfo: { flex: 1 },
  summaryName: { fontSize: 13, fontFamily: AuthFonts.medium },
  summaryQty: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 2 },
  summaryPrice: { fontSize: 13, fontFamily: AuthFonts.bold },
  fieldWrap: { marginBottom: 14 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldLabel: { fontSize: 12, fontFamily: AuthFonts.bold, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: AuthFonts.regular },
  fieldError: { fontSize: 11, fontFamily: AuthFonts.regular, marginTop: 4 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  methodLabel: { flex: 1, fontSize: 14, fontFamily: AuthFonts.medium },
  totalsCard: { marginTop: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  totalRowLabel: { fontSize: 13, fontFamily: AuthFonts.regular },
  totalRowValue: { fontSize: 13, fontFamily: AuthFonts.medium },
  shippingNote: { fontSize: 11, fontFamily: AuthFonts.regular, marginBottom: 4 },
  divider: { height: 1, marginVertical: 10 },
  totalLabel: { fontSize: 15, fontFamily: AuthFonts.bold },
  totalValue: { fontSize: 20, fontFamily: AuthFonts.bold },
  noticeBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { flex: 1, fontSize: 11, fontFamily: AuthFonts.regular, lineHeight: 16 },
  placeButton: { borderRadius: 26, paddingVertical: 15, alignItems: 'center' },
  placeButtonText: { fontSize: 15, fontFamily: AuthFonts.bold },
  disabled: { opacity: 0.7 },
});