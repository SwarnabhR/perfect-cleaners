import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { Worker } from '@pc/firebase';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';
import { Group, Row } from '../../../components/RowGroup';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Monday of the current week at midnight local time
function startOfWeek(): Date {
  const d   = new Date();
  const dow = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(): string {
  const mon = startOfWeek();
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

interface DayBar { day: string; amt: number; jobs: number }

export default function EarningsTab() {
  const insets = useSafeAreaInsets();
  const c      = useThemeColors();
  const ss     = useSharedStyles();

  const [worker,  setWorker]  = useState<Worker | null>(null);
  const [bars,    setBars]    = useState<DayBar[]>(DAY_LABELS.map(day => ({ day, amt: 0, jobs: 0 })));
  const [loading, setLoading] = useState(true);

  const uid = auth().currentUser?.uid;

  // Live worker doc → summary totals
  useEffect(() => {
    if (!uid) return;
    return firestore()
      .collection('workers')
      .doc(uid)
      .onSnapshot(snap => {
        if (snap.exists()) setWorker(snap.data() as Worker);
        setLoading(false);
      }, () => setLoading(false));
  }, [uid]);

  // Done bookings this week → daily bar chart
  useEffect(() => {
    if (!uid) return;
    const weekStart = firestore.Timestamp.fromDate(startOfWeek());
    return firestore()
      .collection('bookings')
      .where('workerId',    '==', uid)
      .where('status',      '==', 'done')
      .where('completedAt', '>=', weekStart)
      .onSnapshot(snap => {
        const totals: Record<number, { amt: number; jobs: number }> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          const at: Date = data.completedAt?.toDate?.() ?? new Date();
          // getDay() → 0=Sun…6=Sat; convert to 0=Mon…6=Sun
          const idx = (at.getDay() + 6) % 7;
          if (!totals[idx]) totals[idx] = { amt: 0, jobs: 0 };
          totals[idx].amt  += data.priceBreakdown?.total ?? 0;
          totals[idx].jobs += 1;
        });
        setBars(DAY_LABELS.map((day, i) => ({
          day,
          amt:  totals[i]?.amt  ?? 0,
          jobs: totals[i]?.jobs ?? 0,
        })));
      });
  }, [uid]);

  const weekEarned = worker?.earnings?.week  ?? 0;
  const monthEarned= worker?.earnings?.month ?? 0;
  const todayEarned= worker?.earnings?.today ?? 0;
  const totalJobs  = worker?.totalJobs        ?? 0;
  const weekJobs   = bars.reduce((s, b) => s + b.jobs, 0);
  const avgPerJob  = weekJobs > 0 ? Math.round(weekEarned / weekJobs) : 0;
  const barMax     = Math.max(...bars.map(b => b.amt), 1);

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
        <Text style={ss.eyebrow}>[THIS WEEK] · {weekLabel().toUpperCase()}</Text>
        <Text style={[ss.pageTitle, { color: c.fg }]}>Earnings.</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.fg3} />
      ) : (
        <>
          {/* Summary pills */}
          <View style={s.pills}>
            {[
              { label: 'This week',  value: `₹${weekEarned.toLocaleString('en-IN')}` },
              { label: 'Jobs done',  value: String(weekJobs) },
              { label: 'Avg / job',  value: avgPerJob > 0 ? `₹${avgPerJob.toLocaleString('en-IN')}` : '—' },
            ].map(({ label, value }) => (
              <View key={label} style={[s.pill, { backgroundColor: c.card, borderColor: c.line }]}>
                <Text style={[s.pillLabel, { color: c.fg3 }]}>{label}</Text>
                <Text style={[s.pillValue, { color: c.fg }]}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Bar chart — this week daily breakdown */}
          <View style={s.chartSection}>
            <Text style={ss.eyebrow}>[DAILY BREAKDOWN]</Text>
            <View style={[s.chartCard, { backgroundColor: c.card, borderColor: c.line }]}>
              <View style={s.bars}>
                {bars.map(d => {
                  const h = Math.max(Math.round((d.amt / barMax) * 100), d.amt > 0 ? 4 : 0);
                  return (
                    <View key={d.day} style={s.barCol}>
                      {d.amt > 0 && (
                        <Text style={[s.barAmt, { color: c.fg2 }]}>
                          {d.amt >= 1000 ? `₹${(d.amt / 1000).toFixed(1)}k` : `₹${d.amt}`}
                        </Text>
                      )}
                      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                        <View style={[s.barFill, { height: h, backgroundColor: d.amt > 0 ? c.sage : c.lineFaint }]} />
                      </View>
                      <Text style={[s.barDay, { color: c.fg3 }]}>{d.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Lifetime stats */}
          <Group header="All time">
            <Row title="Total jobs"     value={String(totalJobs)} />
            <Row title="This month"     value={`₹${monthEarned.toLocaleString('en-IN')}`} />
            <Row title="Today"          value={`₹${todayEarned.toLocaleString('en-IN')}`} isLast />
          </Group>

          {/* Incentive */}
          <Group header="Incentives">
            <Row
              icon={<TrendingUp size={14} color={c.sageHi} strokeWidth={1.5} />}
              title="Top Performer Bonus"
              sub="Complete 10 jobs this week for ₹500 extra"
              value={
                <Text style={{ fontFamily: typography.mono, fontSize: 10, color: c.sageHi }}>
                  {weekJobs}/10
                </Text>
              }
              isLast
            />
          </Group>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  titleRow:     { paddingHorizontal: spacing[5], paddingBottom: spacing[3], gap: spacing[1] },
  pills:        { flexDirection: 'row', paddingHorizontal: spacing[5], gap: spacing[2], marginBottom: spacing[1] },
  pill:         { flex: 1, borderWidth: 1, borderRadius: radii.md, padding: spacing[3], gap: 4 },
  pillLabel:    { fontFamily: typography.mono, fontSize: 9.5, letterSpacing: 0.6 },
  pillValue:    { fontFamily: typography.serif, fontSize: 22, letterSpacing: -0.3 },
  chartSection: { paddingHorizontal: spacing[5], gap: spacing[2], marginBottom: spacing[1] },
  chartCard:    { borderWidth: 1, borderRadius: radii.md, padding: spacing[4] },
  bars:         { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120 },
  barCol:       { flex: 1, alignItems: 'center', gap: 4, height: '100%' },
  barAmt:       { fontFamily: typography.mono, fontSize: 7.5, letterSpacing: 0.3, textAlign: 'center' },
  barFill:      { width: '100%', borderRadius: radii.xs },
  barDay:       { fontFamily: typography.mono, fontSize: 9.5, letterSpacing: 0.6 },
});
