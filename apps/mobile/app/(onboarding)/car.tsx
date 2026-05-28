import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { spacing, radii, typography } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import AuthScreenShell from '../../components/AuthScreenShell';
import BrandLogo from '../../components/BrandLogo';
import OnboardingProgress from '../../components/OnboardingProgress';

const CAR_COLORS = ['White', 'Black', 'Silver', 'Grey', 'Blue', 'Red', 'Other'] as const;

export default function OnboardingCar() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const [make,  setMake]  = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const router = useRouter();
  const c  = useThemeColors();
  const ss = useSharedStyles();

  const ready = make.trim().length > 0 && model.trim().length > 0;

  return (
    <AuthScreenShell>
      <OnboardingProgress current={2} total={3} />
      <BrandLogo size="sm" />

      <View style={s.heading}>
        <Text style={ss.onboardingStep}>[STEP 02 OF 03]</Text>
        <Text style={ss.onboardingTitle}>Tell us about{'\n'}your car.</Text>
        <Text style={ss.subtitle}>So we know what we’re working with.</Text>
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>MAKE</Text>
        <TextInput
          style={ss.formInput}
          value={make}
          onChangeText={setMake}
          placeholder="Hyundai"
          placeholderTextColor={c.fg4}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>MODEL</Text>
        <TextInput
          style={ss.formInput}
          value={model}
          onChangeText={setModel}
          placeholder="Creta"
          placeholderTextColor={c.fg4}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>NUMBER PLATE <Text style={[s.optional, { color: c.fg3 }]}>(optional)</Text></Text>
        <TextInput
          style={ss.formInput}
          value={plate}
          onChangeText={t => setPlate(t.toUpperCase())}
          placeholder="DL 4C AB 1234"
          placeholderTextColor={c.fg4}
          autoCapitalize="characters"
          returnKeyType="next"
        />
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>COLOUR <Text style={[s.optional, { color: c.fg3 }]}>(optional)</Text></Text>
        <View style={s.colorRow}>
          {CAR_COLORS.map(col => {
            const active = color === col;
            return (
              <TouchableOpacity
                key={col}
                style={[
                  s.colorChip,
                  { borderColor: active ? c.warm : c.line,
                    backgroundColor: active ? c.cardHi : 'transparent' },
                ]}
                onPress={() => setColor(col)}
                activeOpacity={0.7}
              >
                <Text style={[s.colorChipText, { color: active ? c.warm : c.fg2 }]}>{col}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        style={[ss.primaryBtn, !ready && ss.primaryBtnOff]}
        onPress={() =>
          ready &&
          router.push({
            pathname: '/(onboarding)/address',
            params: { name, make, model, plate, color },
          })
        }
        activeOpacity={0.8}
        disabled={!ready}
      >
        <Text style={ss.primaryBtnText}>CONTINUE →</Text>
      </TouchableOpacity>
    </AuthScreenShell>
  );
}

// ─── Module-level StyleSheet ─────────────────────────────────────────────────
const s = StyleSheet.create({
  heading:       { gap: spacing[2] },
  optional:      { fontFamily: typography.sans, fontSize: typography.xs, fontWeight: '400' },
  colorRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[1] },
  colorChip:     { borderWidth: 1, borderRadius: radii.pill, paddingVertical: 7, paddingHorizontal: 14 },
  colorChipText: { fontFamily: typography.sansMedium, fontSize: typography.sm },
});
