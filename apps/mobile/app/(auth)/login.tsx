import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setPendingConfirmation } from '../../auth-state';
import { spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import AuthScreenShell from '../../components/AuthScreenShell';
import BrandLogo from '../../components/BrandLogo';

const DEMO_PROFILE = JSON.stringify({
  name: 'Aarav Mehta',
  car: { make: 'BMW', model: '3 Series', plate: 'DL 4C AB 1234', color: 'Mineral Grey' },
  address: { line1: 'B-204, Kavi Nagar', area: 'Indirapuram', city: 'Ghaziabad' },
});

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const c = useThemeColors();
  const ss = useSharedStyles();
  const ready = phone.length === 10;

  const s = StyleSheet.create({
    logoArea: { alignItems: 'center', gap: spacing[2] },
    form: { gap: spacing[3] },
    phoneRow: { flexDirection: 'row', gap: 8 },
    prefix: {
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.sm, paddingHorizontal: spacing[4],
      alignItems: 'center', justifyContent: 'center',
    },
    prefixText: { fontFamily: 'Inter Tight', fontSize: 16, color: c.fg2 },
    input: [
      ss.formInput,
      { flex: 1, height: 48 } as any,
    ],
    disclaimer: {
      fontFamily: 'Inter Tight', fontSize: 11,
      color: c.fg4, textAlign: 'center', marginTop: 4,
    },
    devPanel: {
      borderWidth: 1, borderColor: 'rgba(255,100,0,0.3)',
      borderRadius: radii.md, padding: spacing[4], gap: spacing[2],
      backgroundColor: 'rgba(255,80,0,0.05)',
    },
    devLabel: {
      fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,120,0,0.6)',
      letterSpacing: 1.2, textTransform: 'uppercase',
    },
    devRow: { flexDirection: 'row', gap: 8 },
    devBtn: {
      flex: 1, paddingVertical: 10, borderRadius: radii.sm, alignItems: 'center',
      borderWidth: 1, borderColor: 'rgba(255,100,0,0.4)',
      backgroundColor: 'rgba(255,80,0,0.08)',
    },
    devBtnText: { fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(255,140,0,0.85)', letterSpacing: 0.4 },
  });

  async function handleSendOTP() {
    if (!ready || loading) return;
    setLoading(true);
    try {
      if (phone === '0000000000') {
        setPendingConfirmation(null);
        router.push({ pathname: '/(auth)/otp', params: { phone, verificationId: 'demo' } });
        return;
      }
      const confirmation = await auth().signInWithPhoneNumber(`+91${phone}`);
      setPendingConfirmation(confirmation);
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
    <AuthScreenShell contentStyle={{ justifyContent: 'center', gap: 48 }}>
      <View style={s.logoArea}>
        <BrandLogo size="lg" tagline="Premium Car Care · Delhi NCR" />
      </View>

      <View style={s.form}>
        <Text style={ss.fieldLabel}>PHONE NUMBER</Text>
        <View style={s.phoneRow}>
          <View style={s.prefix}>
            <Text style={s.prefixText}>+91</Text>
          </View>
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 10))}
            placeholder="98765 43210"
            placeholderTextColor={c.fg4}
            keyboardType="number-pad"
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={handleSendOTP}
          />
        </View>

        <TouchableOpacity
          style={[ss.primaryBtn, (!ready || loading) && ss.primaryBtnOff]}
          onPress={handleSendOTP}
          activeOpacity={0.8}
          disabled={!ready || loading}
        >
          <Text style={ss.primaryBtnText}>{loading ? 'SENDING...' : 'SEND OTP'}</Text>
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>

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
    </AuthScreenShell>
  );
}
