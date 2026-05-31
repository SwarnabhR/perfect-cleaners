import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock, MapPin, Phone } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import type { Booking, BookingStatus } from '@pc/firebase';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

const STEPS = ['Assigned', 'En Route', 'In Progress', 'Done'];

const STATUS_STEP: Record<BookingStatus, number> = {
  pending: 0, assigned: 0, enroute: 1, inprogress: 2, done: 3, cancelled: 3,
};

export default function TrackerScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const c       = useThemeColors();
  const ss      = useSharedStyles();
  const { bookingId = 'PC-2058' } = useLocalSearchParams<{ bookingId?: string }>();
  const [currentStep,  setCurrentStep]  = useState(1);
  const [booking,      setBooking]      = useState<Partial<Booking> | null>(null);
  const [workerPhone,  setWorkerPhone]  = useState('');

  const s = StyleSheet.create({
    scrollContent: { paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
    map: {
      marginHorizontal: spacing[5], height: 200,
      borderRadius: radii.md, overflow: 'hidden',
      borderWidth: 1, borderColor: c.line, backgroundColor: c.card,
    },
    mapSvg: { flex: 1, position: 'relative' },
    road:  { position: 'absolute', height: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
    roadV: { position: 'absolute', top: 0, bottom: 0, width: 10, backgroundColor: 'rgba(255,255,255,0.06)' },
    pin: { position: 'absolute', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    pinOuter: { width: 28, height: 28, borderRadius: 999, backgroundColor: c.sage, opacity: 0.4, position: 'absolute' },
    pinInner: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#fff' },
    pinDest: { position: 'absolute', width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: c.warm },
    routeLine: { position: 'absolute', top: '44%', left: '32%', right: '28%', height: 1.5, backgroundColor: c.warm },
    etaBadge: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(14,13,11,0.8)', borderRadius: radii.pill, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: c.line },
    etaText: { fontFamily: typography.mono, fontSize: 10, color: '#fff', letterSpacing: 0.8 },
    stepperCard: { marginHorizontal: spacing[5], marginTop: spacing[4], backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: 18, gap: spacing[2] },
    dotTrack:   { flexDirection: 'row', alignItems: 'center' },
    stepDot:    { flexShrink: 0, width: 28, height: 28, borderRadius: 999, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
    stepDotActive:   { backgroundColor: c.sage, borderColor: 'transparent' },
    stepDotCurrent:  { borderColor: c.sageHi },
    stepDotText:     { fontFamily: typography.mono, fontSize: 10, color: c.fg3 },
    stepDotTextActive: { color: c.fg },
    stepConn:   { flex: 1, height: 1, backgroundColor: c.line },
    stepConnActive: { backgroundColor: c.sage },
    labelTrack: { flexDirection: 'row' },
    stepLabel:  { flex: 1, fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8, textAlign: 'center' },
    stepLabelActive: { color: c.fg },
    techCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: spacing[5], marginTop: spacing[3], backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: 14 },
    techAvatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center' },
    techAvatarText: { fontFamily: typography.sansSemiBold, fontSize: 16, color: '#fff' },
    techInfo:   { flex: 1 },
    techName:   { fontFamily: typography.sansMedium, fontSize: 15, color: c.fg },
    techRating: { fontFamily: typography.sans, fontSize: 11, color: c.fg2 },
    techCall:   { width: 40, height: 40, borderRadius: 999, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center' },
    orderCard:    { marginHorizontal: spacing[5], marginTop: spacing[3], backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: spacing[4], gap: spacing[2] },
    orderRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    orderTitle:   { fontFamily: typography.sansMedium, fontSize: 14, color: c.fg },
    orderPrice:   { fontFamily: typography.sansSemiBold, fontSize: 18, color: c.fg },
    orderAddress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    orderAddressText: { fontFamily: typography.sans, fontSize: 12, color: c.fg2, flex: 1 },
  });

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

  // Load worker phone once workerId is known
  useEffect(() => {
    const workerId = (booking as any)?.workerId;
    if (!workerId) return;
    firestore().collection('workers').doc(workerId).get().then(snap => {
      if (snap.exists()) setWorkerPhone(snap.data()?.phone ?? '');
    }).catch(() => {});
  }, [(booking as any)?.workerId]);

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={ss.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={16} color={c.fg} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={ss.eyebrow}>[BOOKING] #{bookingId.slice(0, 8).toUpperCase()} / LIVE</Text>
      </View>

      {/* Map */}
      <View style={s.map}>
        <View style={s.mapSvg}>
          <View style={[s.road,  { top: '42%', width: '120%', left: '-10%' }]} />
          <View style={[s.road,  { top: '55%', width: '120%', left: '-10%' }]} />
          <View style={[s.roadV, { left: '30%' }]} />
          <View style={[s.roadV, { left: '65%' }]} />
          <View style={[s.pin,  { top: '42%', left: '30%' }]}>
            <View style={s.pinOuter} />
            <View style={s.pinInner} />
          </View>
          <View style={[s.pinDest, { top: '38%', left: '65%' }]} />
          <View style={s.routeLine} />
        </View>
        <View style={s.etaBadge}>
          <Clock size={11} color="#fff" strokeWidth={1.5} />
          <Text style={s.etaText}>ETA 9 MIN</Text>
        </View>
      </View>

      {/* Stepper */}
      <View style={s.stepperCard}>
        <View style={s.dotTrack}>
          {STEPS.flatMap((_, i) => {
            const active    = i <= currentStep;
            const isCurrent = i === currentStep;
            const items = [
              <View key={`dot-${i}`} style={[s.stepDot, active && s.stepDotActive, isCurrent && s.stepDotCurrent]}>
                <Text style={[s.stepDotText, active && s.stepDotTextActive]}>{i + 1}</Text>
              </View>,
            ];
            if (i < STEPS.length - 1) {
              items.push(<View key={`conn-${i}`} style={[s.stepConn, i < currentStep && s.stepConnActive]} />);
            }
            return items;
          })}
        </View>
        <View style={s.labelTrack}>
          {STEPS.map((label, i) => (
            <Text key={i} style={[s.stepLabel, i <= currentStep && s.stepLabelActive]}>{label}</Text>
          ))}
        </View>
      </View>

      {/* Technician card — only shown once a worker is assigned */}
      {(booking as any)?.workerId && (
        <View style={s.techCard}>
          <View style={s.techAvatar}>
            <Text style={s.techAvatarText}>
              {((booking as any)?.workerName ?? 'W').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
            </Text>
          </View>
          <View style={s.techInfo}>
            <Text style={ss.eyebrow}>YOUR TECHNICIAN</Text>
            <Text style={s.techName}>{(booking as any)?.workerName ?? 'Assigned Technician'}</Text>
          </View>
          <TouchableOpacity
            style={[s.techCall, !workerPhone && { opacity: 0.4 }]}
            onPress={() => workerPhone && Linking.openURL(`tel:${workerPhone}`)}
            disabled={!workerPhone}
          >
            <Phone size={16} color="#fff" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      )}

      {/* OTP — shown when job is in progress so customer can confirm completion */}
      {booking?.status === 'inprogress' && (booking as any)?.otpCode && (
        <View style={{ marginHorizontal: spacing[5], marginTop: spacing[3], backgroundColor: c.sage, borderRadius: radii.md, padding: spacing[4], gap: spacing[1] }}>
          <Text style={{ fontFamily: typography.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, textTransform: 'uppercase' }}>JOB COMPLETION CODE</Text>
          <Text style={{ fontFamily: typography.serif, fontSize: 38, color: '#fff', letterSpacing: 8 }}>{(booking as any).otpCode}</Text>
          <Text style={{ fontFamily: typography.sans, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 }}>Share this 4-digit code with your technician to confirm the job is complete.</Text>
        </View>
      )}

      {/* Order summary */}
      <View style={s.orderCard}>
        <Text style={ss.eyebrow}>[ORDER]</Text>
        <View style={s.orderRow}>
          <Text style={s.orderTitle}>
            {booking?.serviceIds?.[0]
              ? booking.serviceIds[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              : 'Wash Service'}
          </Text>
          <Text style={s.orderPrice}>
            {booking?.priceBreakdown?.total
              ? `₹${booking.priceBreakdown.total.toLocaleString('en-IN')}`
              : '—'}
          </Text>
        </View>
        {booking?.vehicle && (
          <View style={s.orderAddress}>
            <Text style={[s.orderAddressText, { color: c.fg3 }]}>
              {booking.vehicle.make} {booking.vehicle.model}
              {booking.vehicle.registration ? ` · ${booking.vehicle.registration}` : ''}
            </Text>
          </View>
        )}
        <View style={s.orderAddress}>
          <MapPin size={12} color={c.fg3} strokeWidth={1.5} />
          <Text style={s.orderAddressText}>
            {booking?.address?.line1
              ? `${booking.address.line1}, ${booking.address.city}`
              : 'Loading…'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
