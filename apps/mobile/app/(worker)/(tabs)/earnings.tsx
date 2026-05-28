import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';
import { Group, Row } from '../../../components/RowGroup';

const WEEKLY: { day: string; amt: number; jobs: number }[] = [
  { day: 'Mon', amt: 1400, jobs: 4 },
  { day: 'Tue', amt: 2100, jobs: 6 },
  { day: 'Wed', amt: 1750, jobs: 5 },
  { day: 'Thu', amt: 980,  jobs: 3 },
  { day: 'Fri', amt: 2400, jobs: 7 },
  { day: 'Sat', amt: 3200, jobs: 9 },
  { day: 'Sun', amt: 700,  jobs: 2 },
];

const TOTAL     = WEEKLY.reduce((s, d) => s + d.amt,  0);
const TOTAL_JOBS= WEEKLY.reduce((s, d) => s + d.jobs, 0);
const BAR_MAX   = Math.max(...WEEKLY.map(d => d.amt));

export default function EarningsTab() {
  const insets = useSafeAreaInsets();
  const c  = useThemeColors();
  const ss = useSharedStyles();

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
        <Text style={ss.eyebrow}>[THIS WEEK] · 22–28 MAY</Text>
        <Text style={[ss.pageTitle, { color: c.fg }]}>Earnings.</Text>
      </View>

      {/* Summary pills */}
      <View style={s.pills}>
        <View style={[s.pill, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={[s.pillLabel, { color: c.fg3 }]}>Total earned</Text>
          <Text style={[s.pillValue, { color: c.fg }]}>₹{TOTAL.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[s.pill, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={[s.pillLabel, { color: c.fg3 }]}>Jobs done</Text>
          <Text style={[s.pillValue, { color: c.fg }]}>{TOTAL_JOBS}</Text>
        </View>
        <View style={[s.pill, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={[s.pillLabel, { color: c.fg3 }]}>Avg/job</Text>
          <Text style={[s.pillValue, { color: c.fg }]}>₹{Math.round(TOTAL / TOTAL_JOBS)}</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={s.chartSection}>
        <Text style={ss.eyebrow}>[DAILY BREAKDOWN]</Text>
        <View style={[s.chartCard, { backgroundColor: c.card, borderColor: c.line }]}>
          <View style={s.bars}>
            {WEEKLY.map(d => {
              const h = Math.round((d.amt / BAR_MAX) * 100);
              return (
                <View key={d.day} style={s.barCol}>
                  <Text style={[s.barAmt, { color: c.fg2 }]}>₹{(d.amt / 1000).toFixed(1)}k</Text>
                  <View style={[s.barFill, { height: h, backgroundColor: c.sage }]} />
                  <Text style={[s.barDay, { color: c.fg3 }]}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Payout row */}
      <Group header="Payout">
        <Row title="Next payout"   value="₹12,530" sub="Scheduled Mon, 2 Jun" />
        <Row title="Bank account"  value="HDFC ···· 7821" />
        <Row title="UPI ID"        value="rahul@upi" isLast />
      </Group>

      <Group header="Incentives">
        <Row
          icon={<TrendingUp size={14} color={c.sageHi} strokeWidth={1.5} />}
          title="Top Performer Bonus"
          sub="Complete 10 jobs this week for ₹500 extra"
          value={<Text style={{ fontFamily: typography.mono, fontSize: 10, color: c.sageHi }}>7/10</Text>}
          isLast
        />
      </Group>
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
  barCol:       { flex: 1, alignItems: 'center', gap: 4 },
  barAmt:       { fontFamily: typography.mono, fontSize: 8, letterSpacing: 0.3 },
  barFill:      { width: '100%', borderRadius: radii.xs, minHeight: 4 },
  barDay:       { fontFamily: typography.mono, fontSize: 9.5, letterSpacing: 0.6 },
});
