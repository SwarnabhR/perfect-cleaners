import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Check } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';

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
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const ready = make.trim().length > 0 && model.trim().length > 0;

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
    title: { fontFamily: typography.serif, fontSize: typography['3xl'], color: c.fg, letterSpacing: -0.5, lineHeight: 44 },
    sub: { fontFamily: typography.sans, fontSize: typography.sm, color: c.fg2 },
    fieldArea: { gap: spacing[2] },
    label: { fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
    input: {
      height: 52,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.lineStrong,
      borderRadius: radii.sm, paddingHorizontal: spacing[4],
      fontFamily: typography.sans, fontSize: typography.base, color: c.fg,
    },
    chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1, borderColor: c.line },
    chipActive: { backgroundColor: c.warm, borderColor: 'transparent' },
    chipText: { fontFamily: typography.sans, fontSize: 12, color: c.fg2 },
    chipTextActive: { color: c.ink, fontFamily: typography.sansMedium },
    colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    colorSwatch: {
      width: 36, height: 36, borderRadius: 999,
      borderWidth: 2, borderColor: 'transparent',
      alignItems: 'center', justifyContent: 'center',
    },
    colorSwatchActive: { borderColor: c.lineStrong },
    colorLabel: { fontFamily: typography.mono, fontSize: 10, color: c.fg2, letterSpacing: 0.6 },
    btn: { backgroundColor: c.warm, borderRadius: radii.pill, paddingVertical: spacing[4], alignItems: 'center', marginTop: spacing[2] },
    btnOff: { opacity: 0.3 },
    btnText: { fontFamily: typography.sansSemiBold, fontSize: typography.base, color: c.ink, letterSpacing: 0.6 },
  });

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.topRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={16} color={c.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={s.progress}>
            <View style={s.dot} />
            <View style={[s.dot, s.dotActive]} />
            <View style={s.dot} />
          </View>
        </View>
        <View style={s.headingArea}>
          <Text style={s.step}>[STEP 02 OF 03]</Text>
          <Text style={s.title}>Tell us about{'\n'}your car.</Text>
          <Text style={s.sub}>We tailor the service to your vehicle.</Text>
        </View>
        <View style={s.fieldArea}>
          <Text style={s.label}>MAKE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {MAKES.map(m => (
              <TouchableOpacity key={m} style={[s.chip, make === m && s.chipActive]} onPress={() => setMake(m)}>
                <Text style={[s.chipText, make === m && s.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={s.fieldArea}>
          <Text style={s.label}>MODEL</Text>
          <TextInput style={s.input} value={model} onChangeText={setModel}
            placeholder="City, Creta, Nexon..." placeholderTextColor={c.fg4}
            autoCapitalize="words" returnKeyType="next" />
        </View>
        <View style={s.fieldArea}>
          <Text style={s.label}>REGISTRATION (OPTIONAL)</Text>
          <TextInput style={s.input} value={plate} onChangeText={t => setPlate(t.toUpperCase())}
            placeholder="DL 4C AB 1234" placeholderTextColor={c.fg4}
            autoCapitalize="characters" returnKeyType="done" />
        </View>
        <View style={s.fieldArea}>
          <Text style={s.label}>COLOUR</Text>
          <View style={s.colorRow}>
            {COLORS.map(col => (
              <TouchableOpacity
                key={col.label}
                style={[s.colorSwatch, { backgroundColor: col.hex }, carColor === col.label && s.colorSwatchActive]}
                onPress={() => setCarColor(col.label)} activeOpacity={0.8}
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
          style={[s.btn, !ready && s.btnOff]}
          onPress={() => ready && router.push({ pathname: '/(onboarding)/address', params: { name, make, model, plate, carColor } })}
          activeOpacity={0.8} disabled={!ready}
        >
          <Text style={s.btnText}>CONTINUE →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
