import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';

const AREAS = ['Indirapuram', 'Vaishali', 'Kaushambi', 'Raj Nagar Ext.', 'Crossings Republik', 'Vasundhara'];

const KEY_ONBOARDING = '@pc/onboarding';
const KEY_ROLE       = '@pc/role';

export default function OnboardingAddress() {
  const params = useLocalSearchParams<{
    name: string; make: string; model: string; plate: string; carColor: string;
  }>();
  const [line1, setLine1] = useState('');
  const [area, setArea]   = useState('');
  const [city]            = useState('Ghaziabad');
  const [saving, setSaving] = useState(false);
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const c       = useThemeColors();
  const ready   = line1.trim().length > 0 && area.length > 0;

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    scroll: { flexGrow: 1, paddingHorizontal: spacing[6], paddingTop: spacing[5], gap: spacing[5] },

    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width: 36, height: 36, borderRadius: 999,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      alignItems: 'center', justifyContent: 'center',
    },
    progress: { flexDirection: 'row', gap: 6 },
    dot: { width: 20, height: 3, borderRadius: 999, backgroundColor: c.line },
    dotActive: { backgroundColor: c.warm },

    headingArea: { gap: spacing[2] },
    step: { fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
    title: {
      fontFamily: typography.serif, fontSize: typography['3xl'],
      color: c.fg, letterSpacing: -0.5, lineHeight: 44,
    },
    sub: { fontFamily: typography.sans, fontSize: typography.sm, color: c.fg2 },

    fieldArea: { gap: spacing[2] },
    label: { fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
    input: {
      height: 52,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.lineStrong,
      borderRadius: radii.sm, paddingHorizontal: spacing[4],
      fontFamily: typography.sans, fontSize: typography.base, color: c.fg,
    },

    areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    areaChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingVertical: 8, paddingHorizontal: 12, borderRadius: radii.pill,
      borderWidth: 1, borderColor: c.line,
    },
    areaChipActive: { backgroundColor: c.warm, borderColor: 'transparent' },
    areaChipText: { fontFamily: typography.sans, fontSize: 12, color: c.fg2 },
    areaChipTextActive: { fontFamily: typography.sansMedium, color: c.ink },

    lockedInput: {
      height: 52,
      backgroundColor: c.inkRaised, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.sm, paddingHorizontal: spacing[4],
      justifyContent: 'center',
    },
    lockedText: { fontFamily: typography.sans, fontSize: typography.base, color: c.fg3 },

    btn: {
      backgroundColor: c.warm, borderRadius: radii.pill,
      paddingVertical: spacing[4], alignItems: 'center', marginTop: spacing[2],
    },
    btnOff: { opacity: 0.3 },
    btnText: { fontFamily: typography.sansSemiBold, fontSize: typography.base, color: c.ink, letterSpacing: 0.6 },
  });

  async function finish() {
    if (!ready || saving) return;
    setSaving(true);
    try {
      const user = auth().currentUser;

      const onboardingData = {
        name: params.name,
        car: { make: params.make, model: params.model, plate: params.plate, color: params.carColor },
        address: { line1, area, city },
      };

      if (user && user.uid !== 'demo-user') {
        await firestore()
          .collection('customers')
          .doc(user.uid)
          .set({
            id: user.uid,
            name: params.name,
            phone: user.phoneNumber ?? '',
            vehicles: [{
              id: `${user.uid}-v1`,
              make: params.make,
              model: params.model,
              registration: params.plate,
              color: params.carColor,
              year: new Date().getFullYear(),
              type: 'sedan',
            }],
            defaultAddress: { line1, area, city },
            onboardingComplete: true,
            role: 'customer',
            walletBalance: 0,
            createdAt: firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
      }

      await Promise.all([
        AsyncStorage.setItem(KEY_ONBOARDING, 'done'),
        AsyncStorage.setItem(KEY_ROLE, 'customer'),
        AsyncStorage.setItem('@pc/onboarding', JSON.stringify(onboardingData)),
      ]);

      router.replace('/(customer)/(tabs)');
    } catch (err: any) {
      setSaving(false);
      Alert.alert(
        'Could not save profile',
        err?.message ?? 'Please check your connection and try again.',
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Back + progress */}
        <View style={s.topRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={16} color={c.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={s.progress}>
            <View style={s.dot} />
            <View style={s.dot} />
            <View style={[s.dot, s.dotActive]} />
          </View>
        </View>

        {/* Heading */}
        <View style={s.headingArea}>
          <Text style={s.step}>[STEP 03 OF 03]</Text>
          <Text style={s.title}>Where do we{'\n'}come to you?</Text>
          <Text style={s.sub}>Saved as your default pickup address. Change anytime.</Text>
        </View>

        {/* Address line 1 */}
        <View style={s.fieldArea}>
          <Text style={s.label}>FLAT / HOUSE / BUILDING</Text>
          <TextInput
            style={s.input}
            value={line1}
            onChangeText={setLine1}
            placeholder="B-204, Kavi Nagar"
            placeholderTextColor={c.fg4}
            autoFocus
            returnKeyType="next"
          />
        </View>

        {/* Area picker */}
        <View style={s.fieldArea}>
          <Text style={s.label}>AREA · GHAZIABAD NCR</Text>
          <View style={s.areaGrid}>
            {AREAS.map(a => (
              <TouchableOpacity
                key={a}
                style={[s.areaChip, area === a && s.areaChipActive]}
                onPress={() => setArea(a)}
              >
                <MapPin size={10} color={area === a ? c.ink : c.fg3} strokeWidth={1.5} />
                <Text style={[s.areaChipText, area === a && s.areaChipTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* City (locked) */}
        <View style={s.fieldArea}>
          <Text style={s.label}>CITY</Text>
          <View style={s.lockedInput}>
            <Text style={s.lockedText}>{city}, Uttar Pradesh</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[s.btn, (!ready || saving) && s.btnOff]}
          onPress={finish}
          activeOpacity={0.8}
          disabled={!ready || saving}
        >
          <Text style={s.btnText}>{saving ? 'SAVING...' : 'ALL DONE →'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
