import { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import AuthScreenShell from '../../components/AuthScreenShell';
import BrandLogo from '../../components/BrandLogo';
import OnboardingProgress from '../../components/OnboardingProgress';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OnboardingName() {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const lastRef  = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const router = useRouter();
  const c  = useThemeColors();
  const ss = useSharedStyles();

  const ready =
    firstName.trim().length >= 1 &&
    lastName.trim().length  >= 1 &&
    EMAIL_RE.test(email.trim());

  function handleContinue() {
    if (!ready) return;
    router.push({
      pathname: '/(onboarding)/car',
      params: {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim().toLowerCase(),
      },
    });
  }

  return (
    <AuthScreenShell>
      <OnboardingProgress current={1} total={3} />

      <BrandLogo size="sm" />

      <View style={{ gap: spacing[2] }}>
        <Text style={ss.onboardingStep}>[STEP 01 OF 03]</Text>
        <Text style={ss.onboardingTitle}>Let's set up{'\n'}your account.</Text>
        <Text style={ss.subtitle}>Your name and email are linked to your society account and cleaning notifications.</Text>
      </View>

      {/* First + last name row */}
      <View style={{ flexDirection: 'row', gap: spacing[3] }}>
        <View style={[ss.fieldArea, { flex: 1 }]}>
          <Text style={ss.fieldLabel}>FIRST NAME</Text>
          <TextInput
            style={ss.formInput}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Aarav"
            placeholderTextColor={c.fg4}
            autoFocus
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => lastRef.current?.focus()}
          />
        </View>
        <View style={[ss.fieldArea, { flex: 1 }]}>
          <Text style={ss.fieldLabel}>LAST NAME</Text>
          <TextInput
            ref={lastRef}
            style={ss.formInput}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Mehta"
            placeholderTextColor={c.fg4}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        </View>
      </View>

      <View style={ss.fieldArea}>
        <Text style={ss.fieldLabel}>EMAIL ADDRESS</Text>
        <TextInput
          ref={emailRef}
          style={ss.formInput}
          value={email}
          onChangeText={setEmail}
          placeholder="aarav@example.com"
          placeholderTextColor={c.fg4}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />
      </View>

      <TouchableOpacity
        style={[ss.primaryBtn, !ready && ss.primaryBtnOff]}
        onPress={handleContinue}
        activeOpacity={0.8}
        disabled={!ready}
      >
        <Text style={ss.primaryBtnText}>CONTINUE →</Text>
      </TouchableOpacity>
    </AuthScreenShell>
  );
}
