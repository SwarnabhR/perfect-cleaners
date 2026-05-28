import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CarImage } from '@pc/ui';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

const BOOKING_DATA: Record<string, {
  title: string;
  status: string;
  date: string;
  car: string;
  plate: string;
  time: string;
  address: string;
  worker: string;
  method: string;
  paymentStatus: string;
  total: string;
}> = {
  '#PC-2041': {
    title: 'Exterior Wash',
    status: 'COMPLETED · 22 MAY 2026',
    date: 'Fri, 22 May',
    car: 'Hyundai Creta',
    plate: 'DL 8C XY 0921',
    time: '11:00 AM',
    address: 'B-204, Kavi Nagar',
    worker: 'Rahul Sharma',
    method: 'HDFC •••• 4242',
    paymentStatus: 'Paid',
    total: '₹350',
  },
  '#PC-2058': {
    title: 'Premium Wash + Interior',
    status: 'UPCOMING · 28 MAY 2026',
    date: 'Tue, 28 May',
    car: 'BMW 3 Series',
    plate: 'DL 4C AB 1234',
    time: '2:00 PM',
    address: 'B-204, Kavi Nagar',
    worker: 'Rahul Sharma',
    method: 'UPI · GPay',
    paymentStatus: 'Paid',
    total: '₹1,080',
  },
};

const FALLBACK_ID = '#PC-2041';

export default function BookingDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bookingId = id ?? FALLBACK_ID;
  const b = BOOKING_DATA[bookingId] ?? BOOKING_DATA[FALLBACK_ID];
  const isCompleted = b.status.startsWith('COMPLETED');

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    titleBlock: {
      paddingHorizontal: spacing[5],
      paddingBottom: spacing[3],
    },
    statusLabel: {
      fontFamily: typography.mono,
      fontSize: 9.5, color: c.fg3,
      letterSpacing: 0.8, textTransform: 'uppercase',
    },
    serviceTitle: {
      fontFamily: typography.serif,
      fontSize: 32,
      color: c.fg,
      letterSpacing: -0.3,
      lineHeight: 36,
      marginTop: 4,
    },

    beforeAfter: {
      marginHorizontal: spacing[5],
      height: 200,
      borderRadius: radii.md,
      overflow: 'hidden',
      flexDirection: 'row',
      marginBottom: spacing[1],
    },
    beforeHalf: { flex: 1, position: 'relative' },
    afterHalf:  { flex: 1, position: 'relative' },
    divider: { width: 2, backgroundColor: '#fff', zIndex: 2 },
    baImage: { width: '100%', height: '100%', borderRadius: 0, borderWidth: 0 },
    baLabel: {
      position: 'absolute', top: 10, left: 10,
      paddingHorizontal: 7, paddingVertical: 3,
      borderRadius: radii.xs,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    baLabelAfter: {
      left: undefined, right: 10,
      backgroundColor: c.sageHi,
    },
    baLabelText: {
      fontFamily: typography.mono, fontSize: 9, color: '#fff', letterSpacing: 0.8,
    },

    carBanner: { marginHorizontal: spacing[5], marginBottom: spacing[1] },
    carBannerImg: { height: 140 },

    actions: {
      paddingHorizontal: spacing[5],
      paddingTop: spacing[4],
      gap: spacing[2],
    },
    primaryBtn: {
      backgroundColor: c.warm,
      borderRadius: radii.pill,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnText: {
      fontFamily: typography.sansSemiBold,
      fontSize: 13, color: c.ink, letterSpacing: 0.6,
    },
    ghostBtn: {
      borderRadius: radii.pill,
      paddingVertical: 13,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.lineStrong,
    },
    ghostBtnText: {
      fontFamily: typography.sansMedium,
      fontSize: 13, color: c.fg, letterSpacing: 0.6,
    },
  });

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title={bookingId} />
      </View>

      <View style={s.titleBlock}>
        <Text style={s.statusLabel}>{b.status}</Text>
        <Text style={s.serviceTitle}>{b.title}</Text>
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
            <View style={[s.baLabel, s.baLabelAfter]}>
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
        <Row title="Car"     value={`${b.car} · ${b.plate}`} />
        <Row title="Date"    value={b.date} />
        <Row title="Time"    value={b.time} />
        <Row title="Address" value={b.address} />
        <Row title="Worker"  value={b.worker} isLast />
      </Group>

      <Group header="Payment">
        <Row title="Method" value={b.method} />
        <Row title="Status" value={b.paymentStatus} />
        <Row title="Total"  value={b.total} isLast />
      </Group>

      <View style={s.actions}>
        {isCompleted ? (
          <>
            <TouchableOpacity
              style={s.primaryBtn}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(customer)/rate-booking',
                  params: { id: bookingId },
                })
              }
            >
              <Text style={s.primaryBtnText}>Rate & Review →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.ghostBtn}
              activeOpacity={0.75}
              onPress={() => router.push('/(customer)/booking')}
            >
              <Text style={s.ghostBtnText}>Book Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} activeOpacity={0.75}>
              <Text style={s.ghostBtnText}>Download Invoice</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={s.primaryBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/(customer)/tracker')}
            >
              <Text style={s.primaryBtnText}>Track Booking →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} activeOpacity={0.75}>
              <Text style={s.ghostBtnText}>Cancel Booking</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}
