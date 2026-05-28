import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPendingConfirmation } from '../../auth-state';
import { spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import AuthScreenShell from '../../components/AuthScreenShell';
import BackButton from '../../components/BackButton';

const OTP_LEN = 6;

export default function OTPScreen() {
  const { phone, verificationId } = useLocalSearchParams<{ phone: string; verificationId: string }>();
  const [digits,  setDigits]  = useState<string[]>(Array(OTP_LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const refs    = useRef<(TextInput | null)[]>(Array(OTP_LEN).fill(null));
  const router  = useRouter();
  const c       = useThemeColors();
  const ss      = useSharedStyles();
  const complete = digits.every(Boolean);

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
      router.replace(existing ? '/(customer)/' : '/(onboarding)/name');
    } catch (err: any) {
      Alert.alert('Verification Failed', err?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenShell>
      <BackButton />

      <View style={s.header}>
        <Text style={ss.onboardingTitle}>Verify Phone</Text>
        <Text style={ss.subtitle}>6-digit code sent to +91 {phone}</Text>
      </View>

      <View style={s.otpRow}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={el => { refs.current[i] = el; }}
            style={[
              s.box,
              { backgroundColor: c.card, borderColor: d ? c.sageHi : c.line, color: c.fg },
            ]}
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
        style={[ss.primaryBtn, (!complete || loading) && ss.primaryBtnOff]}
        onPress={handleVerify}
        activeOpacity={0.8}
        disabled={!complete || loading}
      >
        <Text style={ss.primaryBtnText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.resend}>
        <Text style={ss.subtitle}>Didn’t receive a code? Resend</Text>
      </TouchableOpacity>
    </AuthScreenShell>
  );
}

// ─── Module-level StyleSheet ─────────────────────────────────────────────────
const s = StyleSheet.create({
  header: { gap: 8 },
  otpRow: { flexDirection: 'row', gap: spacing[2] },
  box:    { flex: 1, height: 56, borderWidth: 1, borderRadius: radii.sm, fontFamily: 'JetBrains Mono', fontSize: 20 },
  resend: { alignItems: 'center' },
});
