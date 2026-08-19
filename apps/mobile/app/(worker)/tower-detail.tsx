import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Circle, Loader } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { Worker, CleaningSessionCar } from '@pc/firebase';
import { getCarUrgency } from '@pc/firebase';
import type { CarUrgency } from '@pc/firebase';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { ScreenHeader } from '../../components/RowGroup';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionCar extends CleaningSessionCar {
  sessionId: string;
  carIndex: number;
  sessionType: 'wash' | 'deep-clean';
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

function unitSort(a: SessionCar, b: SessionCar) {
  return (a.unitNumber ?? '').localeCompare(b.unitNumber ?? '', 'en', { numeric: true });
}

const URGENCY_ORDER: Record<CarUrgency, number> = { overdue: 0, 'due-soon': 1, later: 2, done: 3 };

function formatSlot(hour: number): string {
  const h    = Math.floor(hour);
  const m    = Math.round((hour % 1) * 60);
  const h12  = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TowerDetail() {
  const { societyId = '', tower = '' } = useLocalSearchParams<{ societyId?: string; tower?: string }>();
  const c = useThemeColors();

  const [worker,  setWorker]  = useState<(Worker & { id: string }) | null>(null);
  const [cars,    setCars]    = useState<SessionCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const uid = auth().currentUser?.uid;

  // Live worker profile
  useEffect(() => {
    if (!uid) return;
    return firestore().collection('workers').doc(uid).onSnapshot(snap => {
      if (snap.exists()) setWorker({ ...(snap.data() as Worker), id: snap.id });
    });
  }, [uid]);

  // Live cleaning sessions for today, scoped to this tower
  useEffect(() => {
    if (!uid) return;

    const today = todayStart();

    return firestore()
      .collection('cleaningSessions')
      .where('workerIds', 'array-contains', uid)
      .onSnapshot(snap => {
        const towerCars: SessionCar[] = [];

        snap.docs.forEach(d => {
          const data = d.data() as any;
          const scheduledDate = data.scheduledDate?.toDate?.() ?? data.scheduledDate;
          if (!scheduledDate) return;
          const sessionDate = scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
          if (!isLocalDateMatch(sessionDate, today)) return;
          if (data.societyId !== societyId || data.tower !== tower) return;

          const sessionType: 'wash' | 'deep-clean' = data.sessionType ?? 'wash';

          (data.cars ?? []).forEach((car: any, idx: number) => {
            // Skipped (customer opted out today) cars stay off the worker's
            // checklist entirely — nothing here is actionable for them.
            if (car.status === 'skipped') return;

            towerCars.push({
              customerId:    car.customerId ?? '',
              customerName:  car.customerName ?? '',
              unitNumber:    car.unitNumber ?? '',
              parkingNumber: car.parkingNumber ?? '',
              carPlate:      car.carPlate ?? '',
              carMake:       car.carMake ?? '',
              carModel:      car.carModel ?? '',
              preferredTime: car.preferredTime ?? 9,
              status:        car.status ?? 'pending',
              cleanedBy:     car.cleanedBy,
              cleanedAt:     car.cleanedAt,
              sessionId:     d.id,
              carIndex:      idx,
              sessionType,
            });
          });
        });

        towerCars.sort((a, b) => {
          const ua = getCarUrgency(a.preferredTime, a.status);
          const ub = getCarUrgency(b.preferredTime, b.status);
          if (URGENCY_ORDER[ua] !== URGENCY_ORDER[ub]) return URGENCY_ORDER[ua] - URGENCY_ORDER[ub];
          return unitSort(a, b);
        });

        setCars(towerCars);
        setLoading(false);

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
            setCars(prev => prev.map(cr => ({
              ...cr,
              logId: logMap.get(`${cr.sessionId}_${cr.carPlate}`),
            })));
          })
          .catch(() => {});
      }, err => {
        console.warn('[TowerDetail] sessions:', err.message);
        setLoading(false);
      });
  }, [uid, societyId, tower]);

  // cars is an ARRAY field — Firestore's dot-path update ('cars.0.status')
  // does NOT address array elements the way it addresses nested map fields.
  // It silently replaces the entire `cars` field with a map keyed by that
  // path segment (e.g. {"0": {"status": "done"}}), destroying every other
  // car and every other field on the touched car. The only safe way to
  // change one array element is a transactional read-modify-write of the
  // whole array, same pattern as the admin Live Cleaning board's markDone
  // (apps/web/.../live-cleaning/page.tsx) and the customer-unavailability
  // resync route.
  const markCleaning = useCallback(async (sessionId: string, carIndex: number) => {
    setCars(prev => prev.map(cr =>
      cr.sessionId === sessionId && cr.carIndex === carIndex
        ? { ...cr, status: 'in_progress' as const }
        : cr,
    ));
    try {
      const sessionRef = firestore().collection('cleaningSessions').doc(sessionId);
      await firestore().runTransaction(async transaction => {
        const snap = await transaction.get(sessionRef);
        const cars = (snap.data()?.cars ?? []) as CleaningSessionCar[];
        if (!cars[carIndex]) return;
        const updatedCars = cars.slice();
        updatedCars[carIndex] = { ...updatedCars[carIndex], status: 'in_progress' };
        transaction.update(sessionRef, {
          cars: updatedCars,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      });
    } catch {} // optimistic update already applied
  }, []);

  const markDone = useCallback(async (car: SessionCar) => {
    if (marking || !uid || !worker) return;
    const key = `${car.sessionId}-${car.carIndex}`;
    setMarking(key);

    try {
      const sessionRef = firestore().collection('cleaningSessions').doc(car.sessionId);
      const logRef = firestore().collection('cleaningLogs').doc();

      await firestore().runTransaction(async transaction => {
        const snap = await transaction.get(sessionRef);
        const cars = (snap.data()?.cars ?? []) as CleaningSessionCar[];
        if (!cars[car.carIndex]) throw new Error('This car is no longer on the session.');
        const updatedCars = cars.slice();
        updatedCars[car.carIndex] = {
          ...updatedCars[car.carIndex],
          status:    'done',
          cleanedBy: uid,
          cleanedAt: new Date(),
        };
        transaction.update(sessionRef, {
          cars:          updatedCars,
          completedCars: firestore.FieldValue.increment(1),
          updatedAt:     firestore.FieldValue.serverTimestamp(),
        });
        transaction.set(logRef, {
          id:                  logRef.id,
          sessionId:           car.sessionId,
          societyId,
          societyName:         '',
          tower,
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
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to mark car as done.');
    } finally {
      setMarking(null);
    }
  }, [marking, uid, worker, societyId, tower]);

  const done  = cars.filter(cr => cr.status === 'done').length;
  const total = cars.length;

  const s = makeStyles(c);

  return (
    <View style={[s.root]}>
      <ScreenHeader
        title={tower}
        trailing={
          <Text style={s.headerCount}>{done}/{total}</Text>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[10] }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: spacing[8] }} color={c.fg3} />
        ) : cars.length === 0 ? (
          <View style={s.emptyList}>
            <Text style={s.emptyListText}>No cars scheduled for this tower today.</Text>
          </View>
        ) : (
          <View style={s.carList}>
            {cars.map(car => (
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
        )}
      </ScrollView>
    </View>
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
  const urgency    = getCarUrgency(car.preferredTime, car.status);

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
          <Text style={[s.carUnit, isDone && s.textMuted]}>FLAT {car.unitNumber}</Text>
          <Text style={[s.carName, isDone && s.textMuted]} numberOfLines={1}>
            {car.customerName}
          </Text>
          {car.sessionType === 'deep-clean' && (
            <View style={s.deepCleanTag}>
              <Text style={s.deepCleanTagText}>DEEP CLEAN</Text>
            </View>
          )}
        </View>
        <Text style={[s.carPlate, isDone && s.textMuted]}>
          CAR {car.carPlate}
          {(car.carMake || car.carModel)
            ? ` · ${[car.carMake, car.carModel].filter(Boolean).join(' ')}`
            : ''}
          {car.parkingNumber ? ` · PARKING ${car.parkingNumber}` : ''}
        </Text>
        {!isDone && (
          urgency === 'overdue' ? (
            <View style={[s.urgencyChip, s.urgencyOverdue]}>
              <Text style={[s.urgencyChipText, { color: c.danger }]}>OVERDUE · {formatSlot(car.preferredTime)}</Text>
            </View>
          ) : urgency === 'due-soon' ? (
            <View style={[s.urgencyChip, s.urgencyDueSoon]}>
              <Text style={[s.urgencyChipText, { color: c.info }]}>DUE · {formatSlot(car.preferredTime)}</Text>
            </View>
          ) : (
            <Text style={s.urgencyLater}>{formatSlot(car.preferredTime)}</Text>
          )
        )}
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
    headerCount:           { fontFamily: typography.mono, fontSize: 12, color: c.fg3, letterSpacing: 0.4 },
    carList:               { paddingHorizontal: spacing[5], paddingTop: spacing[3], gap: spacing[2] },
    emptyList:             { paddingVertical: spacing[6], paddingHorizontal: spacing[5] },
    emptyListText:         { fontFamily: typography.sans, fontSize: 13, color: c.fg3, textAlign: 'center', lineHeight: 20 },
    carRow:                { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: 12 },
    carRowDone:            { opacity: 0.5 },
    carStatusIcon:         { flexShrink: 0 },
    carInfo:               { flex: 1, gap: 3 },
    carInfoTop:            { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    carUnit:               { fontFamily: typography.mono, fontSize: 11, color: c.sageHi, letterSpacing: 0.6 },
    carName:               { fontFamily: typography.sansMedium, fontSize: 13, color: c.fg, flex: 1 },
    deepCleanTag:          { flexShrink: 0, backgroundColor: c.info + '26', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
    deepCleanTagText:      { fontFamily: typography.mono, fontSize: 8.5, color: c.info, letterSpacing: 0.4 },
    carPlate:              { fontFamily: typography.mono, fontSize: 10.5, color: c.fg3, letterSpacing: 0.5 },
    textMuted:             { color: c.fg4 },
    urgencyChip:           { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
    urgencyOverdue:        { backgroundColor: c.danger + '26' },
    urgencyDueSoon:        { backgroundColor: c.info + '26' },
    urgencyChipText:       { fontFamily: typography.mono, fontSize: 8.5, letterSpacing: 0.4 },
    urgencyLater:          { fontFamily: typography.mono, fontSize: 9, color: c.fg3, letterSpacing: 0.4, marginTop: 2 },
    carAction:             { borderRadius: radii.pill, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 12, minWidth: 72, alignItems: 'center' },
    carActionStart:        { backgroundColor: c.sage, borderColor: c.sage },
    carActionDone:         { backgroundColor: c.success, borderColor: c.success },
    carActionText:         { fontFamily: typography.mono, fontSize: 10.5, color: '#fff', letterSpacing: 0.6 },
  });
}
