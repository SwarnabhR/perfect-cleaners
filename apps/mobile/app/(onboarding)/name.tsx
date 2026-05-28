import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import AuthScreenShell from '../../components/AuthScreenShell';
import BrandLogo from '../../components/BrandLogo';
import OnboardingProgress from '../../components/OnboardingProgress';

export default function OnboardingName() {
  const [name, setName] = useState('');
  const router = useRouter();
  const c = useThemeColors();
  const ss = useSharedStyles();
  const ready = name.trim().length >= 2;

  return (
    <AuthScreenShell>
      <OnboardingProgress current={1} total={3} />

      <BrandLogo size="sm" />

      <View style={{ gap: spacing[2] }}>
        <Text style={ss.onboardingStep}>[STEP 01 OF 03]</Text>
        <Text style={ss.onboardingTitle}>What should{'\n'}we call you?</Text>
        <Text style={ss.subtitle}>Your name appears on booking confirmations.</Text>
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>FULL NAME</Text>
        <TextInput
          style={ss.formInput}
          value={name}
          onChangeText={setName}
          placeholder="Aarav Mehta"
          placeholderTextColor={c.fg4}
          autoFocus
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => ready && router.push({ pathname: '/(onboarding)/car', params: { name } })}
        />
      </View>

      <TouchableOpacity
        style={[ss.primaryBtn, !ready && ss.primaryBtnOff]}
        onPress={() => ready && router.push({ pathname: '/(onboarding)/car', params: { name } })}
        activeOpacity={0.8}
        disabled={!ready}
      >
        <Text style={ss.primaryBtnText}>CONTINUE →</Text>
      </TouchableOpacity>
    </AuthScreenShell>
  );
}
