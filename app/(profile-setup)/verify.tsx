import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { AuthColors, AuthFonts } from '@/constants/authTheme';
import AuthStepIndicator from '@/components/AuthStepIndicator';
import CodeInput from '@/components/setup/CodeInput';
import { useAuth } from '@/context/AuthContext';
import {
  sendVerificationCode,
  verifyCode,
  BYPASS_CODE,
  emailJsConfigured,
} from '@/services/emailVerificationService';

const RESEND_COOLDOWN_SECONDS = 30;

export default function Verify() {
  const { user } = useAuth();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sending, setSending] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const send = useCallback(async () => {
    if (!user?.email) return;
    setSending(true);
    setError('');
    setDevCode(null);
    try {
      const result = await sendVerificationCode(user.uid, user.email);
      if (result.sent) {
        setInfo(`We sent a 4-digit code to ${user.email}`);
      } else {
        setDevCode(result.devCode ?? null);
        setInfo('Email sending isn\u2019t set up yet — use the code below to continue.');
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setError(err?.message ?? 'Could not send the code. Please try again.');
    } finally {
      setSending(false);
    }
  }, [user]);

  // Send one automatically when the screen opens.
  const hasSent = useRef(false);
  useEffect(() => {
    if (hasSent.current || !user?.email) return;
    hasSent.current = true;
    send();
  }, [user, send]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Ref rather than state: on success the code stays filled in, so without
  // a latch that survives re-renders the auto-submit effect below would fire
  // again the moment `verifying` flipped back — pushing create-profile over
  // and over in a loop.
  const submittingRef = useRef(false);

  const handleVerify = useCallback(
    async (entered: string) => {
      if (!user || submittingRef.current) return;
      submittingRef.current = true;
      setVerifying(true);
      setError('');

      const result = await verifyCode(user.uid, entered);
      setVerifying(false);

      if (!result.success) {
        submittingRef.current = false; // let them try again
        setError(result.message ?? 'That code is not valid.');
        setCode('');
        return;
      }

      // Leave the latch closed on success so this can never re-fire.
      // replace(), not push(), so Back doesn't land them on verify again.
      router.replace('/create-profile');
    },
    [user]
  );

  // Auto-submit once all four digits are in.
  useEffect(() => {
    if (code.length === 4) handleVerify(code);
  }, [code, handleVerify]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <AuthStepIndicator currentStep={2} totalSteps={4} />

        <View style={styles.iconWrap}>
          <Ionicons name="mail-outline" size={40} color={AuthColors.primary} />
        </View>

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>{info || 'Sending your code...'}</Text>

        <CodeInput value={code} onChange={setCode} hasError={!!error} editable={!verifying} />

        {verifying ? <ActivityIndicator color={AuthColors.primary} style={styles.verifyingSpinner} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {devCode ? (
          <View style={styles.devBox}>
            <Text style={styles.devLabel}>DEV — your code</Text>
            <Text style={styles.devCode}>{devCode}</Text>
          </View>
        ) : null}

        <Text style={styles.bypassHint}>
          Testing? Use code <Text style={styles.bypassCode}>{BYPASS_CODE}</Text> to skip verification.
        </Text>

        <TouchableOpacity onPress={send} disabled={cooldown > 0 || sending}>
          <Text style={[styles.resendText, (cooldown > 0 || sending) && styles.resendDisabled]}>
            {sending
              ? 'Sending...'
              : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : 'Resend code'}
          </Text>
        </TouchableOpacity>

        {!emailJsConfigured ? (
          <Text style={styles.configNote}>
            Set your EmailJS keys in .env to send real verification emails.
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuthColors.white },
  content: { flex: 1, padding: 24, paddingTop: 60 },
  iconWrap: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: AuthColors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: AuthFonts.heading,
    color: AuthColors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: AuthColors.subtleText,
    fontFamily: AuthFonts.regular,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  verifyingSpinner: { marginTop: 16 },
  errorText: {
    color: AuthColors.error,
    fontSize: 12,
    fontFamily: AuthFonts.regular,
    textAlign: 'center',
    marginTop: 14,
  },
  devBox: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: AuthColors.inputBackground,
    borderWidth: 1,
    borderColor: AuthColors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
  },
  devLabel: { fontSize: 10, fontFamily: AuthFonts.bold, color: AuthColors.subtleText, letterSpacing: 1 },
  devCode: { fontSize: 22, fontFamily: AuthFonts.bold, color: AuthColors.primary, letterSpacing: 4 },
  bypassHint: {
    fontSize: 12,
    color: AuthColors.subtleText,
    fontFamily: AuthFonts.regular,
    textAlign: 'center',
    marginTop: 24,
  },
  bypassCode: { fontFamily: AuthFonts.bold, color: AuthColors.primary },
  resendText: {
    color: AuthColors.primary,
    fontFamily: AuthFonts.bold,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  resendDisabled: { color: AuthColors.subtleText },
  configNote: {
    fontSize: 10,
    color: AuthColors.subtleText,
    fontFamily: AuthFonts.regular,
    textAlign: 'center',
    marginTop: 24,
  },
});