import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Clock, MapPin, Phone,
} from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import type { Booking, BookingStatus } from '@pc/firebase';
import { colors, typography, spacing, radii } from '@pc/tokens';

const STEPS = ['Assigned', 'En Route', 'In Progress', 'Done'];

const STATUS_STEP: Record<BookingStatus, number> = {
  pending: 0,
  assigned: 0,
  enroute: 1,
  inprogress: 2,
  done: 3,
  cancelled: 3,
};

export default function TrackerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookingId = 'PC-2058' } = useLocalSearchParams<{ bookingId?: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [booking, setBooking] = useState<Partial<Booking> | null>(null);

  useEffect(() => {
    const unsub = firestore()
      .collection('bookings')
      .doc(bookingId)
      .onSnapshot(
        snap => {
          if (snap.exists()) {
            const data = snap.data() as Booking;
            setBooking(data);
            setCurrentStep(STATUS_STEP[data.status] ?? 0);
          }
        },
        err => console.warn('[Tracker] Firestore:', err.message),
      );
    return () => unsub();
  }, [bookingId]);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={16} color={colors.fg} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={s.eyebrow}>[BOOKING] #PC-2058 / LIVE</Text>
      </View>

      {/* Map */}
      <View style={s.map}>
        <View style={s.mapSvg}>
          {/* Road lines */}
          <View style={[s.road, { top: '42%', width: '120%', left: '-10%' }]} />
          <View style={[s.road, { top: '55%', width: '120%', left: '-10%' }]} />
          <View style={[s.roadV, { left: '30%' }]} />
          <View style={[s.roadV, { left: '65%' }]} />

          {/* Worker pin */}
          <View style={[s.pin, { top: '42%', left: '30%' }]}>
            <View style={s.pinOuter} />
            <View style={s.pinInner} />
          </View>

          {/* Destination pin */}
          <View style={[s.pinDest, { top: '38%', left: '65%' }]} />

          {/* Route dots */}
          <View style={s.routeLine} />
        </View>

        {/* ETA badge */}
        <View style={s.etaBadge}>
          <Clock size={11} color="#fff" strokeWidth={1.5} />
          <Text style={s.etaText}>ETA 9 MIN</Text>
        </View>
      </View>

      {/* Stepper */}
      <View style={s.stepperCard}>
        {/* Dot + connector track */}
        <View style={s.dotTrack}>
          {STEPS.flatMap((_, i) => {
            const active = i <= currentStep;
            const isCurrent = i === currentStep;
            const items = [
              <View key={`dot-${i}`} style={[s.stepDot, active && s.stepDotActive, isCurrent && s.stepDotCurrent]}>
                <Text style={[s.stepDotText, active && s.stepDotTextActive]}>{i + 1}</Text>
              </View>,
            ];
            if (i < STEPS.length - 1) {
              items.push(
                <View key={`conn-${i}`} style={[s.stepConn, i < currentStep && s.stepConnActive]} />,
              );
            }
            return items;
          })}
        </View>
        {/* Label track */}
        <View style={s.labelTrack}>
          {STEPS.map((label, i) => (
            <Text key={i} style={[s.stepLabel, i <= currentStep && s.stepLabelActive]}>{label}</Text>
          ))}
        </View>
      </View>

      {/* Technician card */}
      <View style={s.techCard}>
        <View style={s.techAvatar}>
          <Text style={s.techAvatarText}>RS</Text>
        </View>
        <View style={s.techInfo}>
          <Text style={s.eyebrow}>YOUR TECHNICIAN</Text>
          <Text style={s.techName}>Rahul Sharma</Text>
          <Text style={s.techRating}>4.9 · 312 jobs</Text>
        </View>
        <TouchableOpacity style={s.techCall}>
          <Phone size={16} color="#fff" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {/* Order summary */}
      <View style={s.orderCard}>
        <Text style={s.eyebrow}>[ORDER]</Text>
        <View style={s.orderRow}>
          <Text style={s.orderTitle}>Premium Wash + Interior</Text>
          <Text style={s.orderPrice}>₹1,200</Text>
        </View>
        <View style={s.orderAddress}>
          <MapPin size={12} color={colors.fg3} strokeWidth={1.5} />
          <Text style={s.orderAddressText}>B-204, Kavi Nagar, Ghaziabad 201002</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing[5], paddingBottom: spacing[3],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },

  map: {
    marginHorizontal: spacing[5], height: 200,
    borderRadius: radii.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card,
  },
  mapSvg: { flex: 1, position: 'relative' },
  road: {
    position: 'absolute', height: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    // borderStyle: 'dashed' omitted — not rendered on Android
  },
  roadV: {
    position: 'absolute', top: 0, bottom: 0, width: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pin: {
    position: 'absolute', width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  pinOuter: {
    width: 28, height: 28, borderRadius: 999,
    backgroundColor: colors.sage, opacity: 0.4,
    position: 'absolute',
  },
  pinInner: {
    width: 10, height: 10, borderRadius: 999, backgroundColor: '#fff',
  },
  pinDest: {
    position: 'absolute', width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 16,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: colors.warm,
  },
  routeLine: {
    position: 'absolute', top: '44%', left: '32%', right: '28%', height: 1.5,
    backgroundColor: colors.warm,
  },

  etaBadge: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(14,13,11,0.8)', borderRadius: radii.pill,
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.line,
  },
  etaText: { fontFamily: typography.mono, fontSize: 10, color: '#fff', letterSpacing: 0.8 },

  stepperCard: {
    marginHorizontal: spacing[5], marginTop: spacing[4],
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

  techCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing[5], marginTop: spacing[3],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: 14,
  },
  techAvatar: {
    width: 44, height: 44, borderRadius: 999, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  techAvatarText: { fontFamily: typography.sansSemiBold, fontSize: 16, color: '#fff' },
  techInfo: { flex: 1 },
  techName: { fontFamily: typography.sansMedium, fontSize: 15, color: colors.fg },
  techRating: { fontFamily: typography.sans, fontSize: 11, color: colors.fg2 },
  techCall: {
    width: 40, height: 40, borderRadius: 999, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },

  orderCard: {
    marginHorizontal: spacing[5], marginTop: spacing[3],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: spacing[4], gap: spacing[2],
  },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  orderTitle: { fontFamily: typography.sansMedium, fontSize: 14, color: colors.fg },
  orderPrice: { fontFamily: typography.sansSemiBold, fontSize: typography.lg, color: colors.fg },
  orderAddress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderAddressText: { fontFamily: typography.sans, fontSize: 12, color: colors.fg2, flex: 1 },
});
