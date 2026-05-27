import {
  ScrollView, View, Text, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '@pc/tokens';
import { Group, Row } from '../../../components/RowGroup';
import { IndianRupee } from 'lucide-react-native';

const DAYS: [string, number][] = [
  ['MON', 1800], ['TUE', 2200], ['WED', 2600], ['THU', 1400],
  ['FRI', 3100], ['SAT', 3800], ['SUN', 2140],
];

const BREAKDOWN = [
  ['Exterior Wash', '9 JOBS', '₹4,500'],
  ['Premium Wash', '7 JOBS', '₹8,400'],
  ['Interior Detail', '5 JOBS', '₹2,500'],
  ['Coating', '2 JOBS', '₹1,640'],
];

const maxVal = Math.max(...DAYS.map(d => d[1]));
const total = DAYS.reduce((s, d) => s + d[1], 0);

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.topSection, { paddingTop: insets.top + 12 }]}>
        <Text style={s.eyebrow}>[EARNINGS]</Text>
        <Text style={s.total}>₹{total.toLocaleString('en-IN')}</Text>
        <Text style={s.sub}>This week · 23 jobs completed</Text>
      </View>

      {/* Chart */}
      <View style={s.chartCard}>
        <Text style={s.eyebrow}>[7-DAY EARNINGS]</Text>
        <View style={s.chart}>
          {DAYS.map(([day, val]) => {
            const h = (val / maxVal) * 120;
            const isToday = day === 'SUN';
            return (
              <View key={day} style={s.chartCol}>
                <View style={s.chartBarWrapper}>
                  <View style={[
                    s.chartBar,
                    { height: h, backgroundColor: isToday ? colors.sage : 'rgba(255,255,255,0.12)' },
                    !isToday && { borderWidth: 1, borderColor: colors.line },
                  ]} />
                </View>
                <Text style={[s.chartLabel, isToday && s.chartLabelToday]}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Breakdown */}
      <Group header="BREAKDOWN BY SERVICE">
        {BREAKDOWN.map(([name, count, amt], i) => (
          <Row
            key={name}
            icon={<IndianRupee size={15} color="#fff" />}
            iconBg={colors.cardHi}
            title={name}
            sub={count}
            value={amt}
            onPress={() => {}}
            isLast={i === BREAKDOWN.length - 1}
          />
        ))}
      </Group>

      {/* Transactions */}
      <View style={{ marginTop: 24 }}>
        <Group header="RECENT TRANSACTIONS">
          {[
            { id: 't1', title: 'Payout to HDFC Bank', sub: 'Completed · 12:45 PM', amt: '-₹4,200', isDebit: true },
            { id: 't2', title: 'Earnings for PC-2052', sub: 'Exterior Wash', amt: '+₹800', isDebit: false },
            { id: 't3', title: 'Earnings for PC-2051', sub: 'Interior Detailing', amt: '+₹1,200', isDebit: false },
            { id: 't4', title: 'Customer Tip', sub: 'Job PC-2049', amt: '+₹100', isDebit: false },
          ].map((t, i, arr) => (
            <Row
              key={t.id}
              title={t.title}
              sub={t.sub}
              value={<Text style={{ fontFamily: typography.sansSemiBold, fontSize: 14, color: t.isDebit ? colors.fg : colors.success }}>{t.amt}</Text>}
              onPress={() => {}}
              isLast={i === arr.length - 1}
            />
          ))}
        </Group>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  topSection: { paddingHorizontal: spacing[5], paddingBottom: spacing[4], gap: 4 },
  eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
  total: { fontFamily: typography.serif, fontSize: 30, color: colors.fg, letterSpacing: -0.3 },
  sub: { fontFamily: typography.sans, fontSize: 13, color: colors.fg2 },

  chartCard: {
    marginHorizontal: spacing[5],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: spacing[4],
    marginBottom: spacing[2],
  },
  chart: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 140, marginTop: spacing[3],
  },
  chartCol: { flex: 1, alignItems: 'center', gap: 8 },
  chartBarWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: {
    width: '100%', borderRadius: 4,
  },
  chartLabel: { fontFamily: typography.mono, fontSize: 9, color: colors.fg3 },
  chartLabelToday: { color: '#fff' },
});
