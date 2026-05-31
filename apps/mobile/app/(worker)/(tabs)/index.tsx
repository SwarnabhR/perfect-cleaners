import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation, MapPin, Clock, ChevronRight } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import type { BookingStatus, Worker } from '@pc/firebase';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';

interface JobRow {
  id:          string;
  bookingRef:  string;
  status:      BookingStatus;
  customerName: string;
  car:         string;
  address:     string;
  service:     string;
  scheduledAt: Date;
  total:       number;
}

function toJobRow(d: FirebaseFirestoreTypes.QueryDocumentSnapshot): JobRow {
  const data = d.data();
  const at: Date = data.scheduledAt?.toDate?.() ?? new Date(data.scheduledAt ?? 0);
  return {
    id:           d.id,
    bookingRef:   data.bookingRef ?? d.id.slice(-6).toUpperCase(),
    status:       data.status as BookingStatus,
    customerName: data.customerName ?? '—',
    car:          [data.vehicle?.make, data.vehicle?.model].filter(Boolean).join(' '),
    address:      [data.address?.line1, data.address?.city].filter(Boolean).join(', '),
    service:      (data.serviceIds?.[0] ?? '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    scheduledAt:  at,
    total:        data.priceBreakdown?.total ?? 0,
  };
}

export default function WorkerHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c      = useThemeColors();
  const ss     = useSharedStyles();

  const [worker,    setWorker]    = useState<(Worker & { id: string }) | null>(null);
  const [jobs,      setJobs]      = useState<JobRow[]>([]);
  const [toggling,  setToggling]  = useState(false);
  const [loading,   setLoading]   = useState(true);

  const uid = auth().currentUser?.uid;

  // Live worker profile
  useEffect(() => {
    if (!uid) return;
    return firestore().collection('workers').doc(uid).onSnapshot(snap => {
      if (snap.exists()) setWorker({ ...(snap.data() as Worker), id: snap.id });
    });
  }, [uid]);

  // Live jobs assigned to this worker
  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    return firestore()
      .collection('bookings')
      .where('workerId', '==', uid)
      .onSnapshot(snap => {
        setJobs([...snap.docs.map(toJobRow)].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()));
        setLoading(false);
      }, () => setLoading(false));
  }, [uid]);

  async function toggleOnline() {
    if (!uid || !worker || toggling) return;
    setToggling(true);
    await firestore().collection('workers').doc(uid).update({ isOnline: !worker.isOnline });
    setToggling(false);
  }

  const activeJob    = jobs.find(j => j.status === 'inprogress' || j.status === 'enroute');
  const upcomingJobs = jobs.filter(j => j.status === 'assigned');
  const doneToday    = jobs.filter(j => j.status === 'done').length;

  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (worker?.name ?? 'Worker').split(' ')[0];

  const initials = (worker?.name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
    greeting: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 36, height: 36, borderRadius: 999, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: typography.sansSemiBold, fontSize: 14, color: '#fff' },
    greetingText: { fontFamily: typography.sansMedium, fontSize: typography.lg, color: c.fg, letterSpacing: -0.2 },
    toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: c.lineFaint, borderWidth: 1, borderColor: c.line },
    toggleOn: { backgroundColor: c.sageFaint, borderColor: c.sageBorder },
    dot: { width: 7, height: 7, borderRadius: 999 },
    dotOn:  { backgroundColor: c.success },
    dotOff: { backgroundColor: c.fg3 },
    toggleText:   { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8, color: c.fg2, textTransform: 'uppercase' },
    toggleTextOn: { color: c.fg },
    statsStrip: { flexDirection: 'row', paddingHorizontal: spacing[5], gap: 8, marginTop: spacing[3] },
    statCard: { flex: 1, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: 12, gap: 6 },
    statValue: { fontFamily: typography.sansSemiBold, fontSize: 22, color: c.fg, letterSpacing: -0.3 },
    activeJob: { paddingHorizontal: spacing[5], marginTop: spacing[4] },
    activeJobInner: { backgroundColor: c.card, borderWidth: 1, borderColor: c.lineStrong, borderRadius: radii.lg, padding: 18, gap: 16 },
    activeJobHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: c.lineFaint, borderWidth: 1, borderColor: c.line },
    badgeDot: { width: 6, height: 6, borderRadius: 999 },
    badgeText: { fontFamily: typography.sans, fontSize: 11, color: c.fg2 },
    activeJobBody: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    activeJobInfo: { flex: 1 },
    activeJobName:    { fontFamily: typography.sansMedium, fontSize: 15, color: c.fg },
    activeJobCar:     { fontFamily: typography.sans, fontSize: 12, color: c.fg2 },
    activeJobService: { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.6, marginTop: 2 },
    activeJobAddress: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: c.lineFaint, borderRadius: 10, borderWidth: 1, borderColor: c.line },
    activeJobAddressText: { flex: 1, fontFamily: typography.sans, fontSize: 12, color: c.fg2 },
    activeJobTime: { fontFamily: typography.mono, fontSize: 11, color: c.fg },
    activeJobActions: { flexDirection: 'row', gap: 8 },
    sectionHead: { paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[2] },
    upcomingList: { paddingHorizontal: spacing[5], gap: 8 },
    upcomingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: 14 },
    upcomingTime: { minWidth: 56, alignItems: 'center', paddingVertical: 4, borderRightWidth: 1, borderRightColor: c.line, marginRight: 4 },
    upcomingTimeAmPm: { fontFamily: typography.mono, fontSize: 10, color: c.fg3 },
    upcomingTimeHour: { fontFamily: typography.sansMedium, fontSize: typography.lg, color: c.fg },
    upcomingInfo: { flex: 1 },
    upcomingName:    { fontFamily: typography.sansMedium, fontSize: 13, color: c.fg },
    upcomingCar:     { fontFamily: typography.sans, fontSize: 11, color: c.fg2 },
    upcomingService: { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.6, marginTop: 2 },
    emptyCard: { marginHorizontal: spacing[5], marginTop: spacing[4], backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: spacing[8], alignItems: 'center', gap: spacing[2] },
    emptyTitle: { fontFamily: typography.serif, fontSize: 20, color: c.fg, letterSpacing: -0.2 },
    emptyBody:  { fontFamily: typography.sans, fontSize: 13, color: c.fg2, textAlign: 'center', lineHeight: 20 },
  });

  const statusLabel = (status: BookingStatus) =>
    status === 'enroute' ? 'EN ROUTE' : 'IN PROGRESS';

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: spacing[10] }} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={s.greeting}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={ss.eyebrow}>{now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}</Text>
            <Text style={s.greetingText}>{greeting}, {firstName}. 👋</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[s.toggle, worker?.isOnline && s.toggleOn]}
          onPress={toggleOnline}
          disabled={toggling}
        >
          <View style={[s.dot, worker?.isOnline ? s.dotOn : s.dotOff]} />
          <Text style={[s.toggleText, worker?.isOnline && s.toggleTextOn]}>
            {worker?.isOnline ? 'ON DUTY' : 'OFF DUTY'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={s.statsStrip}>
        {[
          { label: 'JOBS TODAY',   value: String(upcomingJobs.length + (activeJob ? 1 : 0)) },
          { label: 'COMPLETED',    value: String(doneToday) },
          { label: 'EARNED TODAY', value: `₹${(worker?.earnings?.today ?? 0).toLocaleString('en-IN')}` },
        ].map(({ label, value }) => (
          <View key={label} style={s.statCard}>
            <Text style={ss.eyebrow}>{label}</Text>
            <Text style={s.statValue}>{value}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={c.fg3} />
      ) : (
        <>
          {/* Active job card */}
          {activeJob && (
            <View style={s.activeJob}>
              <View style={s.activeJobInner}>
                <View style={s.activeJobHead}>
                  <Text style={ss.eyebrow}>[ACTIVE JOB] · PC-{activeJob.bookingRef}</Text>
                  <View style={s.badge}>
                    <View style={[s.badgeDot, { backgroundColor: c.statusEnroute }]} />
                    <Text style={s.badgeText}>{statusLabel(activeJob.status)}</Text>
                  </View>
                </View>
                <View style={s.activeJobBody}>
                  <View style={s.activeJobInfo}>
                    <Text style={s.activeJobName}>{activeJob.customerName}</Text>
                    <Text style={s.activeJobCar}>{activeJob.car}</Text>
                    <Text style={s.activeJobService}>{activeJob.service.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={s.activeJobAddress}>
                  <MapPin size={14} color={c.fg2} strokeWidth={1.5} />
                  <Text style={s.activeJobAddressText}>{activeJob.address || '—'}</Text>
                  <Clock size={12} color={c.fg3} strokeWidth={1.5} />
                  <Text style={s.activeJobTime}>
                    {activeJob.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={s.activeJobActions}>
                  <TouchableOpacity
                    style={[ss.ghostBtn, { flex: 1, flexDirection: 'row', gap: 8 }]}
                    onPress={() => {
                      const addr = encodeURIComponent(activeJob.address || '');
                      Linking.openURL(`https://maps.google.com/?q=${addr}`).catch(() => {});
                    }}
                  >
                    <Navigation size={14} color={c.fg} strokeWidth={1.5} />
                    <Text style={ss.ghostBtnText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[ss.primaryBtn, { flex: 2 }]}
                    onPress={() => router.push({ pathname: '/(worker)/job-detail', params: { bookingId: activeJob.id } })}
                  >
                    <Text style={ss.primaryBtnText}>Open Job →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Upcoming jobs */}
          {upcomingJobs.length > 0 && (
            <>
              <View style={s.sectionHead}>
                <Text style={ss.eyebrow}>[UPCOMING TODAY] · {upcomingJobs.length} JOBS</Text>
              </View>
              <View style={s.upcomingList}>
                {upcomingJobs.map(j => {
                  const timeStr = j.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                  const [hm, ampm] = timeStr.split(' ');
                  return (
                    <TouchableOpacity
                      key={j.id}
                      style={s.upcomingCard}
                      onPress={() => router.push({ pathname: '/(worker)/job-detail', params: { bookingId: j.id } })}
                    >
                      <View style={s.upcomingTime}>
                        <Text style={s.upcomingTimeAmPm}>{ampm}</Text>
                        <Text style={s.upcomingTimeHour}>{hm}</Text>
                      </View>
                      <View style={s.upcomingInfo}>
                        <Text style={s.upcomingName}>{j.customerName}</Text>
                        <Text style={s.upcomingCar}>{j.car}</Text>
                        <Text style={s.upcomingService}>{j.service.toUpperCase()}</Text>
                      </View>
                      <ChevronRight size={14} color={c.fg3} strokeWidth={1.5} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Empty state */}
          {!activeJob && upcomingJobs.length === 0 && (
            <View style={s.emptyCard}>
              <Text style={s.emptyTitle}>No jobs today.</Text>
              <Text style={s.emptyBody}>
                {worker?.isOnline
                  ? 'You\'re on duty — jobs will appear here when assigned.'
                  : 'Go on duty to receive job assignments.'}
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
