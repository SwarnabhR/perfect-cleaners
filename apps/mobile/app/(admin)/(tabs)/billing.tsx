import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Alert, Linking,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Phone } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import AdminScreen from '../../../components/AdminScreen';
import { useThemeColors } from '../../../theme';
import { postOrQueue } from '../../../lib/outbox';
import { useConnectivity } from '../../../lib/connectivity';
import { toDate } from '../../../lib/sessions';

type Segment = 'society' | 'balances' | 'history';

interface SocietyDue {
  id: string; customerId: string; customerName: string; customerPhone?: string;
  societyName?: string; tower?: string; unitNumber?: string; amountDue: number; paymentStatus: string;
  cars?: { category?: string }[];
}
interface BalanceDue { id: string; name: string; phone?: string; amount: number; societyName?: string; unitNumber?: string }
interface PaymentRow { id: string; customerName: string; amount: number; type?: string; paidAt?: unknown }

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function BillingScreen() {
  const c = useThemeColors();
  const { refreshPending } = useConnectivity();
  const [segment, setSegment] = useState<Segment>('society');
  const [societyDues, setSocietyDues] = useState<SocietyDue[]>([]);
  const [balances, setBalances] = useState<BalanceDue[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    const fail = (err: Error) => { setError(err.message); setLoading(false); };
    const db = firestore();
    const unsubs = [
      db.collection('customerSocietyRecords').where('status', '==', 'active').onSnapshot(snap => {
        setSocietyDues(snap.docs
          .map(d => {
            const x = d.data();
            return {
              id: d.id, customerId: x.customerId ?? '', customerName: x.customerName ?? '—', customerPhone: x.customerPhone,
              societyName: x.societyName, tower: x.tower, unitNumber: x.unitNumber,
              cars: (x.cars ?? []) as { category?: string }[],
              amountDue: x.pendingAmount ?? x.monthlyFee ?? 0, paymentStatus: x.paymentStatus ?? 'not_verified',
            } as SocietyDue;
          })
          .filter(r => r.paymentStatus !== 'paid' && r.amountDue > 0)
          .sort((a, b) => b.amountDue - a.amountDue));
        setLoading(false);
      }, fail),
      db.collection('customers').where('outstandingBalance', '>', 0).orderBy('outstandingBalance', 'desc').limit(300).onSnapshot(snap => {
        setBalances(snap.docs.map(d => {
          const x = d.data();
          return { id: d.id, name: x.name ?? '—', phone: x.phone, amount: x.outstandingBalance ?? 0, societyName: x.societyName, unitNumber: x.unitNumber };
        }));
      }, fail),
      db.collection('paymentLogs').orderBy('paidAt', 'desc').limit(50).onSnapshot(snap => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaymentRow));
      }, fail),
      db.collection('stats').doc('income').onSnapshot(snap => {
        setTotalIncome(Boolean(snap.exists) ? (snap.data()?.totalIncome ?? 0) : 0);
      }, () => {}),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const societyTotal = societyDues.reduce((n, d) => n + d.amountDue, 0);
  const balanceTotal = balances.reduce((n, d) => n + d.amount, 0);
  const todayIncome = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return payments.reduce((n, p) => (p.paidAt && toDate(p.paidAt).getTime() >= start.getTime() ? n + (p.amount ?? 0) : n), 0);
  }, [payments]);

  const q = search.trim().toLowerCase();
  const match = (...vals: (string | undefined)[]) => !q || vals.some(v => (v ?? '').toLowerCase().includes(q));

  function confirmPaid(key: string, name: string, amount: number, body: Record<string, unknown>) {
    if (marking) return;
    Alert.alert('Record payment', `Mark ${inr(amount)} from ${name} as paid? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark paid',
        onPress: async () => {
          setMarking(key);
          try {
            const res = await postOrQueue('/api/admin/record-payment', { ...body, customerName: name, amount });
            if (res.queued) refreshPending();
            // Optimistic — the due is settled (or queued) either way.
            setSocietyDues(prev => prev.filter(d => d.id !== key));
            setBalances(prev => prev.filter(b => b.id !== key));
            if (res.queued) Alert.alert('Saved offline', 'This payment will sync when you are back online.');
          } catch (err) {
            Alert.alert('Could not record payment', err instanceof Error ? err.message : 'Please try again.');
          } finally {
            setMarking(null);
          }
        },
      },
    ]);
  }

  const callBtn = (phone?: string, name?: string) => phone ? (
    <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)} style={s.call} accessibilityLabel={`Call ${name ?? 'customer'}`}>
      <Phone size={16} color={c.info} strokeWidth={1.5} />
    </TouchableOpacity>
  ) : null;

  const paidBtn = (key: string, onPress: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={marking !== null}
      style={[s.btn, { backgroundColor: c.warm, opacity: marking !== null ? 0.5 : 1 }]}
    >
      <Text style={[s.btnText, { color: c.ink }]}>{marking === key ? 'SAVING...' : 'MARK PAID'}</Text>
    </TouchableOpacity>
  );

  const header = (
    <View style={{ gap: spacing[3] }}>
      <View style={[s.summary, { backgroundColor: c.card, borderColor: c.line }]}>
        <Text style={[s.mono, { color: c.fg3 }]}>TOTAL OUTSTANDING</Text>
        <Text style={[s.big, { color: c.fg }]}>{inr(societyTotal + balanceTotal)}</Text>
        <View style={s.rowBetween}>
          <Text style={[s.meta, { color: c.fg2 }]}>Society {inr(societyTotal)}</Text>
          <Text style={[s.meta, { color: c.fg2 }]}>Bookings {inr(balanceTotal)}</Text>
        </View>
        <View style={[s.divider, { backgroundColor: c.line }]} />
        <View style={s.rowBetween}>
          <Text style={[s.meta, { color: c.fg2 }]}>Collected today {inr(todayIncome)}</Text>
          <Text style={[s.meta, { color: c.fg2 }]}>All time {inr(totalIncome)}</Text>
        </View>
      </View>

      <View style={s.chips}>
        {([['society', `Society · ${societyDues.length}`], ['balances', `Bookings · ${balances.length}`], ['history', 'Payments']] as [Segment, string][]).map(([k, label]) => (
          <TouchableOpacity
            key={k}
            onPress={() => setSegment(k)}
            style={[s.chip, { borderColor: segment === k ? c.sage : c.line, backgroundColor: segment === k ? c.sageFaint : 'transparent' }]}
          >
            <Text style={[s.chipText, { color: segment === k ? c.fg : c.fg2 }]}>{label.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {segment !== 'history' ? (
        <TextInput
          style={[s.input, { backgroundColor: c.card, borderColor: c.lineStrong, color: c.fg }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, society, flat"
          placeholderTextColor={c.fg4}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : null}
      {error ? <Text style={[s.note, { color: c.danger }]}>{error}</Text> : null}
    </View>
  );

  const empty = <Text style={[s.note, { color: c.fg3 }]}>{segment === 'history' ? 'No payments yet.' : 'Nothing outstanding.'}</Text>;

  return (
    <AdminScreen eyebrow="[ADMIN] [03]" title="Billing">
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing[8] }} color={c.fg3} />
      ) : segment === 'society' ? (
        <FlatList
          data={societyDues.filter(d => match(d.customerName, d.societyName, d.tower, d.unitNumber))}
          keyExtractor={d => d.id}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          renderItem={({ item: d }) => (
            <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
              <View style={s.rowBetween}>
                <Text style={[s.name, { color: c.fg }]} numberOfLines={1}>{d.customerName}</Text>
                <Text style={[s.amount, { color: c.fg }]}>{inr(d.amountDue)}</Text>
              </View>
              <Text style={[s.meta, { color: c.fg2 }]}>
                {[d.societyName, d.tower, d.unitNumber && `Flat ${d.unitNumber}`].filter(Boolean).join(' · ')}
              </Text>
              <Text style={[s.mono, { color: c.fg3 }]}>
                {(d.cars ?? []).filter(x => (x.category ?? 'car') === 'car').length} CAR · {(d.cars ?? []).filter(x => x.category === 'two-wheeler').length} 2W
              </Text>
              <View style={s.rowBetween}>
                <Text style={[s.mono, { color: c.warning }]}>{d.paymentStatus.replace(/_/g, ' ').toUpperCase()}</Text>
                <View style={s.actions}>
                  {callBtn(d.customerPhone, d.customerName)}
                  {paidBtn(d.id, () => confirmPaid(d.id, d.customerName, d.amountDue, { kind: 'society', recordId: d.id, customerId: d.customerId }))}
                </View>
              </View>
            </View>
          )}
        />
      ) : segment === 'balances' ? (
        <FlatList
          data={balances.filter(b => match(b.name, b.societyName, b.unitNumber))}
          keyExtractor={b => b.id}
          contentContainerStyle={s.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          renderItem={({ item: b }) => (
            <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
              <View style={s.rowBetween}>
                <Text style={[s.name, { color: c.fg }]} numberOfLines={1}>{b.name}</Text>
                <Text style={[s.amount, { color: c.fg }]}>{inr(b.amount)}</Text>
              </View>
              {b.societyName || b.unitNumber ? (
                <Text style={[s.meta, { color: c.fg2 }]}>{[b.societyName, b.unitNumber && `Flat ${b.unitNumber}`].filter(Boolean).join(' · ')}</Text>
              ) : null}
              <View style={[s.actions, { justifyContent: 'flex-end' }]}>
                {callBtn(b.phone, b.name)}
                {paidBtn(b.id, () => confirmPaid(b.id, b.name, b.amount, { kind: 'balance', customerId: b.id }))}
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={p => p.id}
          contentContainerStyle={s.list}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          renderItem={({ item: p }) => (
            <View style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
              <View style={s.rowBetween}>
                <Text style={[s.name, { color: c.fg }]} numberOfLines={1}>{p.customerName || '—'}</Text>
                <Text style={[s.amount, { color: c.success }]}>{inr(p.amount ?? 0)}</Text>
              </View>
              <Text style={[s.mono, { color: c.fg3 }]}>
                {p.paidAt ? toDate(p.paidAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase() : ''}
                {p.type ? ` · ${p.type.replace(/_/g, ' ').toUpperCase()}` : ''}
              </Text>
            </View>
          )}
        />
      )}
    </AdminScreen>
  );
}

const s = StyleSheet.create({
  list:       { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  note:       { fontFamily: typography.sans, fontSize: 14, textAlign: 'center', marginTop: spacing[4] },
  summary:    { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: spacing[2] },
  big:        { fontFamily: typography.sansSemiBold, fontSize: 28 },
  divider:    { height: 1, marginVertical: spacing[1] },
  card:       { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name:       { fontFamily: typography.sansSemiBold, fontSize: 16, flexShrink: 1 },
  amount:     { fontFamily: typography.sansSemiBold, fontSize: 16 },
  meta:       { fontFamily: typography.sans, fontSize: 13 },
  mono:       { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8, flexShrink: 1 },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  chipText:   { fontFamily: typography.mono, fontSize: 11, letterSpacing: 0.8 },
  input:      { borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: spacing[3], height: 48, fontFamily: typography.sans, fontSize: 14 },
  actions:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  call:       { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  btn:        { borderRadius: radii.pill, minHeight: 44, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnText:    { fontFamily: typography.sansSemiBold, fontSize: 12, letterSpacing: 0.6 },
});
