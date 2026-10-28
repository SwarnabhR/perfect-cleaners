import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Linking, Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Phone } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import type { PendingApproval } from '@pc/firebase';
import AdminScreen from '../../../components/AdminScreen';
import { useThemeColors } from '../../../theme';
import { postOrQueue } from '../../../lib/outbox';
import { useConnectivity } from '../../../lib/connectivity';

type LiveApproval = PendingApproval & { id: string };

const PAYMENT_METHODS = ['phone', 'upi', 'cash', 'card'] as const;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(h: number): string {
  const hour = Math.floor(h);
  const mins = h % 1 ? '30' : '00';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${mins} ${suffix}`;
}

function formatDays(days?: number[]): string {
  if (!days || days.length === 0) return 'All tower days';
  return [...days].sort((a, b) => a - b).map(d => DAY_LABELS[d]).join(', ');
}

function submittedLabel(ts: unknown): string {
  const d = typeof (ts as { toDate?: () => Date })?.toDate === 'function' ? (ts as { toDate: () => Date }).toDate() : null;
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
}

export default function ApprovalsScreen() {
  const c = useThemeColors();
  const { refreshPending } = useConnectivity();
  const [approvals, setApprovals] = useState<LiveApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>('phone');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return firestore().collection('pendingApprovals').where('status', '==', 'pending').onSnapshot(
      snap => {
        setApprovals(snap.docs.map(d => ({ id: d.id, ...d.data() }) as LiveApproval));
        setError('');
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, []);

  function openApprove(id: string) {
    setApprovingId(id); setRejectingId(null); setMethod('phone'); setNotes('');
  }
  function openReject(id: string) {
    setRejectingId(id); setApprovingId(null); setReason('');
  }

  async function approve(a: LiveApproval) {
    if (saving) return;
    setSaving(true);
    try {
      const res = await postOrQueue<{ warnings?: string[] }>('/api/admin/approve-signup', {
        approvalId: a.id, paymentMethod: method, paymentNotes: notes,
      });
      if (res.queued) refreshPending();
      setApprovingId(null);
      // Optimistic — the pending signup is approved (or queued) either way.
      setApprovals(prev => prev.filter(x => x.id !== a.id));
      if (res.data?.warnings?.length) Alert.alert('Approved with warnings', res.data.warnings.join('\n'));
      else if (res.queued) Alert.alert('Saved offline', 'This approval will sync when you are back online.');
    } catch (err) {
      Alert.alert('Could not approve', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function reject(a: LiveApproval) {
    if (saving || !reason.trim()) return;
    setSaving(true);
    try {
      await firestore().collection('pendingApprovals').doc(a.id).update({
        status: 'rejected', rejectionReason: reason.trim(),
      });
      setRejectingId(null);
    } catch (err) {
      Alert.alert('Could not reject', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminScreen eyebrow="[ADMIN] [02]" title={`Approvals${approvals.length ? ` · ${approvals.length}` : ''}`}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing[8] }} color={c.fg3} />
      ) : (
        <ScrollView contentContainerStyle={s.list} keyboardShouldPersistTaps="handled">
          {error ? <Text style={[s.note, { color: c.danger }]}>{error}</Text> : null}
          {!error && approvals.length === 0 ? (
            <Text style={[s.note, { color: c.fg3 }]}>No signups waiting for approval.</Text>
          ) : null}

          {approvals.map(a => (
            <View key={a.id} style={[s.card, { backgroundColor: c.card, borderColor: c.line }]}>
              <View style={s.rowBetween}>
                <Text style={[s.name, { color: c.fg }]} numberOfLines={1}>{a.customerName}</Text>
                <Text style={[s.mono, { color: c.fg3 }]}>{submittedLabel(a.submittedAt)}</Text>
              </View>
              <Text style={[s.meta, { color: c.fg2 }]}>{a.societyName} · {a.tower}</Text>

              <TouchableOpacity
                style={s.phoneRow}
                onPress={() => Linking.openURL(`tel:${a.customerPhone}`)}
                accessibilityLabel={`Call ${a.customerName}`}
              >
                <Phone size={14} color={c.info} strokeWidth={1.5} />
                <Text style={[s.phone, { color: c.info }]}>{a.customerPhone}</Text>
              </TouchableOpacity>

              <View style={[s.divider, { backgroundColor: c.line }]} />
              <Text style={[s.meta, { color: c.fg }]}>{a.carMake} {a.carModel} · {a.carPlate}</Text>
              {a.twoWheelerPlate ? (
                <Text style={[s.meta, { color: c.fg }]}>{a.twoWheelerMake} {a.twoWheelerModel} · {a.twoWheelerPlate}</Text>
              ) : null}
              <Text style={[s.mono, { color: c.fg3, marginTop: 6 }]}>
                {formatTime(a.preferredCleaningTime)} · {formatDays(a.preferredCleaningDays)}{a.tier ? ` · ${a.tier.toUpperCase()}` : ''}
              </Text>

              {approvingId === a.id ? (
                <View style={s.form}>
                  <Text style={[s.mono, { color: c.fg3 }]}>PAYMENT METHOD (VERIFIED BY PHONE CALL)</Text>
                  <View style={s.chips}>
                    {PAYMENT_METHODS.map(m => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setMethod(m)}
                        style={[s.chip, { borderColor: method === m ? c.sage : c.line, backgroundColor: method === m ? c.sageFaint : 'transparent' }]}
                      >
                        <Text style={[s.chipText, { color: method === m ? c.fg : c.fg2 }]}>{m.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={[s.input, { backgroundColor: c.inkRaised, borderColor: c.lineStrong, color: c.fg }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Payment notes (optional)"
                    placeholderTextColor={c.fg4}
                  />
                  <View style={s.actions}>
                    <TouchableOpacity style={[s.btnGhost, { borderColor: c.lineStrong }]} onPress={() => setApprovingId(null)} disabled={saving}>
                      <Text style={[s.btnText, { color: c.fg2 }]}>CANCEL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.btnPrimary, { backgroundColor: c.warm, opacity: saving ? 0.5 : 1 }]} onPress={() => approve(a)} disabled={saving}>
                      <Text style={[s.btnText, { color: c.ink }]}>{saving ? 'APPROVING...' : 'CONFIRM APPROVAL'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : rejectingId === a.id ? (
                <View style={s.form}>
                  <TextInput
                    style={[s.input, { backgroundColor: c.inkRaised, borderColor: c.lineStrong, color: c.fg }]}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Reason for rejection"
                    placeholderTextColor={c.fg4}
                  />
                  <View style={s.actions}>
                    <TouchableOpacity style={[s.btnGhost, { borderColor: c.lineStrong }]} onPress={() => setRejectingId(null)} disabled={saving}>
                      <Text style={[s.btnText, { color: c.fg2 }]}>CANCEL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.btnGhost, { borderColor: c.danger, opacity: saving || !reason.trim() ? 0.4 : 1 }]}
                      onPress={() => reject(a)}
                      disabled={saving || !reason.trim()}
                    >
                      <Text style={[s.btnText, { color: c.danger }]}>{saving ? 'REJECTING...' : 'REJECT'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={s.actions}>
                  <TouchableOpacity style={[s.btnGhost, { borderColor: c.lineStrong }]} onPress={() => openReject(a.id)}>
                    <Text style={[s.btnText, { color: c.danger }]}>REJECT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btnPrimary, { backgroundColor: c.warm }]} onPress={() => openApprove(a.id)}>
                    <Text style={[s.btnText, { color: c.ink }]}>APPROVE</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </AdminScreen>
  );
}

const s = StyleSheet.create({
  list:       { padding: spacing[5], gap: spacing[3], paddingBottom: spacing[8] },
  note:       { fontFamily: typography.sans, fontSize: 14, textAlign: 'center', marginTop: spacing[6] },
  card:       { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name:       { fontFamily: typography.sansSemiBold, fontSize: 17, flexShrink: 1 },
  meta:       { fontFamily: typography.sans, fontSize: 14 },
  mono:       { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8 },
  phoneRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  phone:      { fontFamily: typography.sansMedium, fontSize: 14 },
  divider:    { height: 1, marginVertical: spacing[2] },
  form:       { gap: spacing[3], marginTop: spacing[3] },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  chipText:   { fontFamily: typography.mono, fontSize: 11, letterSpacing: 0.8 },
  input:      { borderWidth: 1, borderRadius: radii.sm, paddingHorizontal: spacing[3], height: 48, fontFamily: typography.sans, fontSize: 14 },
  actions:    { flexDirection: 'row', gap: 10, marginTop: spacing[3] },
  btnGhost:   { flex: 1, borderWidth: 1, borderRadius: radii.pill, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { flex: 1.4, borderRadius: radii.pill, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  btnText:    { fontFamily: typography.sansSemiBold, fontSize: 12, letterSpacing: 0.6 },
});
