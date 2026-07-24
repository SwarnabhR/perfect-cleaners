import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, CheckCircle2, Circle, Loader, Clock } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { Worker, CleaningSessionCar } from '@pc/firebase';
import { getAssignedSocieties } from '@pc/firebase';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionCar extends CleaningSessionCar {
  sessionId: string;
  carIndex: number;
  societyId: string;
  societyName: string;
  tower: string;
  logId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isLocalDateMatch(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function getTimeSlotLabel(hour: number): string {
  const h12 = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${h12}:00 ${ampm} · ${period}`;
}

function unitSort(a: SessionCar, b: SessionCar) {
  return (a.unitNumber ?? '').localeCompare(b.unitNumber ?? '', 'en', { numeric: true });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WorkerHome() {
  const insets = useSafeAreaInsets();
  const c      = useThemeColors();
  const ss     = useSharedStyles();

  const [worker,          setWorker]          = useState<(Worker & { id: string }) | null>(null);
  const [cars,            setCars]            = useState<SessionCar[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [toggling,        setToggling]        = useState(false);
  const [marking,         setMarking]         = useState<string | null>(null);

  const uid = auth().currentUser?.uid;

  // Live worker profile
  useEffect(() => {
    if (!uid) return;
    return firestore().collection('workers').doc(uid).onSnapshot(snap => {
      if (snap.exists()) setWorker({ ...(snap.data() as Worker), id: snap.id });
    });
  }, [uid]);

  // Live cleaning sessions for today where worker is assigned
  useEffect(() => {
    if (!uid) return;

    const today = todayStart();
    const tomorrow = new Date(today.getTime() + 86400000);

    return firestore()
      .collection('cleaningSessions')
      .where('workerIds', 'array-contains', uid)
      .onSnapshot(snap => {
        const allCars: SessionCar[] = [];

        snap.docs.forEach(d => {
          const data = d.data() as any;
          const scheduledDate = data.scheduledDate?.toDate?.() ?? data.scheduledDate;

          if (!scheduledDate) return;
          const sessionDate = scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
          if (!isLocalDateMatch(sessionDate, today)) return;

          const societyId   = data.societyId ?? '';
          const societyName = data.societyName ?? '';
          const tower = data.tower ?? '';

          (data.cars ?? []).forEach((car: any, idx: number) => {
            allCars.push({
              customerId:    car.customerId ?? '',
              customerName:  car.customerName ?? '',
              unitNumber:    car.unitNumber ?? '',
              carPlate:      car.carPlate ?? '',
              carMake:       car.carMake ?? '',
              carModel:      car.carModel ?? '',
              preferredTime: car.preferredTime ?? 9,
              status:        car.status ?? 'pending',
              cleanedBy:     car.cleanedBy,
              cleanedAt:     car.cleanedAt,
              sessionId:     d.id,
              carIndex:      idx,
              societyId,
              societyName,
              tower,
            });
          });
        });

        setCars(allCars.sort(unitSort));

        // Load today's cleaning logs to enrich with logId
        firestore()
          .collection('cleaningLogs')
          .where('workerId', '==', uid)
          .where('cleanedAt', '>=', firestore.Timestamp.fromDate(today))
          .get()
          .then(logsSnap => {
            const logMap = new Map<string, string>();
            logsSnap.docs.forEach(d => {
              const data = d.data();
              const key = `${data.sessionId ?? ''}_${data.vehicleRegistration ?? ''}`;
              logMap.set(key, d.id);
            });
            setCars(prev => prev.map(c => ({
              ...c,
              logId: logMap.get(`${c.sessionId}_${c.carPlate}`),
            })));
          })
          .catch(() => {});

        setLoading(false);
      }, err => {
        console.warn('[WorkerHome] sessions:', err.message);
        setLoading(false);
      });
  }, [uid]);

  const markCleaning = useCallback(async (sessionId: string, carIndex: number) => {
    setCars(prev => prev.map(c =>
      c.sessionId === sessionId && c.carIndex === carIndex
        ? { ...c, status: 'in_progress' as const }
        : c,
    ));
    try {
      await firestore()
        .collection('cleaningSessions')
        .doc(sessionId)
        .update({
          [`cars.${carIndex}.status`]: 'in_progress',
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch {} // optimistic update already applied
  }, []);

  const markDone = useCallback(async (car: SessionCar) => {
    if (marking || !uid || !worker) return;
    const key = `${car.sessionId}-${car.carIndex}`;
    setMarking(key);

    try {
      const sessionRef = firestore().collection('cleaningSessions').doc(car.sessionId);
      const batch = firestore().batch();

      // Update session cars array
      batch.update(sessionRef, {
        [`cars.${car.carIndex}.status`]: 'done',
        [`cars.${car.carIndex}.cleanedBy`]: uid,
        [`cars.${car.carIndex}.cleanedAt`]: firestore.FieldValue.serverTimestamp(),
        completedCars: firestore.FieldValue.increment(1),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Write cleaning log
      const logRef = firestore().collection('cleaningLogs').doc();
      batch.set(logRef, {
        id:                  logRef.id,
        sessionId:           car.sessionId,
        societyId:           car.societyId,
        societyName:         car.societyName,
        tower:               car.tower,
        vehicleRegistration: car.carPlate,
        vehicleMake:         car.carMake,
        vehicleModel:        car.carModel,
        customerId:          car.customerId,
        customerName:        car.customerName,
        unitNumber:          car.unitNumber,
        workerId:            uid,
        workerName:          worker.name,
        cleanedAt:           firestore.FieldValue.serverTimestamp(),
        serviceType:         'exterior',
        servicePrice:        0,
        photoUrls:           [],
        notificationSent:    false,
        billed:              false,
      });

      await batch.commit();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to mark car as done.');
    } finally {
      setMarking(null);
    }
  }, [marking, uid, worker]);

  const total   = cars.length;
  const done    = cars.filter(c => c.status === 'done').length;
  const ongoing = cars.filter(c => c.status === 'in_progress').length;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  // Group cars by time slot
  const timeSlots = [...new Set(cars.map(c => c.preferredTime))].sort((a, b) => a - b);

  const assignedSocieties = worker ? getAssignedSocieties(worker) : [];

  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (worker?.name ?? 'Worker').split(' ')[0];
  const initials  = (worker?.name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const s = makeStyles(c);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={s.greeting}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={ss.eyebrow}>
              {now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
            </Text>
            <Text style={s.greetingText}>{greeting}, {firstName}. 👋</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[s.toggle, worker?.isOnline && s.toggleOn]}
          onPress={() => {
            if (!uid || !worker) return;
            setToggling(true);
            firestore().collection('workers').doc(uid).update({ isOnline: !worker.isOnline })
              .catch(() => {})
              .finally(() => setToggling(false));
          }}
          disabled={toggling}
          activeOpacity={0.75}
        >
          <View style={[s.dot, worker?.isOnline ? s.dotOn : s.dotOff]} />
          <Text style={[s.toggleText, worker?.isOnline && s.toggleTextOn]}>
            {worker?.isOnline ? 'ON DUTY' : 'OFF DUTY'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Society assignment card */}
      {assignedSocieties.length > 0 ? (
        <View style={s.societyCard}>
          <View style={s.societyRow}>
            <View style={s.societyIcon}>
              <Building2 size={18} color={c.sageInk} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.societyName}>{assignedSocieties.map(a => a.name).join(', ')}</Text>
              <Text style={s.societyMeta}>
                {assignedSocieties.length > 1 ? `${assignedSocieties.length} SOCIETIES` : "TODAY'S ASSIGNMENT"}
              </Text>
            </View>
            <View style={[s.progressBadge, pct === 100 && s.progressBadgeDone]}>
              <Text style={[s.progressBadgeText, pct === 100 && s.progressBadgeTextDone]}>
                {done}/{total} done
              </Text>
            </View>
          </View>

          {total > 0 && (
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${pct}%` as any }]} />
            </View>
          )}

          <View style={s.statsRow}>
            {[
              { label: 'PENDING',  value: total - done - ongoing, color: c.fg3    },
              { label: 'CLEANING', value: ongoing,                color: c.warning },
              { label: 'DONE',     value: done,                   color: c.success },
            ].map(({ label, value, color }) => (
              <View key={label} style={s.statItem}>
                <Text style={[s.statValue, { color }]}>{value}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={s.noSocietyCard}>
          <Building2 size={28} color={c.fg3} strokeWidth={1.5} />
          <Text style={s.noSocietyTitle}>No society assigned</Text>
          <Text style={s.noSocietyBody}>
            Contact your admin to get assigned to a society before starting your shift.
          </Text>
        </View>
      )}

      {/* Car list grouped by time slot */}
      {assignedSocieties.length > 0 && (
        <View style={s.listSection}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: spacing[8] }} color={c.fg3} />
          ) : cars.length === 0 ? (
            <View style={s.emptyList}>
              <Text style={s.emptyListText}>
                No cars scheduled for today. Sessions are created by your admin.
              </Text>
            </View>
          ) : (
            timeSlots.map(slot => {
              const slotCars = cars.filter(c => c.preferredTime === slot);
              const slotDone = slotCars.filter(c => c.status === 'done').length;
              return (
                <View key={slot} style={s.slotSection}>
                  {/* Time slot header */}
                  <View style={s.slotHeader}>
                    <Clock size={14} color={c.fg3} strokeWidth={1.5} />
                    <Text style={s.slotLabel}>{getTimeSlotLabel(slot)}</Text>
                    <Text style={s.slotMeta}>
                      {slotDone}/{slotCars.length} done
                    </Text>
                  </View>

                  {/* Cars in this slot */}
                  <View style={s.carList}>
                    {slotCars.map(car => (
                      <CarRow
                        key={`${car.sessionId}-${car.carIndex}`}
                        car={car}
                        isMarking={marking === `${car.sessionId}-${car.carIndex}`}
                        onStartCleaning={() => markCleaning(car.sessionId, car.carIndex)}
                        onMarkDone={() => markDone(car)}
                        c={c}
                        s={s}
                      />
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Car Row ──────────────────────────────────────────────────────────────────

function CarRow({
  car, isMarking, onStartCleaning, onMarkDone, c, s,
}: {
  car: SessionCar;
  isMarking: boolean;
  onStartCleaning: () => void;
  onMarkDone: () => void;
  c: ReturnType<typeof useThemeColors>;
  s: ReturnType<typeof makeStyles>;
}) {
  const isDone     = car.status === 'done';
  const isCleaning = car.status === 'in_progress';

  return (
    <View style={[s.carRow, isDone && s.carRowDone]}>
      <View style={s.carStatusIcon}>
        {isDone
          ? <CheckCircle2 size={20} color={c.success} strokeWidth={2} />
          : isCleaning
            ? <Loader size={20} color={c.warning} strokeWidth={1.5} />
            : <Circle size={20} color={c.fg3} strokeWidth={1.5} />
        }
      </View>

      <View style={s.carInfo}>
        <View style={s.carInfoTop}>
          <Text style={[s.carUnit, isDone && s.textMuted]}>{car.unitNumber}</Text>
          <Text style={[s.carName, isDone && s.textMuted]} numberOfLines={1}>
            {car.customerName}
          </Text>
        </View>
        <Text style={[s.carPlate, isDone && s.textMuted]}>
          {car.carPlate}
          {(car.carMake || car.carModel)
            ? ` · ${[car.carMake, car.carModel].filter(Boolean).join(' ')}`
            : ''}
        </Text>
      </View>

      {!isDone && (
        <TouchableOpacity
          style={[s.carAction, isCleaning ? s.carActionDone : s.carActionStart]}
          onPress={isCleaning ? onMarkDone : onStartCleaning}
          disabled={isMarking}
          activeOpacity={0.8}
        >
          {isMarking
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.carActionText}>{isCleaning ? 'DONE ✓' : 'CLEAN →'}</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    root:                  { flex: 1, backgroundColor: c.ink },
    topBar:                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
    greeting:              { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar:                { width: 36, height: 36, borderRadius: 999, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center' },
    avatarText:            { fontFamily: typography.sansSemiBold, fontSize: 14, color: c.sageInk },
    greetingText:          { fontFamily: typography.sansMedium, fontSize: 17, color: c.fg, letterSpacing: -0.2 },
    toggle:                { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: c.lineFaint, borderWidth: 1, borderColor: c.line },
    toggleOn:              { backgroundColor: c.sageFaint, borderColor: c.sageBorder },
    dot:                   { width: 7, height: 7, borderRadius: 999 },
    dotOn:                 { backgroundColor: c.success },
    dotOff:                { backgroundColor: c.fg3 },
    toggleText:            { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8, color: c.fg2, textTransform: 'uppercase' },
    toggleTextOn:          { color: c.fg },
    societyCard:           { marginHorizontal: spacing[5], marginTop: spacing[3], backgroundColor: c.card, borderRadius: radii.lg, borderWidth: 1, borderColor: c.line, padding: spacing[4], gap: spacing[3] },
    societyRow:            { flexDirection: 'row', alignItems: 'center', gap: 10 },
    societyIcon:           { width: 40, height: 40, borderRadius: 10, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    societyName:           { fontFamily: typography.sansSemiBold, fontSize: 15, color: c.fg },
    societyMeta:           { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.5, marginTop: 2 },
    progressBadge:         { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: c.sageFaint },
    progressBadgeDone:     { backgroundColor: c.successFaint },
    progressBadgeText:     { fontFamily: typography.mono, fontSize: 11, letterSpacing: 0.5, color: c.sageHi },
    progressBadgeTextDone: { color: c.success },
    progressTrack:         { height: 4, backgroundColor: c.lineFaint, borderRadius: 999, overflow: 'hidden' },
    progressFill:          { height: '100%', backgroundColor: c.sage, borderRadius: 999 },
    statsRow:              { flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.line, paddingTop: spacing[3] },
    statItem:              { flex: 1, alignItems: 'center', gap: 3 },
    statValue:             { fontFamily: typography.sansSemiBold, fontSize: 20 },
    statLabel:             { fontFamily: typography.mono, fontSize: 9, color: c.fg3, letterSpacing: 0.6 },
    noSocietyCard:         { marginHorizontal: spacing[5], marginTop: spacing[4], backgroundColor: c.card, borderRadius: radii.lg, borderWidth: 1, borderColor: c.line, padding: spacing[8], alignItems: 'center', gap: spacing[3] },
    noSocietyTitle:        { fontFamily: typography.serif, fontSize: 18, color: c.fg, letterSpacing: -0.2 },
    noSocietyBody:         { fontFamily: typography.sans, fontSize: 13, color: c.fg2, textAlign: 'center', lineHeight: 20 },
    listSection:           { paddingHorizontal: spacing[5], paddingTop: spacing[5], gap: spacing[4] },
    slotSection:           { gap: spacing[2] },
    slotHeader:            { flexDirection: 'row', alignItems: 'center', gap: 8 },
    slotLabel:             { fontFamily: typography.sansSemiBold, fontSize: 13, color: c.fg, letterSpacing: -0.1 },
    slotMeta:              { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.4, marginLeft: 'auto' },
    carList:               { gap: spacing[2] },
    emptyList:             { paddingVertical: spacing[6] },
    emptyListText:         { fontFamily: typography.sans, fontSize: 13, color: c.fg3, textAlign: 'center', lineHeight: 20 },
    carRow:                { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: 12 },
    carRowDone:            { opacity: 0.5 },
    carStatusIcon:         { flexShrink: 0 },
    carInfo:               { flex: 1, gap: 3 },
    carInfoTop:            { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    carUnit:               { fontFamily: typography.mono, fontSize: 11, color: c.sageHi, letterSpacing: 0.6 },
    carName:               { fontFamily: typography.sansMedium, fontSize: 13, color: c.fg, flex: 1 },
    carPlate:              { fontFamily: typography.mono, fontSize: 10.5, color: c.fg3, letterSpacing: 0.5 },
    textMuted:             { color: c.fg4 },
    carAction:             { borderRadius: radii.pill, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 12, minWidth: 72, alignItems: 'center' },
    carActionStart:        { backgroundColor: c.sage, borderColor: c.sage },
    carActionDone:         { backgroundColor: c.success, borderColor: c.success },
    carActionText:         { fontFamily: typography.mono, fontSize: 10.5, color: '#fff', letterSpacing: 0.6 },
  });
}
