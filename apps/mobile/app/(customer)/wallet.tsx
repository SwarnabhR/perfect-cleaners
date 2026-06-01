import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle2, CreditCard } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

interface WashEntry {
  id:          string;
  label:       string;
  plate:       string;
  societyName: string;
  amount:      number;
  date:        string;
  ts:          number;
  type:        'charge' | 'payment';
}

function toEntry(d: FirebaseFirestoreTypes.QueryDocumentSnapshot): WashEntry {
  const data = d.data();
  const at   = data.createdAt?.toDate?.() ?? new Date();
  return {
    id:          d.id,
    label:       data.label ?? 'Wash',
    plate:       '',
    societyName: data.societyId ?? '',
    amount:      data.amount ?? 0,
    date:        at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    ts:          at.getTime(),
    type:        data.type === 'payment' ? 'payment' : 'charge',
  };
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c      = useThemeColors();
  const ss     = useSharedStyles();

  const [outstanding, setOutstanding] = useState(0);
  const [entries,     setEntries]     = useState<WashEntry[]>([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubBalance = firestore()
      .collection('customers')
      .doc(user.uid)
      .onSnapshot(
        snap => {
          if (snap.exists()) setOutstanding(snap.data()?.outstandingBalance ?? 0);
        },
        err => console.warn('[Wallet] balance:', err.message),
      );

    const unsubTx = firestore()
      .collection('customers')
      .doc(user.uid)
      .collection('transactions')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(
        snap => setEntries(snap.docs.map(toEntry)),
        err => console.warn('[Wallet] transactions:', err.message),
      );

    return () => { unsubBalance(); unsubTx(); };
  }, []);

  function handlePayNow() {
    if (outstanding <= 0) {
      Alert.alert('All clear', 'You have no outstanding balance.');
      return;
    }
    router.push({
      pathname: '/(customer)/payment',
      params: {
        bookingId:  'wallet-settle',
        bookingRef: 'SETTLE',
        amount:     String(outstanding),
        label:      'Settle balance',
        slot:       '',
        name:       '',
        phone:      '',
      },
    });
  }

  const isPaid = outstanding <= 0;

  const s = StyleSheet.create({
    cardWrap:           { paddingHorizontal: spacing[5], paddingBottom: spacing[1] },
    billCard:           { borderRadius: radii.lg, padding: 22, backgroundColor: isPaid ? c.sage : c.card, borderWidth: isPaid ? 0 : 1, borderColor: c.lineStrong, overflow: 'hidden' },
    billAmount:         { fontFamily: typography.serif, fontSize: 52, color: isPaid ? '#fff' : c.fg, letterSpacing: -0.5, lineHeight: 58, marginTop: 4 },
    billSub:            { fontFamily: typography.sans, fontSize: 13, color: isPaid ? 'rgba(255,255,255,0.75)' : c.fg3, marginTop: 6 },
    cardActions:        { flexDirection: 'row', gap: 8, marginTop: 18 },
    primaryAction:      { flex: 1, backgroundColor: c.warm, borderRadius: radii.sm, paddingVertical: 11, alignItems: 'center' },
    primaryActionText:  { fontFamily: typography.sansSemiBold, fontSize: 13, color: c.ink, letterSpacing: 0.2 },
    ghostAction:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: radii.sm, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    ghostActionText:    { fontFamily: typography.sansSemiBold, fontSize: 13, color: '#fff', letterSpacing: 0.2 },
    chargeAmount:       { fontFamily: typography.serif, fontSize: 17, color: c.fg },
    paymentAmount:      { fontFamily: typography.serif, fontSize: 17, color: c.success },
    emptyTx:            { fontFamily: typography.sans, fontSize: 13, color: c.fg3, textAlign: 'center', paddingVertical: spacing[6] },
  });

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Bill" />
      </View>

      <View style={ss.titleSection}>
        <Text style={ss.pageTitle}>Your bill.</Text>
      </View>

      <View style={s.cardWrap}>
        <View style={s.billCard}>
          <Text style={ss.eyebrow}>[OUTSTANDING BALANCE]</Text>
          <Text style={s.billAmount}>₹{outstanding.toLocaleString('en-IN')}</Text>
          <Text style={s.billSub}>
            {isPaid
              ? 'All paid up — nothing outstanding.'
              : 'Added after each wash. Pay anytime.'}
          </Text>
          <View style={s.cardActions}>
            <TouchableOpacity
              style={[s.primaryAction, isPaid && { opacity: 0.5 }]}
              activeOpacity={0.8}
              onPress={handlePayNow}
              disabled={isPaid}
            >
              <Text style={s.primaryActionText}>
                {isPaid ? 'All clear ✓' : 'Pay Now'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.ghostAction}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  'How billing works',
                  'Each wash at your society adds a fixed amount to your outstanding balance. Pay whenever you like — there is no due date. Your car will continue to be cleaned regardless.',
                  [{ text: 'Got it' }],
                )
              }
            >
              <Text style={s.ghostActionText}>How it works</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {entries.length === 0 ? (
        <Text style={s.emptyTx}>No transactions yet.</Text>
      ) : (
        <Group header="Activity">
          {entries.map((entry, i) => (
            <Row
              key={entry.id}
              icon={
                entry.type === 'payment'
                  ? <CreditCard size={14} color="#fff" strokeWidth={2} />
                  : <CheckCircle2 size={14} color="#fff" strokeWidth={2} />
              }
              iconBg={entry.type === 'payment' ? c.success : c.sage}
              title={entry.label}
              sub={entry.date}
              value={
                <Text style={entry.type === 'payment' ? s.paymentAmount : s.chargeAmount}>
                  {entry.type === 'payment' ? '−' : '+'}₹{entry.amount.toLocaleString('en-IN')}
                </Text>
              }
              isLast={i === entries.length - 1}
            />
          ))}
        </Group>
      )}
    </ScrollView>
  );
}
