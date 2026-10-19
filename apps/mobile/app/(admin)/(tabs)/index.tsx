import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import AdminScreen from '../../../components/AdminScreen';
import { useThemeColors } from '../../../theme';
import {
  BUCKET_LABELS, dateLabel, dayBucket, firstSlot, formatClock, toDate,
  type DayBucket, type LiveSession,
} from '../../../lib/sessions';

const BUCKET_ORDER: DayBucket[] = ['overdue', 'today', 'tomorrow', 'later'];

export default function ScheduleScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const [open, setOpen] = useState<LiveSession[]>([]);
  const [todays, setTodays] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Not-yet-done sessions (including overdue ones that never started).
  useEffect(() => {
    return firestore().collection('cleaningSessions').where('status', 'in', ['scheduled', 'inprogress']).onSnapshot(
      snap => {
        setOpen(snap.docs.map(d => ({ id: d.id, ...d.data() }) as LiveSession));
        setError('');
        setLoading(false);
      },
      err => { setError(err.message); setLoading(false); },
    );
  }, []);

  // Every session dated today, so towers that finished (done/missed) still show.
  useEffect(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    return firestore().collection('cleaningSessions')
      .where('scheduledDate', '>=', start).where('scheduledDate', '<', end)
      .onSnapshot(
        snap => setTodays(snap.docs.map(d => ({ id: d.id, ...d.data() }) as LiveSession)),
        err => setError(err.message),
      );
  }, []);

  const buckets = useMemo(() => {
    const byId = new Map<string, LiveSession>();
    [...open, ...todays].forEach(s => byId.set(s.id, s));
    const now = new Date();
    const out: Record<DayBucket, LiveSession[]> = { overdue: [], today: [], tomorrow: [], later: [] };
    byId.forEach(s => out[dayBucket(toDate(s.scheduledDate), now)].push(s));
    BUCKET_ORDER.forEach(b => out[b].sort((x, y) =>
      toDate(x.scheduledDate).getTime() - toDate(y.scheduledDate).getTime()
      || (firstSlot(x) ?? 99) - (firstSlot(y) ?? 99)
      || `${x.societyName}${x.tower}`.localeCompare(`${y.societyName}${y.tower}`)));
    return out;
  }, [open, todays]);

  const todayList = buckets.today;
  const todayTotal = todayList.reduce((n, s) => n + (s.totalCars ?? 0), 0);
  const todayDone = todayList.reduce((n, s) => n + (s.completedCars ?? 0), 0);

  const statusColor = (s: LiveSession) =>
    s.status === 'done' ? c.success : s.status === 'inprogress' ? c.warning : s.status === 'missed' ? c.danger : c.fg3;
  const statusLabel = (s: LiveSession) =>
    s.status === 'inprogress' ? 'IN PROGRESS' : s.status === 'done' ? 'DONE' : s.status === 'missed' ? 'MISSED' : 'SCHEDULED';

  return (
    <AdminScreen eyebrow="[ADMIN] [01]" title="Schedule">
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing[8] }} color={c.fg3} />
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {error ? <Text style={[s.note, { color: c.danger }]}>{error}</Text> : null}

          <View style={[s.summary, { backgroundColor: c.card, borderColor: c.line }]}>
            <Text style={[s.mono, { color: c.fg3 }]}>TODAY · ALL TOWERS</Text>
            <Text style={[s.big, { color: c.fg }]}>{todayDone}<Text style={{ color: c.fg3 }}> / {todayTotal} cars</Text></Text>
            <Bar value={todayTotal ? todayDone / todayTotal : 0} fill={c.sage} track={c.line} />
            <Text style={[s.mono, { color: c.fg3 }]}>{todayList.length} TOWER SESSION{todayList.length === 1 ? '' : 'S'}</Text>
          </View>

          {BUCKET_ORDER.map(bucket => buckets[bucket].length === 0 ? null : (
            <View key={bucket} style={{ gap: spacing[3] }}>
              <Text style={[s.mono, { color: bucket === 'overdue' ? c.danger : c.fg3, marginTop: spacing[2] }]}>
                {BUCKET_LABELS[bucket]} · {buckets[bucket].length}
              </Text>
              {buckets[bucket].map(sess => {
                const slot = firstSlot(sess);
                const total = sess.totalCars ?? 0;
                const done = sess.completedCars ?? 0;
                const workers = (sess.workerNames ?? []).filter(Boolean);
                return (
                  <TouchableOpacity
                    key={sess.id}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/(admin)/session/[id]', params: { id: sess.id } })}
                    style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}
                  >
                    <View style={s.rowBetween}>
                      <Text style={[s.name, { color: c.fg }]} numberOfLines={1}>{sess.societyName} · {sess.tower}</Text>
                      <Text style={[s.mono, { color: statusColor(sess) }]}>{statusLabel(sess)}</Text>
                    </View>
                    <Text style={[s.meta, { color: c.fg2 }]}>
                      {dateLabel(toDate(sess.scheduledDate))}{slot !== null ? ` · from ${formatClock(slot)}` : ''}
                      {sess.sessionType === 'deep-clean' ? ' · DEEP CLEAN' : ''}
                    </Text>
                    <Bar value={total ? done / total : 0} fill={sess.status === 'done' ? c.success : c.sage} track={c.line} />
                    <View style={s.rowBetween}>
                      <Text style={[s.meta, { color: c.fg }]}>{done} / {total} cars</Text>
                      <Text style={[s.mono, { color: workers.length ? c.fg3 : c.warning }]} numberOfLines={1}>
                        {workers.length ? workers.join(', ').toUpperCase() : 'NO WORKER ASSIGNED'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {!error && Object.values(buckets).every(b => b.length === 0) ? (
            <Text style={[s.note, { color: c.fg3 }]}>No cleaning sessions scheduled.</Text>
          ) : null}
        </ScrollView>
      )}
    </AdminScreen>
  );
}

function Bar({ value, fill, track }: { value: number; fill: string; track: string }) {
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ height: 6, width: `${Math.min(Math.max(value, 0), 1) * 100}%`, backgroundColor: fill }} />
    </View>
  );
}

const s = StyleSheet.create({
  list:       { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  note:       { fontFamily: typography.sans, fontSize: 14, textAlign: 'center', marginTop: spacing[6] },
  summary:    { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: spacing[2] },
  big:        { fontFamily: typography.sansSemiBold, fontSize: 28 },
  card:       { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: spacing[2] },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name:       { fontFamily: typography.sansSemiBold, fontSize: 16, flexShrink: 1 },
  meta:       { fontFamily: typography.sans, fontSize: 13 },
  mono:       { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8, flexShrink: 1 },
});
