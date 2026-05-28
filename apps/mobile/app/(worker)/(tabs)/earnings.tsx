import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IndianRupee } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import { Group, Row } from '../../../components/RowGroup';

const DAYS: [string, number][] = [
  ['MON', 1800], ['TUE', 2200], ['WED', 2600], ['THU', 1400],
  ['FRI', 3100], ['SAT', 3800], ['SUN', 2140],
];

const BREAKDOWN = [
  ['Exterior Wash',    '9 JOBS', '₹4,500'],
  ['Premium Wash',     '7 JOBS', '₹8,400'],
  ['Interior Detail',  '5 JOBS', '₹2,500'],
  ['Coating',          '2 JOBS', '₹1,640'],
];

const maxVal = Math.max(...DAYS.map(d => d[1]));
const total  = DAYS.reduce((s, d) => s + d[1], 0);

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const ss = useSharedStyles();

  const s = StyleSheet.create({
    root:       { flex: 1, backgroundColor: c.ink },
    topSection: { paddingHorizontal: spacing[5], paddingBottom: spacing[4], gap: 4 },
    total: { fontFamily: typography.serif, fontSize: 30, color: c.fg, letterSpacing: -0.3 },
    sub:   { fontFamily: typography.sans,  fontSize: 13, color: c.fg2 },

    chartCard: {
      marginHorizontal: spacing[5],
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, padding: spacing[4], marginBottom: spacing[2],
    },
    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 140, marginTop: spacing[3] },
    chartCol:        { flex: 1, alignItems: 'center', gap: 8 },
    chartBarWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end' },
    chartBar:        { width: '100%', borderRadius: 4 },
    chartLabel:      { fontFamily: typography.mono, fontSize: 9, color: c.fg3 },
    chartLabelToday: { color: c.fg },
  });

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.topSection, { paddingTop: insets.top + 12 }]}>
        <Text style={ss.eyebrow}>[EARNINGS]</Text>
        <Text style={s.total}>₹{total.toLocaleString('en-IN')}</Text>
        <Text style={s.sub}>This week · 23 jobs completed</Text>
      </View>

      {/* Chart */}
      <View style={s.chartCard}>
        <Text style={ss.eyebrow}>[7-DAY EARNINGS]</Text>
        <View style={s.chart}>
          {DAYS.map(([day, val]) => {
            const h = (val / maxVal) * 120;
            const isToday = day === 'SUN';
            return (
              <View key={day} style={s.chartCol}>
                <View style={s.chartBarWrapper}>
                  <View style={[
                    s.chartBar,
                    { height: h, backgroundColor: isToday ? c.sage : c.lineStrong },
                    !isToday && { borderWidth: 1, borderColor: c.line },
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
            iconBg={c.cardHi}
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
            { id: 't1', title: 'Payout to HDFC Bank',     sub: 'Completed · 12:45 PM', amt: '-₹4,200', isDebit: true  },
            { id: 't2', title: 'Earnings for PC-2052',    sub: 'Exterior Wash',         amt: '+₹800',   isDebit: false },
            { id: 't3', title: 'Earnings for PC-2051',    sub: 'Interior Detailing',    amt: '+₹1,200', isDebit: false },
            { id: 't4', title: 'Customer Tip',            sub: 'Job PC-2049',           amt: '+₹100',   isDebit: false },
          ].map((tx, i, arr) => (
            <Row
              key={tx.id}
              title={tx.title}
              sub={tx.sub}
              value={
                <Text style={{ fontFamily: typography.sansSemiBold, fontSize: 14, color: tx.isDebit ? c.fg : c.success }}>
                  {tx.amt}
                </Text>
              }
              onPress={() => {}}
              isLast={i === arr.length - 1}
            />
          ))}
        </Group>
      </View>
    </ScrollView>
  );
}
