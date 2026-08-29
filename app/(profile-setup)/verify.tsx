import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { AuthColors, AuthFonts } from '@/constants/authTheme';
import AuthStepIndicator from '@/components/AuthStepIndicator';

// A real verification email is sent (once automatically at signup, and
// again here on Resend) — but per your call, continuing isn't gated on
// actually clicking the link. No blocking OTP/verification step for now.
export default function Verify() {
  const [resent, setResent] = useState(false);

  const handleResend = () => {
    if (auth.currentUser) {
      sendEmailVerification(auth.currentUser).catch(() => {});
    }
    setResent(true);
  };

  const handleContinue = () => {
    router.push('/create-profile');
  };

  return (
    <View style={styles.container}>
      <AuthStepIndicator currentStep={2} totalSteps={4} />

      <View style={styles.iconWrap}>
        <Ionicons name="mail-outline" size={48} color={AuthColors.primary} />
      </View>

      <Text style={styles.title}>Verify Your Account</Text>
      <Text style={styles.subtitle}>
        We've sent a verification link to your email. You can continue setting up your profile now
        and verify whenever it's convenient.
      </Text>

      <TouchableOpacity onPress={handleResend}>
        <Text style={styles.resendText}>{resent ? 'Link resent!' : 'Resend link'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={handleContinue} activeOpacity={0.85}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuthColors.white, padding: 24, paddingTop: 60 },
  iconWrap: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: AuthColors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  title: { fontSize: 20, fontWeight: '700', color: AuthColors.text, textAlign: 'center', marginBottom: 12 },
  subtitle: {
    fontSize: 14,
    color: AuthColors.subtleText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  resendText: { color: AuthColors.primary, fontWeight: '600', textAlign: 'center', marginBottom: 32 },
  primaryButton: {
    backgroundColor: AuthColors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: AuthColors.white, fontSize: 16, fontWeight: '700' },
});