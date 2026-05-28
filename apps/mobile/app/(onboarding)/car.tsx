import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import AuthScreenShell from '../../components/AuthScreenShell';
import BackButton from '../../components/BackButton';
import OnboardingProgress from '../../components/OnboardingProgress';

const MAKES = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Toyota', 'BMW', 'Mercedes', 'Audi', 'Mahindra', 'Kia'];
const COLORS = [
  { label: 'White', hex: '#F4F4F2' },
  { label: 'Silver', hex: '#B8B8B8' },
  { label: 'Grey', hex: '#7A7A7A' },
  { label: 'Black', hex: '#1A1A1A' },
  { label: 'Blue', hex: '#2560B0' },
  { label: 'Red', hex: '#C0392B' },
  { label: 'Brown', hex: '#7D4E2A' },
  { label: 'Other', hex: '#888888' },
];

export default function OnboardingCar() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [carColor, setCarColor] = useState('');
  const router = useRouter();
  const c = useThemeColors();
  const ss = useSharedStyles();
  const ready = make.trim().length > 0 && model.trim().length > 0;

  const s = StyleSheet.create({
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1, borderColor: c.line },
    chipActive: { backgroundColor: c.warm, borderColor: 'transparent' },
    chipText: { fontFamily: 'Inter Tight', fontSize: 12, color: c.fg2 },
    chipTextActive: { color: c.ink, fontFamily: 'Inter Tight Medium' },
    colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    colorSwatch: {
      width: 36, height: 36, borderRadius: 999,
      borderWidth: 2, borderColor: 'transparent',
      alignItems: 'center', justifyContent: 'center',
    },
    colorSwatchActive: { borderColor: c.lineStrong },
    colorLabel: { fontFamily: 'JetBrains Mono', fontSize: 10, color: c.fg2, letterSpacing: 0.6 },
  });

  return (
    <AuthScreenShell>
      <View style={s.topRow}>
        <BackButton />
        <OnboardingProgress current={2} total={3} />
      </View>

      <View style={{ gap: spacing[2] }}>
        <Text style={ss.onboardingStep}>[STEP 02 OF 03]</Text>
        <Text style={ss.onboardingTitle}>Tell us about{'\n'}your car.</Text>
        <Text style={ss.subtitle}>We tailor the service to your vehicle.</Text>
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>MAKE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {MAKES.map(m => (
            <TouchableOpacity key={m} style={[s.chip, make === m && s.chipActive]} onPress={() => setMake(m)}>
              <Text style={[s.chipText, make === m && s.chipTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>MODEL</Text>
        <TextInput
          style={ss.formInput}
          value={model}
          onChangeText={setModel}
          placeholder="City, Creta, Nexon..."
          placeholderTextColor={c.fg4}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>REGISTRATION (OPTIONAL)</Text>
        <TextInput
          style={ss.formInput}
          value={plate}
          onChangeText={t => setPlate(t.toUpperCase())}
          placeholder="DL 4C AB 1234"
          placeholderTextColor={c.fg4}
          autoCapitalize="characters"
          returnKeyType="done"
        />
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>COLOUR</Text>
        <View style={s.colorRow}>
          {COLORS.map(col => (
            <TouchableOpacity
              key={col.label}
              style={[s.colorSwatch, { backgroundColor: col.hex }, carColor === col.label && s.colorSwatchActive]}
              onPress={() => setCarColor(col.label)}
              activeOpacity={0.8}
            >
              {carColor === col.label && (
                <Check size={12} color={col.label === 'White' || col.label === 'Silver' ? '#000' : '#fff'} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        {carColor ? <Text style={s.colorLabel}>{carColor}</Text> : null}
      </View>

      <TouchableOpacity
        style={[ss.primaryBtn, !ready && ss.primaryBtnOff]}
        onPress={() => ready && router.push({ pathname: '/(onboarding)/address', params: { name, make, model, plate, carColor } })}
        activeOpacity={0.8}
        disabled={!ready}
      >
        <Text style={ss.primaryBtnText}>CONTINUE →</Text>
      </TouchableOpacity>
    </AuthScreenShell>
  );
}
