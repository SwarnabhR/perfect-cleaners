import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { BookingStatus } from '@pc/firebase';
import { colors, typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';
import { CarImage } from '@pc/ui';
import { SegCtrl } from '../../../components/RowGroup';

type FilterStatus = 'all' | 'upcoming' | 'done' | 'cancelled';

interface BookingRow {
  id:          string;
  bookingRef:  string;
  service:     string;
  car:         string;
  date:        string;
  time:        string;
  price:       number;
  status:      FilterStatus;
  scheduledAt: number; // ms timestamp for sorting
}

function toFilterStatus(s: BookingStatus): FilterStatus {
  if (s === 'done')      return 'done';
  if (s === 'cancelled') return 'cancelled';
  return 'upcoming';
}

const STATUS_COLOR: Record<FilterStatus, string> = {
  all:       colors.fg3,
  upcoming:  colors.warning,
  done:      colors.success,
  cancelled: colors.danger,
};

const SEG_OPTIONS = [
  { value: 'all',       label: 'All'       },
  { value: 'upcoming',  label: 'Upcoming'  },
  { value: 'done',      label: 'Done'      },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function BookingsTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c      = useThemeColors();
  const ss     = useSharedStyles();
  const [filter,   setFilter]   = useState<FilterStatus>('all');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const phone = auth().currentUser?.phoneNumber;
    if (!phone) { setLoading(false); return; }

    const unsub = firestore()
      .collection('bookings')
      .where('customerPhone', '==', phone)
      .onSnapshot(snap => {
        const rows: BookingRow[] = snap.docs
          .map(d => {
            const data = d.data();
            const at: Date = data.scheduledAt?.toDate?.() ?? new Date(data.scheduledAt ?? 0);
            const make  = data.vehicle?.make  ?? '';
            const model = data.vehicle?.model ?? '';
            const svcId = (data.serviceIds?.[0] ?? '') as string;
            return {
              id:          d.id,
              bookingRef:  data.bookingRef ?? d.id.slice(-6).toUpperCase(),
              service:     svcId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
              car:         [make, model].filter(Boolean).join(' '),
              date:        at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              time:        at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              price:       data.priceBreakdown?.total ?? 0,
              status:      toFilterStatus(data.status as BookingStatus),
              scheduledAt: at.getTime(),
            };
          })
          .sort((a, b) => b.scheduledAt - a.scheduledAt);
        setBookings(rows);
        setLoading(false);
      }, () => setLoading(false));

    return unsub;
  }, []);

  const list = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <TabTopBar />
      </View>

      <View style={s.titleRow}>
        <Text style={[ss.pageTitle, { color: c.fg }]}>Your bookings.</Text>
      </View>

      <View style={s.segWrap}>
        <SegCtrl options={SEG_OPTIONS} value={filter} onChange={v => setFilter(v as FilterStatus)} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={c.fg3} />
      ) : list.length === 0 ? (
        <EmptyState router={router} filter={filter} />
      ) : (
        <View style={s.list}>
          {list.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onPress={() => router.push({ pathname: '/(customer)/booking-detail', params: { id: b.id } })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function BookingCard({ booking: b, onPress }: { booking: BookingRow; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <CarImage tone="dark" style={s.thumb} />
      <View style={s.cardBody}>
        <View style={s.idRow}>
          <View style={[s.dot, { backgroundColor: STATUS_COLOR[b.status] }]} />
          <Text style={[s.id, { color: c.fg3 }]}>PC-{b.bookingRef}</Text>
        </View>
        <Text style={[s.service, { color: c.fg }]} numberOfLines={1}>{b.service}</Text>
        <Text style={[s.meta, { color: c.fg2 }]} numberOfLines={1}>
          {b.car || '—'} · {b.date} · {b.time}
        </Text>
      </View>
      <View style={s.cardRight}>
        <Text style={[s.price, { color: c.fg }]}>₹{b.price.toLocaleString('en-IN')}</Text>
        <Text style={[s.arrow, { color: c.fg3 }]}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ router, filter }: { router: ReturnType<typeof useRouter>; filter: string }) {
  const c  = useThemeColors();
  const ss = useSharedStyles();
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyGlow} />
      <View style={[s.emptyIcon, { backgroundColor: c.card, borderColor: c.lineStrong }]}>
        <Car size={26} color={c.fg2} strokeWidth={1.5} />
      </View>
      <Text style={[s.emptyTitle, { color: c.fg }]}>
        {filter === 'all' ? 'No activity yet.' : `No ${filter} bookings.`}
      </Text>
      {filter === 'all' && (
        <>
          <Text style={[s.emptyBody, { color: c.fg2 }]}>
            Your scheduled society cleans appear here automatically. For premium add-ons, tap below.
          </Text>
          <TouchableOpacity
            style={ss.primaryBtn}
            onPress={() => router.push('/(customer)/booking')}
          >
            <Text style={ss.primaryBtnText}>Book a Premium Add-on →</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  titleRow: { paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  segWrap:  { paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  list:     { paddingHorizontal: spacing[5], gap: spacing[2] },
  card:     { borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, overflow: 'hidden' },
  thumb:    { width: 56, height: 56, flexShrink: 0 },
  cardBody: { flex: 1, minWidth: 0 },
  idRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  dot:      { width: 6, height: 6, borderRadius: 999 },
  id:       { fontFamily: typography.mono, fontSize: 9.5, letterSpacing: 0.8 },
  service:  { fontFamily: typography.sansMedium, fontSize: 14, letterSpacing: -0.1 },
  meta:     { fontFamily: typography.sans, fontSize: 11.5, marginTop: 2 },
  cardRight:{ alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  price:    { fontFamily: typography.serif, fontSize: 17 },
  arrow:    { fontFamily: typography.sans, fontSize: 18 },
  emptyWrap:  { alignItems: 'center', paddingHorizontal: spacing[8], paddingTop: 60, gap: spacing[4] },
  emptyGlow:  { position: 'absolute', top: 60, width: 140, height: 140, borderRadius: 999, backgroundColor: 'rgba(91,111,82,0.14)' },
  emptyIcon:  { width: 64, height: 64, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: typography.serif, fontSize: 22, letterSpacing: -0.3, textAlign: 'center' },
  emptyBody:  { fontFamily: typography.sans, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 260 },
});
