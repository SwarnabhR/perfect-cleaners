import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { Phone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, radii } from '@pc/tokens';
import type { CleaningSessionCar } from '@pc/firebase';
import BackButton from '../../../components/BackButton';
import { useThemeColors } from '../../../theme';
import { dateLabel, formatClock, toDate, type LiveSession } from '../../../lib/sessions';

type Filter = 'open' | 'done' | 'all';

function carState(car: CleaningSessionCar): 'done' | 'in_progress' | 'pending' | 'unavailable' {
  if (car.status === 'done') return 'done';
  if (car.unavailable || car.status === 'skipped') return 'unavailable';
  return car.status === 'in_progress' ? 'in_progress' : 'pending';
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('open');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!id) return;
    return firestore().collection('cleaningSessions').doc(id).onSnapshot(
      snap => {
        setSession(Boolean(snap.exists) ? ({ id: snap.id, ...snap.data() } as LiveSession) : null);
        setLoading(false);
      },
      err => { setError(err.message); setLoading(false); },
    );
  }, [id]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const order = { in_progress: 0, pending: 1, done: 2, unavailable: 3 } as const;
    return (session?.cars ?? [])
      .map((car, index) => ({ car, index, state: carState(car) }))
      .filter(r => filter === 'all' || (filter === 'done' ? r.state === 'done' : r.state !== 'done'))
      .filter(r => !q || [r.car.carPlate, r.car.customerName, r.car.unitNumber, r.car.parkingNumber, r.car.parkingLevel, r.car.carMake, r.car.carModel]
        .some(v => String(v ?? '').toLowerCase().includes(q)))
      .sort((a, b) => order[a.state] - order[b.state] || a.car.preferredTime - b.car.preferredTime);
  }, [session, filter, search]);

  const stateColor = (s: ReturnType<typeof carState>) =>
    s === 'done' ? c.success : s === 'in_progress' ? c.warning : s === 'unavailable' ? c.fg4 : c.fg3;
  const stateLabel = (s: ReturnType<typeof carState>) =>
    s === 'done' ? 'DONE' : s === 'in_progress' ? 'IN PROGRESS' : s === 'unavailable' ? 'NOT AVAILABLE' : 'PENDING';

  const total = session?.totalCars ?? 0;
  const done = session?.completedCars ?? 0;
  const workers = (session?.workerNames ?? []).filter(Boolean);

  return (
    <View style={[s.root, { backgroundColor: c.ink, paddingTop: insets.top + spacing[2] }]}>
      <View style={s.top}><BackButton /></View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing[8] }} color={c.fg3} />
      ) : !session ? (
        <Text style={[s.note, { color: error ? c.danger : c.fg3 }]}>{error || 'This session no longer exists.'}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={r => `${r.index}-${r.car.carPlate}`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.list, { paddingBottom: spacing[8] + insets.bottom }]}
          ListHeaderComponent={
            <View style={{ gap: spacing[3] }}>
              <View style={{ gap: 4 }}>
                <Text style={[s.mono, { color: c.fg3 }]}>{dateLabel(toDate(session.scheduledDate)).toUpperCase()} · {session.status.toUpperCase()}</Text>
                <Text style={[s.title, { color: c.fg }]}>{session.societyName} · {session.tower}</Text>
                <Text style={[s.meta, { color: c.fg2 }]}>
                  {done} / {total} cars done{(session.skippedCars ?? 0) > 0 ? ` · ${session.skippedCars} skipped` : ''}
                </Text>
                <Text style={[s.mono, { color: workers.length ? c.fg3 : c.warning }]}>
                  {workers.length ? workers.join(', ').toUpperCase() : 'NO WORKER ASSIGNED'}
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: c.line, overflow: 'hidden' }}>
                <View style={{ height: 6, width: `${(total ? Math.min(done / total, 1) : 0) * 100}%`, backgroundColor: c.sage }} />
              </View>
              <TextInput
                style={[s.input, { backgroundColor: c.card, borderColor: c.lineStrong, color: c.fg }]}
                value={search}
                onChangeText={setSearch}
                placeholder="Search plate, flat, name, level"
                placeholderTextColor={c.fg4}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={s.chips}>
                {(['open', 'done', 'all'] as Filter[]).map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[s.chip, { borderColor: filter === f ? c.sage : c.line, backgroundColor: filter === f ? c.sageFaint : 'transparent' }]}
                  >
                    <Text style={[s.chipText, { color: filter === f ? c.fg : c.fg2 }]}>{f.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          ListEmptyComponent={<Text style={[s.note, { color: c.fg3 }]}>No cars match.</Text>}
          renderItem={({ item: { car, state } }) => (
            <View style={[s.card, { backgroundColor: c.card, borderColor: c.line, opacity: state === 'unavailable' ? 0.6 : 1 }]}>
              <View style={s.rowBetween}>
                <Text style={[s.plate, { color: c.fg }]}>{car.carPlate}</Text>
                <Text style={[s.mono, { color: stateColor(state) }]}>{stateLabel(state)}</Text>
              </View>
              <Text style={[s.meta, { color: c.fg2 }]}>{car.carMake} {car.carModel}</Text>
              <Text style={[s.meta, { color: c.fg2 }]}>
                {[car.unitNumber && `Flat ${car.unitNumber}`, car.parkingLevel, car.parkingNumber].filter(Boolean).join(' · ')}
                {car.preferredTime ? `  ·  ${formatClock(car.preferredTime)}` : ''}
              </Text>
              <View style={s.rowBetween}>
                <Text style={[s.meta, { color: c.fg }]} numberOfLines={1}>{car.customerName ?? ''}</Text>
                {car.customerPhone ? (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${car.customerPhone}`)}
                    style={s.call}
                    accessibilityLabel={`Call ${car.customerName ?? 'resident'}`}
                  >
                    <Phone size={16} color={c.info} strokeWidth={1.5} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  top:        { paddingHorizontal: spacing[5] },
  list:       { padding: spacing[5], gap: spacing[3] },
  note:       { fontFamily: typography.sans, fontSize: 14, textAlign: 'center', marginTop: spacing[6] },
  title:      { fontFamily: typography.sansSemiBold, fontSize: 22 },
  meta:       { fontFamily: typography.sans, fontSize: 13 },
  mono:       { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8, flexShrink: 1 },
  input:      { borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: spacing[3], height: 48, fontFamily: typography.sans, fontSize: 14 },
  chips:      { flexDirection: 'row', gap: 8, marginBottom: spacing[1] },
  chip:       { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' },
  chipText:   { fontFamily: typography.mono, fontSize: 11, letterSpacing: 0.8 },
  card:       { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  plate:      { fontFamily: typography.sansSemiBold, fontSize: 16 },
  call:       { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
