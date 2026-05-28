import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPendingConfirmation } from '../../auth-state';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';

const OTP_LEN = 6;

export default function OTPScreen() {
  const { phone, verificationId } = useLocalSearchParams<{ phone: string; verificationId: string }>();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const refs = useRef<(TextInput | null)[]>(Array(OTP_LEN).fill(null));
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const complete = digits.every(Boolean);

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    inner: { flex: 1, paddingHorizontal: spacing[6], paddingTop: spacing[6], gap: spacing[8] },
    back: { alignSelf: 'flex-start' },
    backText: { fontFamily: typography.sans, fontSize: typography.sm, color: c.fg3 },
    header: { gap: 8 },
    title: { fontFamily: typography.serif, fontSize: typography['3xl'], color: c.fg, letterSpacing: -0.5 },
    sub: { fontFamily: typography.sans, fontSize: typography.sm, color: c.fg2 },
    otpRow: { flexDirection: 'row', gap: spacing[2] },
    box: {
      flex: 1, height: 56,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.sm,
      fontFamily: typography.mono, fontSize: typography.xl, color: c.fg,
    },
    boxFilled: { borderColor: c.sageHi },
    btn: {
      backgroundColor: c.warm, borderRadius: radii.pill,
      paddingVertical: spacing[4], alignItems: 'center',
    },
    btnOff: { opacity: 0.35 },
    btnText: {
      fontFamily: typography.sansSemiBold, fontSize: typography.base,
      color: c.ink,
    },
    resend: { alignItems: 'center' },
    resendText: { fontFamily: typography.sans, fontSize: typography.sm, color: c.fg3 },
  });

  function handleDigit(val: string, idx: number) {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    if (d && idx < OTP_LEN - 1) refs.current[idx + 1]?.focus();
  }

  function handleBackspace(idx: number) {
    if (!digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
      refs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    if (!complete || loading || !verificationId) return;
    setLoading(true);
    try {
      const code = digits.join('');
      if (verificationId === 'demo') {
        if (code !== '000000') throw new Error('Invalid demo code. Use 000000.');
      } else {
        const conf = getPendingConfirmation();
        if (!conf) throw new Error('Session expired. Please go back and try again.');
        await conf.confirm(code);
      }
      const existing = await AsyncStorage.getItem('@pc/onboarding');
      await AsyncStorage.setItem('@pc/role', 'customer');
      if (existing) {
        router.replace('/(customer)/');
      } else {
        router.replace('/(onboarding)/name');
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={s.header}>
          <Text style={s.title}>Verify Phone</Text>
          <Text style={s.sub}>6-digit code sent to +91 {phone}</Text>
        </View>

        <View style={s.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={el => { refs.current[i] = el; }}
              style={[s.box, d && s.boxFilled]}
              value={d}
              onChangeText={val => handleDigit(val, i)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') handleBackspace(i);
              }}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity
          style={[s.btn, (!complete || loading) && s.btnOff]}
          onPress={handleVerify}
          activeOpacity={0.8}
          disabled={!complete || loading}
        >
          <Text style={s.btnText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.resend}>
          <Text style={s.resendText}>Didn't receive a code? Resend</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
