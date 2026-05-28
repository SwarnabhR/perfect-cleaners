import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Phone, Camera, Check } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

const CHECKLIST = [
  ['Hand wash & rinse', true],
  ['Wax & shine', true],
  ['Tyre dressing', true],
  ['Interior vacuum', true],
  ['Dashboard polish', false],
  ['Glass treatment', false],
];

const LABELS = ['En Route', 'Arrived', 'In Progress', 'Complete'];

export default function JobDetail() {
  const [step, setStep] = useState(2);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useThemeColors();
  const ss = useSharedStyles();

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },

    statusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto',
      paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
      backgroundColor: c.lineFaint, borderWidth: 1, borderColor: c.line,
    },
    badgeDot:  { width: 6, height: 6, borderRadius: 999 },
    badgeText: { fontFamily: typography.sans, fontSize: 11, color: c.fg2 },

    customerPanel: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginHorizontal: spacing[5], marginTop: spacing[2],
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, padding: 14,
    },
    carSilhouette: {
      width: 80, height: 56, borderRadius: radii.sm, overflow: 'hidden',
      backgroundColor: c.cardHi, borderWidth: 1, borderColor: c.line,
      alignItems: 'center', justifyContent: 'center',
    },
    carShape: {
      width: 64, height: 26, borderRadius: 5,
      backgroundColor: c.ink, borderWidth: 1, borderColor: c.lineStrong,
    },
    customerInfo:  { flex: 1 },
    customerName:  { fontFamily: typography.sansMedium, fontSize: 15, color: c.fg },
    customerCar:   { fontFamily: typography.sans, fontSize: 12, color: c.fg2 },
    customerColor: { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.6, marginTop: 2 },
    callBtn: {
      width: 40, height: 40, borderRadius: 999, backgroundColor: c.sage,
      alignItems: 'center', justifyContent: 'center',
    },

    stepperCard: {
      marginHorizontal: spacing[5], marginTop: spacing[3],
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, padding: 18, gap: spacing[2],
    },
    dotTrack:  { flexDirection: 'row', alignItems: 'center' },
    stepDot: {
      flexShrink: 0,
      width: 28, height: 28, borderRadius: 999,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      alignItems: 'center', justifyContent: 'center',
    },
    stepDotActive:      { backgroundColor: c.sage, borderColor: 'transparent' },
    stepDotCurrent:     { borderColor: c.sageHi },
    stepDotText:        { fontFamily: typography.mono, fontSize: 10, color: c.fg3 },
    stepDotTextActive:  { color: c.fg },
    stepConn:           { flex: 1, height: 1, backgroundColor: c.line },
    stepConnActive:     { backgroundColor: c.sage },
    labelTrack:         { flexDirection: 'row' },
    stepLabel:          { flex: 1, fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8, textAlign: 'center' },
    stepLabelActive:    { color: c.fg },

    section:   { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
    checklist: { marginTop: spacing[2], gap: 6 },
    checkItem: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 14,
    },
    checkbox: {
      width: 20, height: 20, borderRadius: 6,
      borderWidth: 1, borderColor: c.lineStrong,
      alignItems: 'center', justifyContent: 'center',
    },
    checkboxDone: { backgroundColor: c.sage, borderColor: c.sage },
    checkLabel:     { flex: 1, fontFamily: typography.sans, fontSize: 13, color: c.fg },
    checkLabelDone: { color: c.fg3, textDecorationLine: 'line-through' },

    photoRow: { flexDirection: 'row', gap: 8, marginTop: spacing[2] },
    photoBefore: {
      flex: 1, height: 110, borderRadius: radii.md, overflow: 'hidden',
      backgroundColor: c.cardHi, borderWidth: 1, borderColor: c.line,
      justifyContent: 'flex-end', padding: spacing[2],
    },
    photoLabel: {
      fontFamily: typography.mono, fontSize: 9, color: c.fg2, letterSpacing: 0.8,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0,0,0,0.5)', // always-dark photo label overlay
      paddingVertical: 3, paddingHorizontal: 7, borderRadius: 4,
    },
    photoAdd: {
      flex: 1, height: 110, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.lineStrong,
      backgroundColor: c.lineFaint,
      alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    photoAddText: { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.8 },
  });

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[5], paddingVertical: spacing[3] }}>
          <TouchableOpacity style={ss.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={16} color={c.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={ss.eyebrow}>[JOB] #PC-2058</Text>
          <View style={s.statusBadge}>
            <View style={[s.badgeDot, { backgroundColor: c.statusInProgress }]} />
            <Text style={s.badgeText}>IN PROGRESS</Text>
          </View>
        </View>

        {/* Customer panel */}
        <View style={s.customerPanel}>
          <View style={s.carSilhouette}>
            <View style={s.carShape} />
          </View>
          <View style={s.customerInfo}>
            <Text style={s.customerName}>Aarav Mehta</Text>
            <Text style={s.customerCar}>BMW 3 Series · DL 4C AB 1234</Text>
            <Text style={s.customerColor}>MINERAL GREY</Text>
          </View>
          <TouchableOpacity style={s.callBtn}>
            <Phone size={16} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Stepper */}
        <View style={s.stepperCard}>
          <View style={s.dotTrack}>
            {LABELS.flatMap((_, i) => {
              const active = i <= step;
              const isCurrent = i === step;
              const items = [
                <View key={`dot-${i}`} style={[s.stepDot, active && s.stepDotActive, isCurrent && s.stepDotCurrent]}>
                  <Text style={[s.stepDotText, active && s.stepDotTextActive]}>{i + 1}</Text>
                </View>,
              ];
              if (i < LABELS.length - 1) {
                items.push(<View key={`conn-${i}`} style={[s.stepConn, i < step && s.stepConnActive]} />);
              }
              return items;
            })}
          </View>
          <View style={s.labelTrack}>
            {LABELS.map((label, i) => (
              <Text key={i} style={[s.stepLabel, i <= step && s.stepLabelActive]}>{label}</Text>
            ))}
          </View>
        </View>

        {/* Checklist */}
        <View style={s.section}>
          <Text style={ss.eyebrow}>[CHECKLIST] · 4 OF 6</Text>
          <View style={s.checklist}>
            {CHECKLIST.map(([label, done], i) => (
              <View key={i} style={s.checkItem}>
                <View style={[s.checkbox, done && s.checkboxDone]}>
                  {done && <Check size={12} color="#fff" strokeWidth={2.5} />}
                </View>
                <Text style={[s.checkLabel, done && s.checkLabelDone]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Photos */}
        <View style={s.section}>
          <Text style={ss.eyebrow}>[PHOTOS] · BEFORE / AFTER</Text>
          <View style={s.photoRow}>
            <View style={s.photoBefore}>
              <Text style={s.photoLabel}>BEFORE</Text>
            </View>
            <View style={s.photoAdd}>
              <Camera size={20} color={c.fg3} strokeWidth={1.5} />
              <Text style={s.photoAddText}>ADD AFTER</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer actions */}
      <View style={[
        ss.footerBar,
        {
          position: 'absolute', bottom: 0, left: 0, right: 0,
          flexDirection: 'row', gap: 8,
          paddingHorizontal: spacing[5], paddingTop: spacing[3],
          paddingBottom: spacing[3] + insets.bottom,
        },
      ]}>
        <TouchableOpacity
          style={[ss.ghostBtn, { flex: 1, flexDirection: 'row', gap: 6 }]}
          onPress={() => setStep(Math.max(0, step - 1))}
        >
          <ChevronLeft size={14} color={c.fg} strokeWidth={1.5} />
          <Text style={ss.ghostBtnText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ss.primaryBtn, { flex: 2 }]}
          onPress={() => {
            if (step === 3) {
              router.push('/(worker)/otp-complete');
            } else {
              setStep(Math.min(3, step + 1));
            }
          }}
        >
          <Text style={ss.primaryBtnText}>
            {step === 3 ? 'Awaiting OTP →' : 'Mark Step Complete →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
