import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { spacing, typography } from '@pc/tokens';
import type { Vehicle } from '@pc/firebase';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import AuthScreenShell from '../../components/AuthScreenShell';
import BrandLogo from '../../components/BrandLogo';
import OnboardingProgress from '../../components/OnboardingProgress';

export default function OnboardingAddress() {
  const params = useLocalSearchParams<{
    name?: string; make?: string; model?: string; plate?: string; color?: string;
  }>();
  const [line1,  setLine1]  = useState('');
  const [area,   setArea]   = useState('');
  const [city,   setCity]   = useState('Ghaziabad');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const c  = useThemeColors();
  const ss = useSharedStyles();

  const ready = line1.trim().length > 0 && area.trim().length > 0;

  async function handleFinish() {
    if (!ready || saving) return;
    setSaving(true);
    try {
      const user = auth().currentUser;

      const profileData = {
        name:  params.name ?? '',
        phone: user?.phoneNumber ?? '',
        car: {
          make:  params.make  ?? '',
          model: params.model ?? '',
          plate: params.plate ?? '',
          color: params.color ?? '',
        },
        address: { line1, area, city },
      };

      // Local cache — used by booking screen, profile tab, etc.
      await AsyncStorage.setItem('@pc/profile', JSON.stringify(profileData));
      // Auth-gate cache — index.tsx checks this === 'done'
      await AsyncStorage.setItem('@pc/onboarding', 'done');
      await AsyncStorage.setItem('@pc/role', 'customer');

      // Write Customer document to Firestore (authoritative onboarding gate)
      if (user) {
        const vehicle: Vehicle | undefined = params.make ? {
          id:           'v1',
          make:         params.make,
          model:        params.model ?? '',
          year:         new Date().getFullYear(),
          type:         'sedan',
          registration: params.plate ?? '',
          color:        params.color ?? '',
        } : undefined;

        await firestore()
          .collection('customers')
          .doc(user.uid)
          .set({
            id:                user.uid,
            name:              params.name ?? '',
            phone:             user.phoneNumber ?? '',
            vehicles:          vehicle ? [vehicle] : [],
            defaultAddress:    { line1, area, city },
            onboardingComplete: true,
            role:              'customer',
            walletBalance:     0,
            createdAt:         firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
      }

      router.replace('/(customer)/(tabs)');
    } catch (err: any) {
      Alert.alert('Setup failed', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthScreenShell>
      <OnboardingProgress current={3} total={3} />
      <BrandLogo size="sm" />

      <View style={s.heading}>
        <Text style={ss.onboardingStep}>[STEP 03 OF 03]</Text>
        <Text style={ss.onboardingTitle}>Where should{'\n'}we come?</Text>
        <Text style={ss.subtitle}>Your default service address. You can change it per booking.</Text>
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>FLAT / HOUSE NO. & STREET</Text>
        <TextInput
          style={ss.formInput}
          value={line1}
          onChangeText={setLine1}
          placeholder="B-204, Kavi Nagar"
          placeholderTextColor={c.fg4}
          autoFocus
          returnKeyType="next"
        />
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>AREA / LOCALITY</Text>
        <TextInput
          style={ss.formInput}
          value={area}
          onChangeText={setArea}
          placeholder="Sector 14, Ghaziabad"
          placeholderTextColor={c.fg4}
          returnKeyType="next"
        />
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>CITY</Text>
        <TextInput
          style={[ss.formInput, { color: c.fg3 }]}
          value={city}
          onChangeText={setCity}
          placeholder="Ghaziabad"
          placeholderTextColor={c.fg4}
          returnKeyType="done"
          onSubmitEditing={handleFinish}
        />
        <Text style={[s.cityHint, { color: c.fg3 }]}>Currently serving Ghaziabad NCR only.</Text>
      </View>

      <TouchableOpacity
        style={[ss.primaryBtn, (!ready || saving) && ss.primaryBtnOff]}
        onPress={handleFinish}
        activeOpacity={0.8}
        disabled={!ready || saving}
      >
        <Text style={ss.primaryBtnText}>{saving ? 'SAVING…' : 'FINISH SETUP →'}</Text>
      </TouchableOpacity>
    </AuthScreenShell>
  );
}

// ─── Module-level StyleSheet ─────────────────────────────────────────────────
const s = StyleSheet.create({
  heading:  { gap: spacing[2] },
  cityHint: { fontFamily: typography.sans, fontSize: typography.xs, marginTop: spacing[1] },
});
