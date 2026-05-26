import { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, ChevronRight, Phone, Camera, Check,
} from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';

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

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={16} color={colors.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={s.eyebrow}>[JOB] #PC-2058</Text>
          <View style={s.statusBadge}>
            <View style={[s.badgeDot, { backgroundColor: colors.statusInProgress }]} />
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
          <Text style={s.eyebrow}>[CHECKLIST] · 4 OF 6</Text>
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
          <Text style={s.eyebrow}>[PHOTOS] · BEFORE / AFTER</Text>
          <View style={s.photoRow}>
            <View style={s.photoBefore}>
              <Text style={s.photoLabel}>BEFORE</Text>
            </View>
            <View style={s.photoAdd}>
              <Camera size={20} color={colors.fg3} strokeWidth={1.5} />
              <Text style={s.photoAddText}>ADD AFTER</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer actions */}
      <View style={[s.footer, { paddingBottom: spacing[3] + insets.bottom }]}>
        <TouchableOpacity
          style={s.footerGhost}
          onPress={() => setStep(Math.max(0, step - 1))}
        >
          <ChevronLeft size={14} color={colors.fg} strokeWidth={1.5} />
          <Text style={s.footerGhostText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.footerPrimary}
          onPress={() => {
            if (step === 3) {
              router.push('/(worker)/otp-complete');
            } else {
              setStep(Math.min(3, step + 1));
            }
          }}
        >
          <Text style={s.footerPrimaryText}>
            {step === 3 ? 'Awaiting OTP →' : 'Mark Step Complete →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing[5], paddingVertical: spacing[3],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: colors.line,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 999 },
  badgeText: { fontFamily: typography.sans, fontSize: 11, color: colors.fg2 },

  customerPanel: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing[5], marginTop: spacing[2],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: 14,
  },
  carSilhouette: {
    width: 80, height: 56, borderRadius: radii.sm, overflow: 'hidden',
    backgroundColor: colors.cardHi, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  carShape: {
    width: 64, height: 26, borderRadius: 5,
    backgroundColor: colors.ink, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  customerInfo: { flex: 1 },
  customerName: { fontFamily: typography.sansMedium, fontSize: 15, color: colors.fg },
  customerCar: { fontFamily: typography.sans, fontSize: 12, color: colors.fg2 },
  customerColor: { fontFamily: typography.mono, fontSize: 10, color: colors.fg3, letterSpacing: 0.6, marginTop: 2 },
  callBtn: {
    width: 40, height: 40, borderRadius: 999, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },

  stepperCard: {
    marginHorizontal: spacing[5], marginTop: spacing[3],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: 18, gap: spacing[2],
  },
  dotTrack: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    flexShrink: 0,
    width: 28, height: 28, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: colors.sage, borderColor: 'transparent' },
  stepDotCurrent: { borderColor: colors.sageHi },
  stepDotText: { fontFamily: typography.mono, fontSize: 10, color: colors.fg3 },
  stepDotTextActive: { color: colors.fg },
  stepConn: { flex: 1, height: 1, backgroundColor: colors.line },
  stepConnActive: { backgroundColor: colors.sage },
  labelTrack: { flexDirection: 'row' },
  stepLabel: { flex: 1, fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textAlign: 'center' },
  stepLabelActive: { color: colors.fg },

  section: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  checklist: { marginTop: spacing[2], gap: 6 },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 14,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1, borderColor: colors.lineStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.sage, borderColor: colors.sage },
  checkLabel: { flex: 1, fontFamily: typography.sans, fontSize: 13, color: colors.fg },
  checkLabelDone: { color: colors.fg3, textDecorationLine: 'line-through' },

  photoRow: { flexDirection: 'row', gap: 8, marginTop: spacing[2] },
  photoBefore: {
    flex: 1, height: 110, borderRadius: radii.md, overflow: 'hidden',
    backgroundColor: colors.cardHi, borderWidth: 1, borderColor: colors.line,
    justifyContent: 'flex-end', padding: spacing[2],
  },
  photoLabel: {
    fontFamily: typography.mono, fontSize: 9, color: colors.fg2, letterSpacing: 0.8,
    alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 3, paddingHorizontal: 7, borderRadius: 4,
  },
  photoAdd: {
    flex: 1, height: 110, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.lineStrong,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoAddText: { fontFamily: typography.mono, fontSize: 10, color: colors.fg3, letterSpacing: 0.8 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 8,
    paddingHorizontal: spacing[5], paddingTop: spacing[3],
    // paddingBottom set inline: spacing[3] + insets.bottom
    backgroundColor: 'rgba(14,13,11,0.95)',
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  footerGhost: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.lineStrong,
  },
  footerGhostText: { fontFamily: typography.sansMedium, fontSize: 13, color: colors.fg },
  footerPrimary: {
    flex: 2, backgroundColor: colors.warm, borderRadius: radii.pill,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  footerPrimaryText: { fontFamily: typography.sansSemiBold, fontSize: 13, color: colors.ink },
});
