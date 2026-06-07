import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Phone, Check } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import type { BookingStatus } from '@pc/firebase';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

const DEFAULT_CHECKLIST = [
  'Hand wash & rinse',
  'Wax & shine',
  'Tyre dressing',
  'Interior vacuum',
  'Dashboard polish',
  'Glass treatment',
];

const LABELS = ['En Route', 'Arrived', 'In Progress', 'Complete'];

// Step index → Firestore BookingStatus
const STEP_STATUS: BookingStatus[] = ['enroute', 'arrived', 'inprogress', 'done'];

export default function JobDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c  = useThemeColors();
  const ss = useSharedStyles();
  const { bookingId = 'PC-2058' } = useLocalSearchParams<{ bookingId?: string }>();

  const [step,          setStep]          = useState(0);
  const [checklist,     setChecklist]     = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_CHECKLIST.map(item => [item, false])),
  );
  const [customerName,  setCustomerName]  = useState('—');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehicleLabel,  setVehicleLabel]  = useState('—');
  const [vehicleColor,  setVehicleColor]  = useState('');

  // Load booking state from Firestore
  useEffect(() => {
    const unsub = firestore()
      .collection('bookings')
      .doc(bookingId)
      .onSnapshot(snap => {
        if (!snap.exists()) return;
        const data = snap.data();
        // Restore step from status
        const statusStep = STEP_STATUS.indexOf(data?.status ?? 'enroute');
        if (statusStep >= 0) setStep(statusStep);
        // Restore checklist (stored as Record<string, boolean> on the booking)
        if (data?.checklist) setChecklist(prev => ({ ...prev, ...data.checklist }));
        // Customer & vehicle info (denormalized on booking doc)
        if (data?.customerName)  setCustomerName(data.customerName);
        if (data?.customerPhone) setCustomerPhone(data.customerPhone);
        if (data?.vehicle) {
          const v = data.vehicle;
          setVehicleLabel([v.make, v.model, v.registration].filter(Boolean).join(' · '));
          if (v.color) setVehicleColor(v.color.toUpperCase());
        }
      },
      err => console.warn('[JobDetail]', err.message),
    );
    return () => unsub();
  }, [bookingId]);

  async function toggleItem(item: string) {
    const updated = { ...checklist, [item]: !checklist[item] };
    setChecklist(updated);
    try {
      await firestore().collection('bookings').doc(bookingId).update({
        checklist:  updated,
        updatedAt:  firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn('[JobDetail] checklist update failed:', err);
    }
  }

  async function handleStepAdvance() {
    const nextStep = Math.min(3, step + 1);
    setStep(nextStep);
    try {
      await firestore().collection('bookings').doc(bookingId).update({
        status:      STEP_STATUS[nextStep],
        updatedAt:   firestore.FieldValue.serverTimestamp(),
        ...(nextStep === 3 ? { completedAt: firestore.FieldValue.serverTimestamp() } : {}),
      });
    } catch (err) {
      console.warn('[JobDetail] step update failed:', err);
    }
    if (nextStep === 3) {
      router.back();
    }
  }

  async function handleStepBack() {
    const prevStep = Math.max(0, step - 1);
    setStep(prevStep);
    try {
      await firestore().collection('bookings').doc(bookingId).update({
        status:    STEP_STATUS[prevStep],
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.warn('[JobDetail] step back failed:', err);
    }
  }

  const items = Object.entries(checklist);
  const doneCount = items.filter(([, v]) => v).length;

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
    carShape:       { width: 64, height: 26, borderRadius: 5, backgroundColor: c.ink, borderWidth: 1, borderColor: c.lineStrong },
    customerInfo:   { flex: 1 },
    customerName:   { fontFamily: typography.sansMedium, fontSize: 15, color: c.fg },
    customerCar:    { fontFamily: typography.sans, fontSize: 12, color: c.fg2 },
    customerColor:  { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.6, marginTop: 2 },
    callBtn:        { width: 40, height: 40, borderRadius: 999, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center' },

    stepperCard: {
      marginHorizontal: spacing[5], marginTop: spacing[3],
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, padding: 18, gap: spacing[2],
    },
    dotTrack:         { flexDirection: 'row', alignItems: 'center' },
    stepDot:          { flexShrink: 0, width: 28, height: 28, borderRadius: 999, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
    stepDotActive:    { backgroundColor: c.sage, borderColor: 'transparent' },
    stepDotCurrent:   { borderColor: c.sageHi },
    stepDotText:      { fontFamily: typography.mono, fontSize: 10, color: c.fg3 },
    stepDotTextActive:{ color: c.fg },
    stepConn:         { flex: 1, height: 1, backgroundColor: c.line },
    stepConnActive:   { backgroundColor: c.sage },
    labelTrack:       { flexDirection: 'row' },
    stepLabel:        { flex: 1, fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8, textAlign: 'center' },
    stepLabelActive:  { color: c.fg },

    section:  { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
    checklist:{ marginTop: spacing[2], gap: 6 },
    checkItem:{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 14,
    },
    checkbox:       { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' },
    checkboxDone:   { backgroundColor: c.sage, borderColor: c.sage },
    checkLabel:     { flex: 1, fontFamily: typography.sans, fontSize: 13, color: c.fg },
    checkLabelDone: { color: c.fg3, textDecorationLine: 'line-through' },

  });

  const currentStatus = STEP_STATUS[step];
  const statusColor: Record<string, string> = {
    enroute:    c.statusEnroute,
    assigned:   c.statusAssigned,
    inprogress: c.statusInProgress,
    done:       c.statusDone,
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[5], paddingVertical: spacing[3] }}>
          <TouchableOpacity style={ss.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={16} color={c.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={ss.eyebrow}>[JOB] #{bookingId.slice(0, 8).toUpperCase()}</Text>
          <View style={s.statusBadge}>
            <View style={[s.badgeDot, { backgroundColor: statusColor[currentStatus] ?? c.fg3 }]} />
            <Text style={s.badgeText}>{currentStatus.toUpperCase()}</Text>
          </View>
        </View>

        {/* Customer panel */}
        <View style={s.customerPanel}>
          <View style={s.carSilhouette}>
            <View style={s.carShape} />
          </View>
          <View style={s.customerInfo}>
            <Text style={s.customerName}>{customerName}</Text>
            <Text style={s.customerCar}>{vehicleLabel}</Text>
            {vehicleColor ? <Text style={s.customerColor}>{vehicleColor}</Text> : null}
          </View>
          <TouchableOpacity
            style={[s.callBtn, !customerPhone && { opacity: 0.4 }]}
            onPress={() => customerPhone && Linking.openURL(`tel:${customerPhone}`)}
            disabled={!customerPhone}
          >
            <Phone size={16} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Stepper */}
        <View style={s.stepperCard}>
          <View style={s.dotTrack}>
            {LABELS.flatMap((_, i) => {
              const active    = i <= step;
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
          <Text style={ss.eyebrow}>[CHECKLIST] · {doneCount} OF {items.length}</Text>
          <View style={s.checklist}>
            {items.map(([item, done]) => (
              <TouchableOpacity key={item} style={s.checkItem} onPress={() => toggleItem(item)} activeOpacity={0.8}>
                <View style={[s.checkbox, done && s.checkboxDone]}>
                  {done && <Check size={12} color="#fff" strokeWidth={2.5} />}
                </View>
                <Text style={[s.checkLabel, done && s.checkLabelDone]}>{item}</Text>
              </TouchableOpacity>
            ))}
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
          onPress={handleStepBack}
          disabled={step === 0}
        >
          <ChevronLeft size={14} color={step === 0 ? c.fg4 : c.fg} strokeWidth={1.5} />
          <Text style={[ss.ghostBtnText, step === 0 && { color: c.fg4 }]}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ss.primaryBtn, { flex: 2 }]}
          onPress={handleStepAdvance}
        >
          <Text style={ss.primaryBtnText}>
            {step === 3 ? 'Mark Complete →' : 'Next Step →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
