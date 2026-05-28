import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

type TxType = 'in' | 'out';

interface Transaction {
  type: TxType;
  amt: number;
  label: string;
  date: string;
}

const TRANSACTIONS: Transaction[] = [
  { type: 'in',  amt: 200, label: 'Referral · Priya joined',     date: '24 May' },
  { type: 'in',  amt: 200, label: 'Referral · Karan joined',     date: '18 May' },
  { type: 'out', amt: 120, label: 'Applied · Booking #PC-2041',  date: '22 May' },
  { type: 'in',  amt: 200, label: 'Referral · Meera joined',     date: '02 May' },
  { type: 'out', amt: 300, label: 'Applied · Booking #PC-1992',  date: '14 May' },
];

const BALANCE = 600;

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    cardWrap: { paddingHorizontal: spacing[5], paddingBottom: spacing[1] },
    balanceCard: {
      borderRadius: radii.lg,
      padding: 22,
      backgroundColor: c.sage,
      overflow: 'hidden',
    },
    balanceLabel: {
      fontFamily: typography.mono,
      fontSize: 10,
      letterSpacing: 0.8,
      color: 'rgba(255,255,255,0.65)',
      textTransform: 'uppercase',
    },
    balanceAmount: {
      fontFamily: typography.serif,
      fontSize: 52,
      color: '#fff',
      letterSpacing: -0.5,
      lineHeight: 58,
      marginTop: 4,
    },
    balanceSub: {
      fontFamily: typography.sans,
      fontSize: 13,
      color: 'rgba(255,255,255,0.75)',
      marginTop: 6,
    },
    cardActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 18,
    },
    primaryAction: {
      flex: 1,
      backgroundColor: c.warm,
      borderRadius: radii.sm,
      paddingVertical: 11,
      alignItems: 'center',
    },
    primaryActionText: {
      fontFamily: typography.sansSemiBold,
      fontSize: 13,
      color: c.ink,
      letterSpacing: 0.2,
    },
    ghostAction: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.25)',
      borderRadius: radii.sm,
      paddingVertical: 11,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    ghostActionText: {
      fontFamily: typography.sansSemiBold,
      fontSize: 13,
      color: '#fff',
      letterSpacing: 0.2,
    },
    txAmt: {
      fontFamily: typography.serif,
      fontSize: 17,
    },
  });

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Credits" />
      </View>

      {/* Balance card */}
      <View style={s.cardWrap}>
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>[YOUR BALANCE]</Text>
          <Text style={s.balanceAmount}>₹{BALANCE.toLocaleString('en-IN')}</Text>
          <Text style={s.balanceSub}>
            Auto-applies to your next booking · No expiry
          </Text>
          <View style={s.cardActions}>
            <TouchableOpacity style={s.primaryAction} activeOpacity={0.8}>
              <Text style={s.primaryActionText}>Refer & earn ₹200</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostAction} activeOpacity={0.8}>
              <Text style={s.ghostActionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Transaction history */}
      <Group header="Recent">
        {TRANSACTIONS.map((t, i) => (
          <Row
            key={i}
            icon={
              t.type === 'in'
                ? <ArrowDown size={14} color="#fff" strokeWidth={2.5} />
                : <ArrowUp   size={14} color="#fff" strokeWidth={2.5} />
            }
            iconBg={t.type === 'in' ? c.success : c.fg3}
            title={t.label}
            sub={t.date}
            value={
              <Text style={[s.txAmt, { color: t.type === 'in' ? c.success : c.fg }]}>
                {t.type === 'in' ? '+' : '−'}₹{t.amt}
              </Text>
            }
            isLast={i === TRANSACTIONS.length - 1}
          />
        ))}
      </Group>
    </ScrollView>
  );
}
