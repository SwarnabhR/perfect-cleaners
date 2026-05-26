import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';
import HapticButton from '../../components/HapticButton';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function OTPCompleteModal() {
  const [digits, setDigits] = useState(['', '', '', '']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const filled = digits.findIndex(d => !d);

  function press(key: string) {
    setDigits(d => {
      const nd = [...d];
      if (key === '⌫') {
        const last = nd.map((x, i) => x ? i : -1).filter(i => i >= 0).pop();
        if (last !== undefined) nd[last] = '';
      } else {
        const next = nd.findIndex(x => !x);
        if (next >= 0) nd[next] = String(key);
      }
      return nd;
    });
  }

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <View style={s.sheet}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <Text style={s.eyebrow}>[VERIFY] · CUSTOMER OTP</Text>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <X size={12} color={colors.fg2} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <Text style={s.title}>Ask Aarav for the 4-digit code to close out this job.</Text>
        <Text style={s.sub}>Sent to +91 98765 43210 · 11:42 AM</Text>

        {/* OTP boxes */}
        <View style={s.otpRow}>
          {digits.map((d, i) => (
            <View
              key={i}
              style={[
                s.otpBox,
                d ? s.otpBoxFilled : null,
                i === filled && !d ? s.otpBoxActive : null,
              ]}
            >
              <Text style={s.otpDigit}>{d}</Text>
              {!d && i === filled && <View style={s.cursor} />}
            </View>
          ))}
        </View>

        {/* Keypad */}
        <View style={s.keypad}>
          {KEYS.map((k, i) =>
            k === '' ? <View key={i} /> : (
              <TouchableOpacity
                key={i}
                style={s.key}
                onPress={() => press(k)}
              >
                <Text style={[s.keyText, k === '⌫' && s.keyTextBack]}>{k}</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <HapticButton haptic="success" style={s.primaryBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Mark Complete →</Text>
        </HapticButton>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(7,6,10,0.92)',
  },
  sheet: {
    backgroundColor: colors.inkRaised,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: colors.lineStrong,
    paddingHorizontal: spacing[5], paddingTop: spacing[2], paddingBottom: spacing[6],
  },
  handle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: colors.lineStrong, alignSelf: 'center', marginBottom: 18,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontFamily: typography.sansMedium, fontSize: typography.lg, color: colors.fg,
    lineHeight: 26, marginTop: spacing[2],
  },
  sub: {
    fontFamily: typography.sans, fontSize: 12, color: colors.fg2, marginTop: spacing[1],
  },

  otpRow: {
    flexDirection: 'row', gap: spacing[2], justifyContent: 'space-between',
    marginTop: spacing[5],
  },
  otpBox: {
    flex: 1, height: 60, borderRadius: radii.md,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  otpBoxFilled: { backgroundColor: colors.cardHi, borderColor: colors.lineStrong },
  otpBoxActive: { borderColor: colors.lineStrong },
  otpDigit: { fontFamily: typography.serif, fontSize: 30, color: colors.fg },
  cursor: {
    position: 'absolute', width: 2, height: 24, backgroundColor: colors.warm,
  },

  keypad: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    marginTop: spacing[4], justifyContent: 'center',
  },
  key: {
    width: '30%', height: 46, borderRadius: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  keyText: { fontFamily: typography.mono, fontSize: typography.xl, color: colors.fg },
  keyTextBack: { fontFamily: typography.sans, fontSize: 14, color: colors.fg },

  primaryBtn: {
    backgroundColor: colors.warm, borderRadius: radii.pill,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing[4],
  },
  primaryBtnText: {
    fontFamily: typography.sansSemiBold, fontSize: 13, color: colors.ink, letterSpacing: 0.6,
  },
});
