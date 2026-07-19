import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, TextInput, ActivityIndicator,
  StyleSheet, Alert, Modal, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Building2, CheckCircle2, Circle, ChevronLeft, Clock, X, Star,
} from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CarInfo {
  plate: string;
  make: string;
  model: string;
}

interface SocietyRecord {
  id: string;
  customerId: string;
  customerName: string;
  societyId: string;
  societyName: string;
  tower: string;
  status: 'pending' | 'active' | 'paused' | 'inactive';
  cars: CarInfo[];
  preferredCleaningTime?: number;
  preferredCleaningDays?: number[];
  permanentTime?: number;
  skipDates: Date[];
  rescheduledSlots: { date: Date; fromTime: number; toTime: number }[];
  monthlyFee: number;
  paymentStatus: string;
}

interface CleaningLog {
  id: string;
  cleanedAt: Date;
  vehicleRegistration: string;
  workerName: string;
  serviceType: string;
  servicePrice: number;
  rating?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(hour: number): string {
  if (hour === 0 || hour === 12) return hour === 0 ? '12:00 AM' : '12:00 PM';
  return hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
}

function getUpcomingDates(dayIndices: number[], n: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  for (let scanned = 0; dates.length < n && scanned < 400; scanned++) {
    if (dayIndices.includes(cursor.getDay())) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function toDate(v: any): Date {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  return typeof v.toDate === 'function' ? v.toDate() : new Date(v);
}

const TIME_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const h = i + 7;
  const label = h === 12 ? '12:00 PM' : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
  return { label, value: h };
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CleaningScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useThemeColors();
  const ss = useSharedStyles();
  const s = makeStyles(c);

  const uid = auth().currentUser?.uid;
  const phone = auth().currentUser?.phoneNumber;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<SocietyRecord | null | 'loading'>('loading');
  const [logs, setLogs] = useState<CleaningLog[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState<string | null>(null);
  const [ratingLogId, setRatingLogId] = useState<string | null>(null);

  // Fetch society record and cleaning logs
  const loadData = useCallback(async () => {
    if (!uid) { setLoading(false); setRecord(null); return; }

    try {
      const recordsSnap = await firestore()
        .collection('customerSocietyRecords')
        .where('customerId', '==', uid)
        .get();

      if (recordsSnap.empty) {
        // Try by phone
        if (phone) {
          const phoneSnap = await firestore()
            .collection('customerSocietyRecords')
            .where('customerPhone', '==', phone)
            .get();
          if (!phoneSnap.empty) {
            const data = phoneSnap.docs[0].data() as any;
            // Claim the record: update customerId to the real uid
            if (typeof data.customerId === 'string' && data.customerId.startsWith('admin_')) {
              await phoneSnap.docs[0].ref.update({
                customerId: uid,
                updatedAt: firestore.FieldValue.serverTimestamp(),
              });
            }
            const skipDates = (data.skipDates ?? []).map((d: any) => toDate(d));
            const rescheduledSlots = (data.rescheduledSlots ?? []).map((s: any) => ({
              ...s,
              date: toDate(s.date),
            }));
            setRecord({
              id: phoneSnap.docs[0].id,
              customerId: uid,
              customerName: data.customerName ?? '',
              societyId: data.societyId ?? '',
              societyName: data.societyName ?? '',
              tower: data.tower ?? '',
              status: data.status ?? 'pending',
              cars: data.cars ?? [],
              preferredCleaningTime: data.preferredCleaningTime,
              preferredCleaningDays: data.preferredCleaningDays,
              permanentTime: data.permanentTime,
              skipDates,
              rescheduledSlots,
              monthlyFee: data.monthlyFee ?? 0,
              paymentStatus: data.paymentStatus ?? 'not_verified',
            });
          } else {
            setRecord(null);
          }
        } else {
          setRecord(null);
        }
      } else {
        const data = recordsSnap.docs[0].data() as any;
        const skipDates = (data.skipDates ?? []).map((d: any) => toDate(d));
        const rescheduledSlots = (data.rescheduledSlots ?? []).map((s: any) => ({
          ...s,
          date: toDate(s.date),
        }));
        setRecord({
          id: recordsSnap.docs[0].id,
          customerId: uid,
          customerName: data.customerName ?? '',
          societyId: data.societyId ?? '',
          societyName: data.societyName ?? '',
          tower: data.tower ?? '',
          status: data.status ?? 'pending',
          cars: data.cars ?? [],
          preferredCleaningTime: data.preferredCleaningTime,
          preferredCleaningDays: data.preferredCleaningDays,
          permanentTime: data.permanentTime,
          skipDates,
          rescheduledSlots,
          monthlyFee: data.monthlyFee ?? 0,
          paymentStatus: data.paymentStatus ?? 'not_verified',
        });
      }

      // Fetch cleaning logs
      const logsSnap = await firestore()
        .collection('cleaningLogs')
        .where('customerId', '==', uid)
        .orderBy('cleanedAt', 'desc')
        .limit(20)
        .get();
      setLogs(logsSnap.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          cleanedAt: toDate(data.cleanedAt),
          vehicleRegistration: data.vehicleRegistration ?? '',
          workerName: data.workerName ?? '',
          serviceType: data.serviceType ?? '',
          servicePrice: data.servicePrice ?? 0,
          rating: data.rating,
        };
      }));

      setLoading(false);
    } catch (err) {
      console.warn('[CleaningSchedule] load error:', err);
      setLoading(false);
      setRecord(null);
    }
  }, [uid, phone]);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) loadData();
    });
    return unsubscribe;
  }, [loadData]);

  async function toggleSkip(date: Date) {
    if (!record || record === 'loading') return;
    setSaving(true);
    const alreadySkipped = record.skipDates.some(d => isSameDay(d, date));
    const updated = alreadySkipped
      ? record.skipDates.filter(d => !isSameDay(d, date))
      : [...record.skipDates, date];
    await firestore().collection('customerSocietyRecords').doc(record.id).update({
      skipDates: updated,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    setRecord({ ...record, skipDates: updated });
    setSaving(false);
  }

  async function savePermanentTime(hour: number) {
    if (!record || record === 'loading') return;
    setSaving(true);
    await firestore().collection('customerSocietyRecords').doc(record.id).update({
      permanentTime: hour,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    setRecord({ ...record, permanentTime: hour });
    setSaving(false);
  }

  function getRescheduledForDate(date: Date) {
    if (!record || record === 'loading') return undefined;
    return (record.rescheduledSlots ?? []).find(s => isSameDay(s.date, date));
  }

  function getEffectiveTime(date: Date): number {
    const rescheduled = getRescheduledForDate(date);
    if (rescheduled) return rescheduled.toTime;
    return record && record !== 'loading'
      ? (record.permanentTime ?? record.preferredCleaningTime ?? 9)
      : 9;
  }

  async function toggleReschedule(date: Date, toTime: number) {
    if (!record || record === 'loading') return;
    setRescheduleDate(null);
    setSaving(true);
    const existing = getRescheduledForDate(date);
    const activeTime = record.permanentTime ?? record.preferredCleaningTime ?? 9;
    const updated = existing
      ? (record.rescheduledSlots ?? []).map(s =>
          isSameDay(s.date, date) ? { ...s, toTime } : s
        )
      : [...(record.rescheduledSlots ?? []), { date, fromTime: activeTime, toTime }];
    await firestore().collection('customerSocietyRecords').doc(record.id).update({
      rescheduledSlots: updated,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    setRecord({ ...record, rescheduledSlots: updated as any });
    setSaving(false);
  }

  async function clearReschedule(date: Date) {
    if (!record || record === 'loading') return;
    setRescheduleDate(null);
    setSaving(true);
    const updated = (record.rescheduledSlots ?? []).filter(s => !isSameDay(s.date, date));
    await firestore().collection('customerSocietyRecords').doc(record.id).update({
      rescheduledSlots: updated,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    setRecord({ ...record, rescheduledSlots: updated as any });
    setSaving(false);
  }

  async function rateLog(logId: string, rating: number) {
    setRatingLogId(logId);
    try {
      await firestore().collection('cleaningLogs').doc(logId).update({ rating });
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, rating } : l));
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit rating.');
    } finally {
      setRatingLogId(null);
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <View style={[s.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={c.fg3} />
      </View>
    );
  }

  const activeTime = record && record !== 'loading'
    ? (record.permanentTime ?? record.preferredCleaningTime ?? 9)
    : 9;
  const preferredDays = record && record !== 'loading'
    ? (record.preferredCleaningDays?.length ? record.preferredCleaningDays : [1, 3, 5])
    : [1, 3, 5];
  const upcomingDates = record && record !== 'loading' && record.status === 'active'
    ? getUpcomingDates(preferredDays, 6)
    : [];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={c.fg} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cleaning Schedule</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing[10], gap: spacing[5], padding: spacing[5] }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Not enrolled ── */}
        {record === null && (
          <View style={{ gap: spacing[4] }}>
            <Text style={ss.eyebrow}>[NOT ENROLLED]</Text>
            <Text style={s.sectionTitle}>Join the society programme.</Text>
            <Text style={s.body}>
              Your car gets cleaned every week — no booking, no chasing. Sign up from the web portal at perfectcleaners.in.
            </Text>
          </View>
        )}

        {/* ── Pending approval ── */}
        {record && record !== 'loading' && record.status === 'pending' && (
          <View style={{ gap: spacing[5] }}>
            <View style={[s.noticeCard, { backgroundColor: c.warning + '18', borderColor: c.warning + '40' }]}>
              <Text style={[s.noticeLabel, { color: c.warning }]}>[PENDING APPROVAL]</Text>
              <Text style={[s.noticeTitle, { color: c.fg }]}>Your registration is under review.</Text>
              <Text style={[s.noticeBody, { color: c.fg3 }]}>
                We'll call you to verify your details. You'll receive an SMS once approved.
              </Text>
            </View>

            {/* Summary */}
            <View style={s.infoCard}>
              <View style={s.infoRow}>
                <Text style={s.metaLabel}>SOCIETY</Text>
                <Text style={s.metaValue}>{record.societyName}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.metaLabel}>TOWER</Text>
                <Text style={s.metaValue}>{record.tower}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.metaLabel}>SLOT</Text>
                <Text style={s.metaValue}>{formatTime(activeTime)}</Text>
              </View>
            </View>

            {/* Time preference (editable even before approval) */}
            <TimePrefSection activeTime={activeTime} saving={saving} onSelect={savePermanentTime} c={c} s={s} />
          </View>
        )}

        {/* ── Active enrollment ── */}
        {record && record !== 'loading' && record.status === 'active' && (
          <View style={{ gap: spacing[6] }}>
            {/* Enrolment summary */}
            <View style={s.infoCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>{record.societyName}</Text>
                  <Text style={s.body}>{record.tower}</Text>
                </View>
                <View style={s.activePill}>
                  <View style={s.activeDot} />
                  <Text style={s.activePillText}>ACTIVE</Text>
                </View>
              </View>
              <View style={s.divider} />
              <View style={{ flexDirection: 'row', gap: spacing[4] }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.metaLabel}>SLOT</Text>
                  <Text style={[s.metaValue, { marginTop: 3 }]}>{formatTime(activeTime)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.metaLabel}>FEE</Text>
                  <Text style={[s.metaValue, { marginTop: 3 }]}>₹{record.monthlyFee}</Text>
                </View>
              </View>
              {record.cars.length > 0 && (
                <>
                  <View style={s.divider} />
                  <View>
                    <Text style={s.metaLabel}>CARS</Text>
                    {record.cars.map((car, i) => (
                      <Text key={i} style={[s.metaValue, { marginTop: 3, fontFamily: typography.mono, fontSize: 12 }]}>
                        {car.plate}{car.make ? ` · ${car.make} ${car.model}` : ''}
                      </Text>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Upcoming dates with skip/reschedule */}
            {upcomingDates.length > 0 && (
              <View style={{ gap: spacing[3] }}>
                <Text style={ss.eyebrow}>[UPCOMING CLEANINGS]</Text>
                {upcomingDates.map((date, i) => {
                  const isSkipped = record.skipDates.some(d => isSameDay(d, date));
                  const rescheduled = getRescheduledForDate(date);
                  const effectiveTime = getEffectiveTime(date);
                  const isRescheduling = rescheduleDate === `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                  return (
                    <View key={i}>
                      <View style={[
                        s.dateRow,
                        { backgroundColor: isSkipped ? c.inkRaised : c.card },
                        isSkipped && { opacity: 0.65 },
                      ]}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[
                              s.dateText,
                              { color: isSkipped ? c.fg4 : c.fg },
                              isSkipped && { textDecorationLine: 'line-through' },
                            ]}>
                              {formatDateShort(date)}
                            </Text>
                            <Text style={[
                              s.timeText,
                              { color: rescheduled ? c.warning : c.fg4 },
                              rescheduled && { textDecorationLine: 'line-through' },
                            ]}>
                              {formatTime(activeTime)}
                            </Text>
                            {rescheduled && (
                              <Text style={[s.timeText, { color: c.warning }]}>
                                → {formatTime(effectiveTime)}
                              </Text>
                            )}
                            {isSkipped && (
                              <Text style={[s.skippedLabel, { color: c.fg4 }]}>Skipped</Text>
                            )}
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={[s.smallBtn, { borderColor: c.info }]}
                            onPress={() => {
                              const dk = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                              setRescheduleDate(isRescheduling ? null : dk);
                            }}
                            disabled={saving}
                            activeOpacity={0.7}
                          >
                            <Text style={[s.smallBtnText, { color: c.info }]}>
                              {rescheduled ? 'Time' : 'Time'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[s.smallBtn, { borderColor: isSkipped ? c.sageHi : c.fg3 }]}
                            onPress={() => toggleSkip(date)}
                            disabled={saving}
                            activeOpacity={0.7}
                          >
                            <Text style={[s.smallBtnText, { color: isSkipped ? c.sageHi : c.fg3 }]}>
                              {isSkipped ? 'Undo' : 'Skip'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {isRescheduling && (
                        <View style={[s.reschedulePanel, { backgroundColor: c.inkRaised, borderColor: c.line }]}>
                          <Text style={[s.rescheduleTitle, { color: c.fg4 }]}>
                            Change time for {formatDateShort(date)}
                          </Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {TIME_OPTIONS.filter(o => o.value !== effectiveTime).map(opt => (
                              <TouchableOpacity
                                key={opt.value}
                                style={[s.timeOption, { backgroundColor: c.card, borderColor: c.line }]}
                                onPress={() => toggleReschedule(date, opt.value)}
                                activeOpacity={0.7}
                              >
                                <Text style={[s.timeOptionText, { color: c.fg2 }]}>{opt.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                            {rescheduled && (
                              <TouchableOpacity
                                style={[s.smallBtn, { borderColor: c.danger }]}
                                onPress={() => clearReschedule(date)}
                                activeOpacity={0.7}
                              >
                                <Text style={[s.smallBtnText, { color: c.danger }]}>Reset</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={[s.smallBtn, { borderColor: c.line }]}
                              onPress={() => setRescheduleDate(null)}
                              activeOpacity={0.7}
                            >
                              <Text style={[s.smallBtnText, { color: c.fg3 }]}>Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Time preference */}
            <TimePrefSection activeTime={activeTime} saving={saving} onSelect={savePermanentTime} c={c} s={s} />
          </View>
        )}

        {/* ── Cleaning history ── */}
        {logs.length > 0 && (
          <View style={{ gap: spacing[3] }}>
            <Text style={ss.eyebrow}>[RECENT CLEANINGS]</Text>
            {logs.map(log => (
              <View key={log.id} style={[s.logCard, { backgroundColor: c.card, borderColor: c.line }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontFamily: typography.sans, fontSize: 14, color: c.fg }}>
                      {formatDateShort(log.cleanedAt)}
                    </Text>
                    <Text style={{ fontFamily: typography.sans, fontSize: 12, color: c.fg4, marginTop: 3 }}>
                      {log.vehicleRegistration} · cleaned by {log.workerName}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: typography.sansSemiBold, fontSize: 14, color: c.fg }}>
                      ₹{log.servicePrice.toLocaleString('en-IN')}
                    </Text>
                    <Text style={{ fontFamily: typography.mono, fontSize: 9.5, color: c.fg4, marginTop: 3, textTransform: 'uppercase' }}>
                      {log.serviceType}
                    </Text>
                  </View>
                </View>
                {/* Rating */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.line }}>
                  <Text style={{ fontFamily: typography.mono, fontSize: 10, color: c.fg4, marginRight: 6, textTransform: 'uppercase' }}>
                    {log.rating ? 'Your rating' : 'Rate this clean'}
                  </Text>
                  {[1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => !log.rating && ratingLogId !== log.id && rateLog(log.id, n)}
                      disabled={!!log.rating || ratingLogId === log.id}
                      activeOpacity={0.7}
                      style={{ padding: 2 }}
                    >
                      <Star
                        size={15}
                        color={log.rating && n <= log.rating ? c.fg : c.fg4}
                        fill={log.rating && n <= log.rating ? c.fg : 'none'}
                        strokeWidth={1.5}
                      />
                    </TouchableOpacity>
                  ))}
                  {ratingLogId === log.id && (
                    <ActivityIndicator size="small" color={c.fg3} style={{ marginLeft: 6 }} />
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Time Preference Sub-component ────────────────────────────────────────────

function TimePrefSection({
  activeTime, saving, onSelect, c, s,
}: {
  activeTime: number;
  saving: boolean;
  onSelect: (hour: number) => void;
  c: ReturnType<typeof useThemeColors>;
  s: ReturnType<typeof makeStyles>;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ gap: spacing[2] }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        activeOpacity={0.7}
      >
        <Clock size={14} color={c.fg3} strokeWidth={1.5} />
        <Text style={{ fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.6, color: c.fg3, textTransform: 'uppercase', flex: 1 }}>
          PREFERRED CLEANING TIME · {formatTime(activeTime)}
        </Text>
        <Text style={{ fontFamily: typography.mono, fontSize: 10, color: c.fg4 }}>
          {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <View style={[s.timeGrid, { backgroundColor: c.card, borderColor: c.line }]}>
          {TIME_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                s.timeChip,
                { backgroundColor: c.inkRaised, borderColor: c.line },
                opt.value === activeTime && { backgroundColor: c.sage, borderColor: c.sageHi },
              ]}
              onPress={() => { onSelect(opt.value); setExpanded(false); }}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={[
                { fontFamily: typography.sans, fontSize: 12, color: c.fg2 },
                opt.value === activeTime && { color: c.sageInk },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    root:             { flex: 1, backgroundColor: c.ink },
    header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
    backBtn:          { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    headerTitle:      { fontFamily: typography.sansSemiBold, fontSize: 16, color: c.fg },
    sectionTitle:     { fontFamily: typography.serif, fontSize: 22, color: c.fg, letterSpacing: -0.3 },
    body:             { fontFamily: typography.sans, fontSize: 13, color: c.fg3, lineHeight: 20 },
    noticeCard:       { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: spacing[2] },
    noticeLabel:      { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
    noticeTitle:      { fontFamily: typography.sansMedium, fontSize: 14 },
    noticeBody:       { fontFamily: typography.sans, fontSize: 13, lineHeight: 19 },
    infoCard:         { backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: spacing[4], gap: spacing[3] },
    infoRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaLabel:        { fontFamily: typography.mono, fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', color: c.fg4 },
    metaValue:        { fontFamily: typography.sans, fontSize: 13, color: c.fg },
    divider:          { height: 1, backgroundColor: c.line, marginVertical: spacing[1] },
    activePill:       { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: c.sage + '55', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: c.sage + '22' },
    activeDot:        { width: 6, height: 6, borderRadius: 999, backgroundColor: c.sageHi },
    activePillText:   { fontFamily: typography.mono, fontSize: 10, color: c.sageHi, letterSpacing: 0.4 },
    dateRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: spacing[3] },
    dateText:         { fontFamily: typography.sans, fontSize: 14 },
    timeText:         { fontFamily: typography.mono, fontSize: 11, letterSpacing: 0.3 },
    skippedLabel:     { fontFamily: typography.mono, fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase' },
    smallBtn:         { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1 },
    smallBtnText:     { fontFamily: typography.sans, fontSize: 11 },
    reschedulePanel:  { marginTop: 6, borderWidth: 1, borderRadius: radii.md, padding: spacing[3], gap: spacing[2] },
    rescheduleTitle:  { fontFamily: typography.mono, fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase' },
    timeOption:       { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, borderWidth: 1 },
    timeOptionText:   { fontFamily: typography.sans, fontSize: 12 },
    timeGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderWidth: 1, borderRadius: radii.md, padding: spacing[3] },
    timeChip:         { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, borderWidth: 1 },
    logCard:          { borderWidth: 1, borderRadius: radii.md, padding: spacing[3], gap: spacing[1] },
  });
}
