import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import AuthScreenShell from '../../components/AuthScreenShell';
import BackButton from '../../components/BackButton';
import OnboardingProgress from '../../components/OnboardingProgress';

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
  const router = useRouter();
  const c = useThemeColors();
  const ss = useSharedStyles();
  const ready = line1.trim().length > 0 && area.length > 0;

  const s = StyleSheet.create({
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    areaChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingVertical: 8, paddingHorizontal: 12, borderRadius: radii.pill,
      borderWidth: 1, borderColor: c.line,
    },
    areaChipActive: { backgroundColor: c.warm, borderColor: 'transparent' },
    areaChipText: { fontFamily: 'Inter Tight', fontSize: 12, color: c.fg2 },
    areaChipTextActive: { fontFamily: 'Inter Tight Medium', color: c.ink },
    lockedInput: {
      height: 52, backgroundColor: c.inkRaised, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.sm, paddingHorizontal: spacing[4], justifyContent: 'center',
    },
    lockedText: { fontFamily: 'Inter Tight', fontSize: 16, color: c.fg3 },
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
      Alert.alert('Could not save profile', err?.message ?? 'Please check your connection and try again.');
    }
  }

  return (
    <AuthScreenShell>
      <View style={s.topRow}>
        <BackButton />
        <OnboardingProgress current={3} total={3} />
      </View>

      <View style={{ gap: spacing[2] }}>
        <Text style={ss.onboardingStep}>[STEP 03 OF 03]</Text>
        <Text style={ss.onboardingTitle}>Where do we{'\n'}come to you?</Text>
        <Text style={ss.subtitle}>Saved as your default pickup address. Change anytime.</Text>
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>FLAT / HOUSE / BUILDING</Text>
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
        <Text style={ss.fieldLabel}>AREA · GHAZIABAD NCR</Text>
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

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>CITY</Text>
        <View style={s.lockedInput}>
          <Text style={s.lockedText}>{city}, Uttar Pradesh</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[ss.primaryBtn, (!ready || saving) && ss.primaryBtnOff]}
        onPress={finish}
        activeOpacity={0.8}
        disabled={!ready || saving}
      >
        <Text style={ss.primaryBtnText}>{saving ? 'SAVING...' : 'ALL DONE →'}</Text>
      </TouchableOpacity>
    </AuthScreenShell>
  );
}
