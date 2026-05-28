import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import PCMonogram from '../../components/PCMonogram';

export default function OnboardingName() {
  const [name, setName] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const ready = name.trim().length >= 2;

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    scroll: { flexGrow: 1, paddingHorizontal: spacing[6], paddingTop: spacing[5], gap: spacing[8] },
    progress: { flexDirection: 'row', gap: 6 },
    dot: { width: 20, height: 3, borderRadius: 999, backgroundColor: c.line },
    dotActive: { backgroundColor: c.warm },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    monogram: {
      width: 36, height: 36, borderRadius: radii.sm,
      backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center',
    },
    eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
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
      fontFamily: typography.sans, fontSize: typography.lg, color: c.fg,
    },
    btn: {
      backgroundColor: c.warm, borderRadius: radii.pill,
      paddingVertical: spacing[4], alignItems: 'center',
    },
    btnOff: { opacity: 0.3 },
    btnText: { fontFamily: typography.sansSemiBold, fontSize: typography.base, color: c.ink, letterSpacing: 0.6 },
  });

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.progress}>
          <View style={[s.dot, s.dotActive]} />
          <View style={s.dot} />
          <View style={s.dot} />
        </View>
        <View style={s.logoRow}>
          <View style={s.monogram}>
            <PCMonogram size={20} color={c.warm} />
          </View>
          <Text style={s.eyebrow}>PERFECT CLEANERS</Text>
        </View>
        <View style={s.headingArea}>
          <Text style={s.step}>[STEP 01 OF 03]</Text>
          <Text style={s.title}>What should{'\n'}we call you?</Text>
          <Text style={s.sub}>Your name appears on booking confirmations.</Text>
        </View>
        <View style={s.fieldArea}>
          <Text style={s.label}>FULL NAME</Text>
          <TextInput
            style={s.input}
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
          style={[s.btn, !ready && s.btnOff]}
          onPress={() => ready && router.push({ pathname: '/(onboarding)/car', params: { name } })}
          activeOpacity={0.8}
          disabled={!ready}
        >
          <Text style={s.btnText}>CONTINUE →</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
