import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';
import { StyleSheet } from 'react-native';

type TxType = 'in' | 'out';

interface Transaction {
  id:    string;
  type:  TxType;
  amt:   number;
  label: string;
  date:  string;
  ts:    number;
}

function toTx(d: FirebaseFirestoreTypes.QueryDocumentSnapshot): Transaction {
  const data = d.data();
  const at: Date = data.createdAt?.toDate?.() ?? new Date();
  return {
    id:    d.id,
    type:  (data.type === 'out' ? 'out' : 'in') as TxType,
    amt:   data.amount ?? 0,
    label: data.label ?? (data.type === 'in' ? 'Credit added' : 'Credit applied'),
    date:  at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    ts:    at.getTime(),
  };
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c  = useThemeColors();
  const ss = useSharedStyles();
  const [balance,      setBalance]      = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubBalance = firestore()
      .collection('customers')
      .doc(user.uid)
      .onSnapshot(
        snap => {
          if (snap.exists()) setBalance(snap.data()?.walletBalance ?? 0);
        },
        err => console.warn('[Wallet] balance:', err.message),
      );

    const unsubTx = firestore()
      .collection('customers')
      .doc(user.uid)
      .collection('transactions')
      .orderBy('createdAt', 'desc')
      .limit(30)
      .onSnapshot(
        snap => setTransactions(snap.docs.map(toTx)),
        err => console.warn('[Wallet] transactions:', err.message),
      );

    return () => { unsubBalance(); unsubTx(); };
  }, []);

  const s = StyleSheet.create({
    cardWrap:          { paddingHorizontal: spacing[5], paddingBottom: spacing[1] },
    balanceCard:       { borderRadius: radii.lg, padding: 22, backgroundColor: c.sage, overflow: 'hidden' },
    balanceAmount:     { fontFamily: typography.serif, fontSize: 52, color: '#fff', letterSpacing: -0.5, lineHeight: 58, marginTop: 4 },
    balanceSub:        { fontFamily: typography.sans, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
    cardActions:       { flexDirection: 'row', gap: 8, marginTop: 18 },
    primaryAction:     { flex: 1, backgroundColor: c.warm, borderRadius: radii.sm, paddingVertical: 11, alignItems: 'center' },
    primaryActionText: { fontFamily: typography.sansSemiBold, fontSize: 13, color: c.ink, letterSpacing: 0.2 },
    ghostAction:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radii.sm, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    ghostActionText:   { fontFamily: typography.sansSemiBold, fontSize: 13, color: '#fff', letterSpacing: 0.2 },
    txAmt:             { fontFamily: typography.serif, fontSize: 17 },
    emptyTx:           { fontFamily: typography.sans, fontSize: 13, color: c.fg3, textAlign: 'center', paddingVertical: spacing[6] },
  });

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Credits" />
      </View>

      <View style={ss.titleSection}>
        <Text style={ss.pageTitle}>Your credits.</Text>
      </View>

      <View style={s.cardWrap}>
        <View style={s.balanceCard}>
          <Text style={ss.eyebrow}>[YOUR BALANCE]</Text>
          <Text style={s.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
          <Text style={s.balanceSub}>Auto-applies to your next booking · No expiry</Text>
          <View style={s.cardActions}>
            <TouchableOpacity
              style={s.primaryAction}
              activeOpacity={0.8}
              onPress={() => router.push('/(customer)/referral')}
            >
              <Text style={s.primaryActionText}>Refer & earn ₹200</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.ghostAction}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  'Credits are non-withdrawable',
                  'PC wallet credits are applied automatically at checkout. They cannot be transferred to a bank account.',
                  [{ text: 'Got it' }],
                )
              }
            >
              <Text style={s.ghostActionText}>How it works</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {transactions.length === 0 ? (
        <Text style={s.emptyTx}>No transactions yet.</Text>
      ) : (
        <Group header="Recent">
          {transactions.map((t, i) => (
            <Row
              key={t.id}
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
              isLast={i === transactions.length - 1}
            />
          ))}
        </Group>
      )}
    </ScrollView>
  );
}
