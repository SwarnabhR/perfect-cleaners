import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import type { Booking, BookingStatus } from '@pc/firebase';
import { CarImage } from '@pc/ui';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

const DONE_STATUSES: BookingStatus[] = ['done'];
const ACTIVE_STATUSES: BookingStatus[] = ['assigned', 'enroute', 'inprogress'];

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c      = useThemeColors();
  const ss     = useSharedStyles();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking,    setBooking]    = useState<(Booking & { id: string; bookingRef?: string; customerName?: string; workerName?: string }) | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [cancelling, setCancelling] = useState(false);

  function handleCancel() {
    if (!booking || cancelling) return;
    const hasWorker = booking.status === 'assigned';
    Alert.alert(
      'Cancel booking?',
      hasWorker
        ? 'A technician has already been assigned. Are you sure you want to cancel?'
        : 'This booking will be cancelled and cannot be undone.',
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await firestore()
                .collection('bookings')
                .doc(id)
                .update({
                  status:    'cancelled',
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                });
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not cancel. Please try again.');
              setCancelling(false);
            }
          },
        },
      ],
    );
  }

  useEffect(() => {
    if (!id) return;
    const unsub = firestore()
      .collection('bookings')
      .doc(id)
      .onSnapshot(snap => {
        if (snap.exists()) {
          setBooking({ id: snap.id, ...(snap.data() as any) });
        }
        setLoading(false);
      }, () => setLoading(false));
    return unsub;
  }, [id]);

  const s = StyleSheet.create({
    scrollContent: { paddingBottom: spacing[10] },
    titleBlock:    { paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
    serviceTitle:  { fontFamily: typography.serif, fontSize: 32, letterSpacing: -0.3, lineHeight: 36, marginTop: 4, color: c.fg },
    beforeAfter:   { marginHorizontal: spacing[5], height: 200, borderRadius: radii.md, overflow: 'hidden', flexDirection: 'row', marginBottom: spacing[1] },
    beforeHalf:    { flex: 1, position: 'relative' },
    afterHalf:     { flex: 1, position: 'relative' },
    divider:       { width: 2, backgroundColor: '#fff', zIndex: 2 },
    baImage:       { width: '100%', height: '100%', borderRadius: 0, borderWidth: 0 },
    baLabel:       { position: 'absolute', top: 10, left: 10, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radii.xs, backgroundColor: 'rgba(0,0,0,0.5)' },
    baLabelAfter:  { left: undefined, right: 10 },
    baLabelText:   { fontFamily: typography.mono, fontSize: 9, color: '#fff', letterSpacing: 0.8 },
    carBanner:     { marginHorizontal: spacing[5], marginBottom: spacing[1] },
    carBannerImg:  { height: 140 },
    actions:       { paddingHorizontal: spacing[5], paddingTop: spacing[4], gap: spacing[2] },
    centered:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  });

  if (loading) {
    return (
      <View style={[ss.screen, s.centered]}>
        <ActivityIndicator color={c.fg3} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[ss.screen, s.centered]}>
        <Text style={{ fontFamily: typography.sans, color: c.fg3 }}>Booking not found.</Text>
      </View>
    );
  }

  const status      = booking.status as BookingStatus;
  const isCompleted = DONE_STATUSES.includes(status);
  const isActive    = ACTIVE_STATUSES.includes(status);
  const isCancelled = status === 'cancelled';

  const at = (booking.scheduledAt as any)?.toDate?.() ?? new Date(booking.scheduledAt ?? 0);
  const dateStr = at.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const svcId      = booking.serviceIds?.[0] ?? '';
  const svcName    = svcId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const carStr     = [booking.vehicle?.make, booking.vehicle?.model].filter(Boolean).join(' ');
  const plateStr   = booking.vehicle?.registration ?? '';
  const addressStr = [booking.address?.line1, booking.address?.city].filter(Boolean).join(', ');
  const bookingRef = booking.bookingRef ?? id.slice(-6).toUpperCase();

  const statusLabel = isCancelled
    ? `CANCELLED · ${dateStr}`
    : isCompleted
    ? `COMPLETED · ${dateStr}`
    : `UPCOMING · ${dateStr}`;

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={`PC-${bookingRef}`} />
      </View>

      <View style={s.titleBlock}>
        <Text style={ss.eyebrow}>{statusLabel}</Text>
        <Text style={s.serviceTitle}>{svcName || 'Service'}</Text>
      </View>

      {isCompleted ? (
        <View style={s.beforeAfter}>
          <View style={s.beforeHalf}>
            <CarImage tone="light" style={s.baImage} />
            <View style={s.baLabel}>
              <Text style={s.baLabelText}>BEFORE</Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.afterHalf}>
            <CarImage tone="dark" style={s.baImage} />
            <View style={[s.baLabel, s.baLabelAfter, { backgroundColor: c.sageHi }]}>
              <Text style={s.baLabelText}>AFTER</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={s.carBanner}>
          <CarImage tone="dark" style={s.carBannerImg} />
        </View>
      )}

      <Group header="Details">
        <Row title="Car"     value={[carStr, plateStr].filter(Boolean).join(' · ') || '—'} />
        <Row title="Date"    value={dateStr} />
        <Row title="Time"    value={timeStr} />
        <Row title="Address" value={addressStr || '—'} />
        <Row title="Worker"  value={booking.workerName ?? 'Assigned soon'} isLast />
      </Group>

      <Group header="Payment">
        <Row title="Status" value={booking.paymentStatus === 'paid' ? 'Paid' : 'Pay at service'} />
        <Row title="Total"  value={`₹${(booking.priceBreakdown?.total ?? 0).toLocaleString('en-IN')}`} isLast />
      </Group>

      <View style={s.actions}>
        {isCompleted && (
          <>
            <TouchableOpacity
              style={ss.primaryBtn}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/(customer)/rate-booking', params: { id } })}
            >
              <Text style={ss.primaryBtnText}>Rate & Review →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ss.ghostBtn} activeOpacity={0.75} onPress={() => router.push('/(customer)/booking')}>
              <Text style={ss.ghostBtnText}>Book Again</Text>
            </TouchableOpacity>
          </>
        )}
        {isActive && (
          <TouchableOpacity
            style={ss.primaryBtn}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(customer)/tracker', params: { bookingId: id } })}
          >
            <Text style={ss.primaryBtnText}>Track Booking →</Text>
          </TouchableOpacity>
        )}
        {(status === 'pending' || status === 'assigned') && (
          <TouchableOpacity
            style={[ss.ghostBtn, cancelling && { opacity: 0.5 }]}
            activeOpacity={0.75}
            onPress={handleCancel}
            disabled={cancelling}
          >
            <Text style={ss.ghostBtnText}>{cancelling ? 'Cancelling…' : 'Cancel Booking'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
