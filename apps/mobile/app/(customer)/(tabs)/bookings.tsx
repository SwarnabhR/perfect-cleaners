import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';
import { CarImage } from '@pc/ui';
import { SegCtrl } from '../../../components/RowGroup';

type BookingStatus = 'upcoming' | 'done' | 'cancelled';

interface Booking {
  id: string;
  service: string;
  car: string;
  date: string;
  time: string;
  price: number;
  status: BookingStatus;
}

const BOOKINGS: Booking[] = [
  { id: '#PC-2058', service: 'Premium Wash + Interior', car: 'BMW 3 Series',  date: '28 May 2026', time: '2:00 PM',   price: 1080,  status: 'upcoming'  },
  { id: '#PC-2041', service: 'Exterior Wash',           car: 'Hyundai Creta', date: '22 May 2026', time: '11:00 AM', price: 350,   status: 'done'      },
  { id: '#PC-1992', service: 'Ceramic Coating',         car: 'BMW 3 Series',  date: '14 May 2026', time: '10:00 AM', price: 18500, status: 'done'      },
  { id: '#PC-1854', service: 'Interior Detailing',      car: 'Hyundai Creta', date: '02 May 2026', time: '4:30 PM',  price: 850,   status: 'done'      },
  { id: '#PC-1812', service: 'Premium Wash',            car: 'BMW 3 Series',  date: '27 Apr 2026', time: '12:00 PM', price: 1200,  status: 'cancelled' },
];

const STATUS_COLOR: Record<BookingStatus, string> = {
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
  const [filter, setFilter] = useState('all');

  const list = filter === 'all' ? BOOKINGS : BOOKINGS.filter(b => b.status === filter);

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
        <SegCtrl options={SEG_OPTIONS} value={filter} onChange={setFilter} />
      </View>

      {list.length === 0 ? (
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

function BookingCard({ booking: b, onPress }: { booking: Booking; onPress: () => void }) {
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
          <Text style={[s.id, { color: c.fg3 }]}>{b.id}</Text>
        </View>
        <Text style={[s.service, { color: c.fg }]} numberOfLines={1}>{b.service}</Text>
        <Text style={[s.meta, { color: c.fg2 }]} numberOfLines={1}>
          {b.car} · {b.date} · {b.time}
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
        {filter === 'all' ? 'No bookings yet.' : `No ${filter} bookings.`}
      </Text>
      {filter === 'all' && (
        <>
          <Text style={[s.emptyBody, { color: c.fg2 }]}>
            Browse our services and book a slot — most washes available within 24 hours.
          </Text>
          <TouchableOpacity
            style={ss.primaryBtn}
            onPress={() => router.push('/(customer)/booking')}
          >
            <Text style={ss.primaryBtnText}>Browse Services →</Text>
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
  // card
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
  // empty state
  emptyWrap:  { alignItems: 'center', paddingHorizontal: spacing[8], paddingTop: 60, gap: spacing[4] },
  emptyGlow:  { position: 'absolute', top: 60, width: 140, height: 140, borderRadius: 999, backgroundColor: 'rgba(91,111,82,0.14)' },
  emptyIcon:  { width: 64, height: 64, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: typography.serif, fontSize: 22, letterSpacing: -0.3, textAlign: 'center' },
  emptyBody:  { fontFamily: typography.sans, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 260 },
});
