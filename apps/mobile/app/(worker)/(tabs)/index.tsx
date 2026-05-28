import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation, MapPin, Clock, ChevronRight } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';

const JOBS_TODAY = [
  { time: '12:30 PM', name: 'Priya Singh',   car: 'Honda City — Pearl White',       service: 'Exterior Wash'    },
  { time: '2:00 PM',  name: 'Vikram Patel',  car: 'Audi Q5 — Phantom Black',        service: 'Premium + Coat'   },
  { time: '4:30 PM',  name: 'Neha Kapoor',   car: 'Maruti Brezza — Silky Silver',   service: 'Interior Detail'  },
  { time: '6:15 PM',  name: 'Sameer Khan',   car: 'Tata Harrier — Calypso Red',     service: 'Exterior Wash'    },
];

export default function WorkerHome() {
  const [available, setAvailable] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useThemeColors();
  const ss = useSharedStyles();

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },

    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing[5], paddingBottom: spacing[3],
    },
    greeting: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: {
      width: 36, height: 36, borderRadius: 999, backgroundColor: c.sage,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontFamily: typography.sansSemiBold, fontSize: 14, color: '#fff' },
    greetingText: { fontFamily: typography.sansMedium, fontSize: typography.lg, color: c.fg, letterSpacing: -0.2 },
    toggle: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999,
      backgroundColor: c.lineFaint,
      borderWidth: 1, borderColor: c.line,
    },
    toggleOn: { backgroundColor: c.sageFaint, borderColor: c.sageBorder },
    dot: { width: 7, height: 7, borderRadius: 999 },
    dotOn:  { backgroundColor: c.success },
    dotOff: { backgroundColor: c.fg3 },
    toggleText:   { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8, color: c.fg2, textTransform: 'uppercase' },
    toggleTextOn: { color: c.fg },

    statsStrip: { flexDirection: 'row', paddingHorizontal: spacing[5], gap: 8, marginTop: spacing[3] },
    statCard: {
      flex: 1, backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, padding: 12, gap: 6,
    },
    statValue: { fontFamily: typography.sansSemiBold, fontSize: 22, color: c.fg, letterSpacing: -0.3 },

    activeJob: { paddingHorizontal: spacing[5], marginTop: spacing[4] },
    activeJobInner: {
      backgroundColor: c.card, borderWidth: 1, borderColor: c.lineStrong,
      borderRadius: radii.lg, padding: 18, gap: 16,
    },
    activeJobHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999,
      backgroundColor: c.lineFaint, borderWidth: 1, borderColor: c.line,
    },
    badgeDot: { width: 6, height: 6, borderRadius: 999 },
    badgeText: { fontFamily: typography.sans, fontSize: 11, color: c.fg2 },

    activeJobBody: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    carSilhouette: {
      width: 86, height: 60, borderRadius: radii.sm, overflow: 'hidden',
      backgroundColor: c.cardHi, borderWidth: 1, borderColor: c.line,
      alignItems: 'center', justifyContent: 'center',
    },
    carShape: {
      width: 70, height: 30, borderRadius: 6,
      backgroundColor: c.ink, borderWidth: 1, borderColor: c.lineStrong,
    },
    activeJobInfo: { flex: 1 },
    activeJobName:    { fontFamily: typography.sansMedium, fontSize: 15, color: c.fg },
    activeJobCar:     { fontFamily: typography.sans, fontSize: 12, color: c.fg2 },
    activeJobService: { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.6, marginTop: 2 },
    activeJobAddress: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 10, paddingHorizontal: 12,
      backgroundColor: c.lineFaint, borderRadius: 10,
      borderWidth: 1, borderColor: c.line,
    },
    activeJobAddressText: { flex: 1, fontFamily: typography.sans, fontSize: 12, color: c.fg2 },
    activeJobTime: { fontFamily: typography.mono, fontSize: 11, color: c.fg },
    activeJobActions: { flexDirection: 'row', gap: 8 },

    sectionHead: { paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[2] },
    upcomingList: { paddingHorizontal: spacing[5], gap: 8 },
    upcomingCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, padding: 14,
    },
    upcomingTime: {
      minWidth: 56, alignItems: 'center', paddingVertical: 4,
      borderRightWidth: 1, borderRightColor: c.line, marginRight: 4,
    },
    upcomingTimeAmPm: { fontFamily: typography.mono, fontSize: 10, color: c.fg3 },
    upcomingTimeHour: { fontFamily: typography.sansMedium, fontSize: typography.lg, color: c.fg },
    upcomingInfo: { flex: 1 },
    upcomingName:    { fontFamily: typography.sansMedium, fontSize: 13, color: c.fg },
    upcomingCar:     { fontFamily: typography.sans, fontSize: 11, color: c.fg2 },
    upcomingService: { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.6, marginTop: 2 },
  });

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
            <Text style={s.avatarText}>RS</Text>
          </View>
          <View>
            <Text style={ss.eyebrow}>MON, 26 MAY</Text>
            <Text style={s.greetingText}>Good morning, Rahul. 👋</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[s.toggle, available && s.toggleOn]}
          onPress={() => setAvailable(!available)}
        >
          <View style={[s.dot, available ? s.dotOn : s.dotOff]} />
          <Text style={[s.toggleText, available && s.toggleTextOn]}>
            {available ? 'ON DUTY' : 'OFF DUTY'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={s.statsStrip}>
        {[
          ['JOBS TODAY',    '4'],
          ['THIS WEEK',     '23'],
          ['EARNED TODAY',  '₹2,140'],
        ].map(([k, v]) => (
          <View key={k} style={s.statCard}>
            <Text style={ss.eyebrow}>{k}</Text>
            <Text style={s.statValue}>{v}</Text>
          </View>
        ))}
      </View>

      {/* Active job card */}
      <View style={s.activeJob}>
        <View style={s.activeJobInner}>
          <View style={s.activeJobHead}>
            <Text style={ss.eyebrow}>[ACTIVE JOB] · #PC-2058</Text>
            <View style={s.badge}>
              <View style={[s.badgeDot, { backgroundColor: c.statusEnroute }]} />
              <Text style={s.badgeText}>EN ROUTE</Text>
            </View>
          </View>
          <View style={s.activeJobBody}>
            <View style={s.carSilhouette}>
              <View style={s.carShape} />
            </View>
            <View style={s.activeJobInfo}>
              <Text style={s.activeJobName}>Aarav Mehta</Text>
              <Text style={s.activeJobCar}>BMW 3 Series · DL 4C AB 1234</Text>
              <Text style={s.activeJobService}>PREMIUM WASH + INTERIOR</Text>
            </View>
          </View>
          <View style={s.activeJobAddress}>
            <MapPin size={14} color={c.fg2} strokeWidth={1.5} />
            <Text style={s.activeJobAddressText}>B-204, Kavi Nagar, Ghaziabad</Text>
            <Clock size={12} color={c.fg3} strokeWidth={1.5} />
            <Text style={s.activeJobTime}>10:30 AM</Text>
          </View>
          <View style={s.activeJobActions}>
            <TouchableOpacity style={[ss.ghostBtn, { flex: 1, flexDirection: 'row', gap: 8 }]}>
              <Navigation size={14} color={c.fg} strokeWidth={1.5} />
              <Text style={ss.ghostBtnText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ss.primaryBtn, { flex: 2 }]}
              onPress={() => router.push('/(worker)/job-detail')}
            >
              <Text style={ss.primaryBtnText}>Start Job →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Upcoming jobs */}
      <View style={s.sectionHead}>
        <Text style={ss.eyebrow}>[UPCOMING TODAY] · 4 JOBS</Text>
      </View>
      <View style={s.upcomingList}>
        {JOBS_TODAY.map((j, i) => (
          <TouchableOpacity
            key={i}
            style={s.upcomingCard}
            onPress={() => router.push('/(worker)/job-detail')}
          >
            <View style={s.upcomingTime}>
              <Text style={s.upcomingTimeAmPm}>{j.time.split(' ')[1]}</Text>
              <Text style={s.upcomingTimeHour}>{j.time.split(' ')[0]}</Text>
            </View>
            <View style={s.upcomingInfo}>
              <Text style={s.upcomingName}>{j.name}</Text>
              <Text style={s.upcomingCar}>{j.car}</Text>
              <Text style={s.upcomingService}>{j.service.toUpperCase()}</Text>
            </View>
            <ChevronRight size={14} color={c.fg3} strokeWidth={1.5} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
