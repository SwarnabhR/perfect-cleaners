import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import HapticButton from '../../components/HapticButton';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function OTPCompleteModal() {
  const [digits,    setDigits]    = useState(['', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c  = useThemeColors();
  const ss = useSharedStyles();
  const { bookingId = 'PC-2058' } = useLocalSearchParams<{ bookingId?: string }>();

  const filled = digits.findIndex(d => !d);
  const complete = digits.every(d => d !== '');

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

  async function handleComplete() {
    if (!complete || verifying) return;
    const entered = digits.join('');
    setVerifying(true);
    try {
      const snap = await firestore().collection('bookings').doc(bookingId).get();
      if (!Boolean(snap.exists)) throw new Error('Booking not found');

      const data = snap.data();
      const stored = data?.otpCode;

      if (!stored) {
        // No OTP set — allow completion (demo / legacy bookings)
      } else if (stored !== entered) {
        Alert.alert('Incorrect code', 'The code you entered does not match. Please ask the customer for the correct 4-digit code.');
        setVerifying(false);
        return;
      }

      await firestore().collection('bookings').doc(bookingId).update({
        status:    'done',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not complete the job. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  const s = StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end', backgroundColor: c.inkScrim },
    sheet: {
      backgroundColor: c.inkRaised,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderTopWidth: 1, borderTopColor: c.lineStrong,
      paddingHorizontal: spacing[5], paddingTop: spacing[2], paddingBottom: spacing[6],
    },
    handle:   { width: 40, height: 4, borderRadius: 999, backgroundColor: c.lineStrong, alignSelf: 'center', marginBottom: 18 },
    header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    closeBtn: { width: 30, height: 30, borderRadius: 999, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
    title:    { fontFamily: typography.sansMedium, fontSize: typography.lg, color: c.fg, lineHeight: 26, marginTop: spacing[2] },
    sub:      { fontFamily: typography.sans, fontSize: 12, color: c.fg2, marginTop: spacing[1] },
    otpRow:   { flexDirection: 'row', gap: spacing[2], justifyContent: 'space-between', marginTop: spacing[5] },
    otpBox:   { flex: 1, height: 60, borderRadius: radii.md, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
    otpBoxFilled: { backgroundColor: c.cardHi, borderColor: c.lineStrong },
    otpBoxActive: { borderColor: c.lineStrong },
    otpDigit: { fontFamily: typography.serif, fontSize: 30, color: c.fg },
    cursor:   { position: 'absolute', width: 2, height: 24, backgroundColor: c.warm },
    keypad:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing[4], justifyContent: 'center' },
    key:      { width: '30%', height: 46, borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
    keyText:  { fontFamily: typography.mono, fontSize: typography.xl, color: c.fg },
    keyTextBack: { fontFamily: typography.sans, fontSize: 14, color: c.fg },
  });

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <View style={s.sheet}>
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={ss.eyebrow}>[VERIFY] · CUSTOMER OTP</Text>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <X size={12} color={c.fg2} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <Text style={s.title}>Ask the customer for the 4-digit code to close out this job.</Text>
        <Text style={s.sub}>Booking #{bookingId.slice(0, 8).toUpperCase()}</Text>

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
            k === '' ? <View key={i} style={{ width: '30%' }} /> : (
              <TouchableOpacity key={i} style={s.key} onPress={() => press(k)}>
                <Text style={[s.keyText, k === '⌫' && s.keyTextBack]}>{k}</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <HapticButton
          haptic="success"
          style={[ss.primaryBtn, { marginTop: spacing[4] }, (!complete || verifying) && ss.primaryBtnOff]}
          onPress={handleComplete}
          activeOpacity={0.85}
          disabled={!complete || verifying}
        >
          <Text style={ss.primaryBtnText}>{verifying ? 'Verifying…' : 'Mark Complete →'}</Text>
        </HapticButton>
      </View>
    </View>
  );
}
