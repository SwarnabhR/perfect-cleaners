import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2 } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { Worker } from '@pc/firebase';
import { getAssignedSocieties, resolveTowerGroups } from '@pc/firebase';
import type { TowerGroupSummary } from '@pc/firebase';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import { Group, Row } from '../../../components/RowGroup';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionSummary {
  id: string;
  societyId: string;
  societyName: string;
  tower: string;
  scheduledDate: Date;
  totalCars: number;
  completedCars: number;
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WorkerHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c      = useThemeColors();
  const ss     = useSharedStyles();

  const [worker,   setWorker]   = useState<(Worker & { id: string }) | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(false);

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

    return firestore()
      .collection('cleaningSessions')
      .where('workerIds', 'array-contains', uid)
      .onSnapshot(snap => {
        const todaysSessions: SessionSummary[] = [];

        snap.docs.forEach(d => {
          const data = d.data() as any;
          const scheduledDate = data.scheduledDate?.toDate?.() ?? data.scheduledDate;
          if (!scheduledDate) return;
          const sessionDate = scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
          if (!isLocalDateMatch(sessionDate, today)) return;

          todaysSessions.push({
            id: d.id,
            societyId: data.societyId ?? '',
            societyName: data.societyName ?? '',
            tower: data.tower ?? '',
            scheduledDate: sessionDate,
            totalCars: data.totalCars ?? (data.cars ?? []).length,
            completedCars: data.completedCars ?? 0,
          });
        });

        setSessions(todaysSessions);
        setLoading(false);
      }, err => {
        console.warn('[WorkerHome] sessions:', err.message);
        setLoading(false);
      });
  }, [uid]);

  const towerGroups: TowerGroupSummary[] = resolveTowerGroups(sessions);

  const total = towerGroups.reduce((sum, g) => sum + g.totalCars, 0);
  const done  = towerGroups.reduce((sum, g) => sum + g.completedCars, 0);
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

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
            <View style={[s.progressBadge, pct === 100 && total > 0 && s.progressBadgeDone]}>
              <Text style={[s.progressBadgeText, pct === 100 && total > 0 && s.progressBadgeTextDone]}>
                {done}/{total} done
              </Text>
            </View>
          </View>

          {total > 0 && (
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${pct}%` as any }]} />
            </View>
          )}
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

      {/* Towers list */}
      {assignedSocieties.length > 0 && (
        <>
          {loading ? (
            <ActivityIndicator style={{ marginTop: spacing[8] }} color={c.fg3} />
          ) : towerGroups.length === 0 ? (
            <View style={s.emptyList}>
              <Text style={s.emptyListText}>
                No cars scheduled for today. Sessions are created by your admin.
              </Text>
            </View>
          ) : (
            <Group header="TODAY'S TOWERS">
              {towerGroups.map((group, i) => (
                <Row
                  key={group.key}
                  icon={<Building2 size={16} color={c.sageInk} strokeWidth={1.5} />}
                  title={group.tower}
                  sub={group.societyName}
                  value={`${group.openCars} open`}
                  onPress={() => router.push({
                    pathname: '/(worker)/tower-detail',
                    params: { societyId: group.societyId, tower: group.tower },
                  })}
                  isLast={i === towerGroups.length - 1}
                />
              ))}
            </Group>
          )}
        </>
      )}
    </ScrollView>
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
    noSocietyCard:         { marginHorizontal: spacing[5], marginTop: spacing[4], backgroundColor: c.card, borderRadius: radii.lg, borderWidth: 1, borderColor: c.line, padding: spacing[8], alignItems: 'center', gap: spacing[3] },
    noSocietyTitle:        { fontFamily: typography.serif, fontSize: 18, color: c.fg, letterSpacing: -0.2 },
    noSocietyBody:         { fontFamily: typography.sans, fontSize: 13, color: c.fg2, textAlign: 'center', lineHeight: 20 },
    emptyList:             { paddingVertical: spacing[6], paddingHorizontal: spacing[5] },
    emptyListText:         { fontFamily: typography.sans, fontSize: 13, color: c.fg3, textAlign: 'center', lineHeight: 20 },
  });
}
