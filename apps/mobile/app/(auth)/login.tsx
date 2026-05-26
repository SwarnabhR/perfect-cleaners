import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAuth, signInWithPhoneNumber } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseApp } from '@pc/firebase';
import { colors, typography, spacing, radii, layout } from '@pc/tokens';
import PCMonogram from '../../components/PCMonogram';

const auth = getAuth(firebaseApp);

const DEMO_PROFILE = JSON.stringify({
  name: 'Aarav Mehta',
  car: { make: 'BMW', model: '3 Series', plate: 'DL 4C AB 1234', color: 'Mineral Grey' },
  address: { line1: 'B-204, Kavi Nagar', area: 'Indirapuram', city: 'Ghaziabad' },
});

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ready = phone.length === 10;

  async function handleSendOTP() {
    if (!ready || loading) return;
    setLoading(true);
    try {
      if (phone === '0000000000') {
        router.push({ pathname: '/(auth)/otp', params: { phone, verificationId: 'demo' } });
        return;
      }
      const fullPhone = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone);
      router.push({ pathname: '/(auth)/otp', params: { phone, verificationId: confirmation.verificationId } });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function devEnter(role: 'customer' | 'worker') {
    await AsyncStorage.setItem('@pc/onboarding', DEMO_PROFILE);
    router.replace(role === 'customer' ? '/(customer)/' : '/(worker)/');
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo lockup */}
        <View style={s.logoArea}>
          <View style={s.monogram}>
            <PCMonogram size={34} color={colors.warm} />
          </View>
          <Text style={s.brand}>PERFECT CLEANERS</Text>
          <Text style={s.tagline}>Premium Car Care · Delhi NCR</Text>
        </View>

        {/* Phone form */}
        <View style={s.form}>
          <Text style={s.fieldLabel}>PHONE NUMBER</Text>
          <View style={s.phoneRow}>
            <View style={s.prefix}>
              <Text style={s.prefixText}>+91</Text>
            </View>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              placeholder="98765 43210"
              placeholderTextColor={colors.fg4}
              keyboardType="number-pad"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleSendOTP}
            />
          </View>

          <TouchableOpacity
            style={[s.btn, (!ready || loading) && s.btnOff]}
            onPress={handleSendOTP}
            activeOpacity={0.8}
            disabled={!ready || loading}
          >
            <Text style={s.btnText}>{loading ? 'SENDING...' : 'SEND OTP'}</Text>
          </TouchableOpacity>

          <Text style={s.disclaimer}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        {/* DEV-only shortcut panel */}
        {__DEV__ && (
          <View style={s.devPanel}>
            <Text style={s.devLabel}>DEV SHORTCUTS</Text>
            <View style={s.devRow}>
              <TouchableOpacity style={s.devBtn} onPress={() => devEnter('customer')} activeOpacity={0.75}>
                <Text style={s.devBtnText}>→ Customer App</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.devBtn} onPress={() => devEnter('worker')} activeOpacity={0.75}>
                <Text style={s.devBtnText}>→ Worker App</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  scroll: { flexGrow: 1, paddingHorizontal: layout.screenPad, justifyContent: 'center', gap: 48 },

  logoArea: { alignItems: 'center', gap: spacing[2] },
  monogram: {
    width: 64, height: 64, borderRadius: radii.md,
    backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  brand: {
    fontFamily: typography.serif, fontSize: typography['2xl'],
    color: colors.fg, letterSpacing: 4, textTransform: 'uppercase',
  },
  tagline: {
    fontFamily: typography.sans, fontSize: typography.xs,
    color: colors.fg3, letterSpacing: 2, textTransform: 'uppercase',
  },

  form: { gap: spacing[3] },
  fieldLabel: {
    fontFamily: typography.sans, fontSize: 11,
    color: colors.fg3, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  phoneRow: { flexDirection: 'row', gap: 8 },
  prefix: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.sm, paddingHorizontal: spacing[4],
    alignItems: 'center', justifyContent: 'center',
  },
  prefixText: { fontFamily: typography.sans, fontSize: typography.base, color: colors.fg2 },
  input: {
    flex: 1, height: 48,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.sm, paddingHorizontal: spacing[4],
    fontFamily: typography.sans, fontSize: typography.base, color: colors.fg,
  },
  btn: {
    backgroundColor: colors.warm, borderRadius: radii.pill,
    paddingVertical: spacing[4], alignItems: 'center', marginTop: 4,
  },
  btnOff: { opacity: 0.35 },
  btnText: {
    fontFamily: typography.sansSemiBold, fontSize: typography.base,
    color: colors.ink, letterSpacing: 0.5,
  },
  disclaimer: {
    fontFamily: typography.sans, fontSize: 11,
    color: colors.fg4, textAlign: 'center', marginTop: 4,
  },

  devPanel: {
    borderWidth: 1, borderColor: 'rgba(255,100,0,0.3)',
    borderRadius: radii.md, padding: spacing[4], gap: spacing[2],
    backgroundColor: 'rgba(255,80,0,0.05)',
  },
  devLabel: {
    fontFamily: typography.mono, fontSize: 9, color: 'rgba(255,120,0,0.6)',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  devRow: { flexDirection: 'row', gap: 8 },
  devBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radii.sm, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,100,0,0.4)',
    backgroundColor: 'rgba(255,80,0,0.08)',
  },
  devBtnText: { fontFamily: typography.mono, fontSize: 11, color: 'rgba(255,140,0,0.85)', letterSpacing: 0.4 },
});
