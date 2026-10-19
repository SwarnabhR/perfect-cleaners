import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Linking, RefreshControl,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Phone } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import AdminScreen from '../../../components/AdminScreen';
import { useThemeColors } from '../../../theme';
import { formatClock } from '../../../lib/sessions';

type Segment = 'customers' | 'workers';
type StatusFilter = 'active' | 'pending' | 'paused' | 'inactive';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LIMIT = 500;

interface Resident {
  id: string; customerName?: string; customerPhone?: string; societyName?: string; tower?: string;
  unitNumber?: string; parkingNumber?: string; parkingLevel?: string;
  cars?: { plate: string; make: string; model: string; category?: string }[];
  preferredCleaningTime?: number; preferredCleaningDays?: number[];
  status?: string; paymentStatus?: string; monthlyFee?: number; tier?: string;
}
interface WorkerRow {
  id: string; name?: string; phone?: string; isOnline?: boolean; rating?: number; totalJobs?: number;
  carsCompletedToday?: number; assignedSocietyIds?: string[]; assignedSocietyNames?: string[]; assignedSocietyName?: string;
}

export default function PeopleScreen() {
  const c = useThemeColors();
  const [segment, setSegment] = useState<Segment>('customers');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  // Residents can run to thousands of docs, so they are fetched once per status
  // (pull to refresh) rather than held open as a live listener.
  const loadResidents = useCallback(async (st: StatusFilter) => {
    try {
      const snap = await firestore().collection('customerSocietyRecords').where('status', '==', st).limit(LIMIT).get();
      setResidents(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Resident));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load customers.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadResidents(status).finally(() => setLoading(false));
  }, [status, loadResidents]);

  useEffect(() => {
    return firestore().collection('workers').onSnapshot(
      snap => setWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() }) as WorkerRow)
        .sort((a, b) => Number(Boolean(b.isOnline)) - Number(Boolean(a.isOnline)) || (a.name ?? '').localeCompare(b.name ?? ''))),
      err => setError(err.message),
    );
  }, []);

  const q = search.trim().toLowerCase();
  const match = (...vals: (string | undefined)[]) => !q || vals.some(v => (v ?? '').toLowerCase().includes(q));

  const shownResidents = residents
    .filter(r => match(r.customerName, r.customerPhone, r.societyName, r.tower, r.unitNumber, ...(r.cars ?? []).map(x => x.plate)))
    .sort((a, b) => (a.customerName ?? '').localeCompare(b.customerName ?? ''));
  const shownWorkers = workers.filter(w => match(w.name, w.phone));

  const callBtn = (phone?: string, name?: string) => phone ? (
    <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)} style={s.call} accessibilityLabel={`Call ${name ?? ''}`}>
      <Phone size={16} color={c.info} strokeWidth={1.5} />
    </TouchableOpacity>
  ) : null;

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      style={[s.chip, { borderColor: active ? c.sage : c.line, backgroundColor: active ? c.sageFaint : 'transparent' }]}
    >
      <Text style={[s.chipText, { color: active ? c.fg : c.fg2 }]}>{label.toUpperCase()}</Text>
    </TouchableOpacity>
  );

  const header = (
    <View style={{ gap: spacing[3] }}>
      <View style={s.chips}>
        {chip(`Customers`, segment === 'customers', () => setSegment('customers'))}
        {chip(`Workers · ${workers.length}`, segment === 'workers', () => setSegment('workers'))}
      </View>
      {segment === 'customers' ? (
        <View style={s.chips}>
          {(['active', 'pending', 'paused', 'inactive'] as StatusFilter[]).map(st => chip(st, status === st, () => setStatus(st)))}
        </View>
      ) : null}
      <TextInput
        style={[s.input, { backgroundColor: c.card, borderColor: c.lineStrong, color: c.fg }]}
        value={search}
        onChangeText={setSearch}
        placeholder={segment === 'customers' ? 'Search name, phone, flat, plate' : 'Search name or phone'}
        placeholderTextColor={c.fg4}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {segment === 'customers' ? (
        <Text style={[s.mono, { color: c.fg3 }]}>
          {shownResidents.length} SHOWN{residents.length >= LIMIT ? ` · FIRST ${LIMIT} ONLY, USE SEARCH` : ''}
        </Text>
      ) : null}
      {error ? <Text style={[s.note, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );

  return (
    <AdminScreen eyebrow="[ADMIN] [04]" title="People">
      {loading && segment === 'customers' ? (
        <ActivityIndicator style={{ marginTop: spacing[8] }} color={c.fg3} />
      ) : segment === 'customers' ? (
        <FlatList
          data={shownResidents}
          keyExtractor={r => r.id}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={<Text style={[s.note, { color: c.fg3 }]}>No customers found.</Text>}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={c.fg3}
              onRefresh={async () => { setRefreshing(true); await loadResidents(status); setRefreshing(false); }}
            />
          }
          renderItem={({ item: r }) => {
            const open = openId === r.id;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOpenId(open ? null : r.id)}
                style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}
              >
                <View style={s.rowBetween}>
                  <Text style={[s.name, { color: c.fg }]} numberOfLines={1}>{r.customerName || '—'}</Text>
                  {callBtn(r.customerPhone, r.customerName)}
                </View>
                <Text style={[s.meta, { color: c.fg2 }]}>
                  {[r.societyName, r.tower, r.unitNumber && `Flat ${r.unitNumber}`].filter(Boolean).join(' · ')}
                </Text>
                <Text style={[s.mono, { color: c.fg3 }]}>
                  {(r.cars?.length ?? 0)} VEHICLE{r.cars?.length === 1 ? '' : 'S'}
                  {r.paymentStatus ? ` · ${r.paymentStatus.replace(/_/g, ' ').toUpperCase()}` : ''}
                </Text>
                {open ? (
                  <View style={[s.detail, { borderTopColor: c.line }]}>
                    {(r.cars ?? []).map(car => (
                      <Text key={car.plate} style={[s.meta, { color: c.fg }]}>
                        {car.make} {car.model} · {car.plate}{car.category === 'two-wheeler' ? ' · 2W' : ''}
                      </Text>
                    ))}
                    <Text style={[s.meta, { color: c.fg2 }]}>
                      {[r.parkingLevel, r.parkingNumber].filter(Boolean).join(' · ') || 'No parking recorded'}
                    </Text>
                    <Text style={[s.meta, { color: c.fg2 }]}>
                      {typeof r.preferredCleaningTime === 'number' ? formatClock(r.preferredCleaningTime) : '—'}
                      {' · '}
                      {r.preferredCleaningDays?.length ? [...r.preferredCleaningDays].sort().map(d => DAY_LABELS[d]).join(', ') : 'All tower days'}
                    </Text>
                    <Text style={[s.meta, { color: c.fg2 }]}>
                      {typeof r.monthlyFee === 'number' ? `₹${r.monthlyFee.toLocaleString('en-IN')} / ${r.tier ?? 'standard'}` : ''}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          data={shownWorkers}
          keyExtractor={w => w.id}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={<Text style={[s.note, { color: c.fg3 }]}>No workers found.</Text>}
          renderItem={({ item: w }) => {
            const societies = w.assignedSocietyNames?.length ? w.assignedSocietyNames : w.assignedSocietyName ? [w.assignedSocietyName] : [];
            return (
              <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
                <View style={s.rowBetween}>
                  <View style={s.nameRow}>
                    <View style={[s.dot, { backgroundColor: w.isOnline ? c.success : c.fg4 }]} />
                    <Text style={[s.name, { color: c.fg }]} numberOfLines={1}>{w.name || '—'}</Text>
                  </View>
                  {callBtn(w.phone, w.name)}
                </View>
                <Text style={[s.mono, { color: w.isOnline ? c.success : c.fg3 }]}>{w.isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
                <Text style={[s.meta, { color: c.fg2 }]}>
                  {societies.length ? societies.join(', ') : 'No society assigned'}
                </Text>
                <Text style={[s.mono, { color: c.fg3 }]}>
                  {w.carsCompletedToday ?? 0} CARS TODAY · {w.totalJobs ?? 0} JOBS · {typeof w.rating === 'number' ? `${w.rating.toFixed(1)}★` : 'NO RATING'}
                </Text>
              </View>
            );
          }}
        />
      )}
    </AdminScreen>
  );
}

const s = StyleSheet.create({
  list:       { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  note:       { fontFamily: typography.sans, fontSize: 14, textAlign: 'center', marginTop: spacing[4] },
  card:       { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  name:       { fontFamily: typography.sansSemiBold, fontSize: 16, flexShrink: 1 },
  meta:       { fontFamily: typography.sans, fontSize: 13 },
  mono:       { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8, flexShrink: 1 },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  chipText:   { fontFamily: typography.mono, fontSize: 11, letterSpacing: 0.8 },
  input:      { borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: spacing[3], height: 48, fontFamily: typography.sans, fontSize: 14 },
  call:       { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  detail:     { borderTopWidth: 1, marginTop: spacing[2], paddingTop: spacing[2], gap: 4 },
});
