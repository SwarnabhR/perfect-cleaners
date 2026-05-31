import { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Phone, Star, Clock, Shield, Sparkles, ChevronRight, Building2, CheckCircle2 } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import type { CleaningLog } from '@pc/firebase';
import auth from '@react-native-firebase/auth';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';

const BRAND_HERO = require('../../../../../design-system/assets/brand-hero.png');

const SERVICES = [
  {
    num: '01', name: 'Interior Detailing',
    price: '₹500 – ₹1,000', duration: '90 min',
    body: 'Deep vacuum, dashboard wipe, seat shampoo, and air vent cleaning.',
  },
  {
    num: '02', name: 'Exterior Wash',
    price: '₹200 – ₹500', duration: '45 min',
    body: 'Foam pre-wash, hand wash, rinse, and blow-dry finish.',
  },
  {
    num: '03', name: 'Paint Protection',
    price: '₹4,000 – ₹50,000', duration: '1–3 days',
    body: 'Ceramic coating or PPF for lasting gloss and defence.',
  },
] as const;

const USPS = [
  { icon: Star,     label: 'Certified Professionals' },
  { icon: Clock,    label: 'On-Time Guarantee'       },
  { icon: Shield,   label: 'Damage-Free Promise'     },
  { icon: Sparkles, label: 'Premium Products Only'   },
] as const;

interface SocietyInfo {
  societyName: string;
  unitNumber: string;
}

interface LastClean {
  vehicleRegistration: string;
  cleanedAt: Date;
  serviceType: string;
}

function formatCleanedAt(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function CustomerHome() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const c       = useThemeColors();
  const ss      = useSharedStyles();
  const { width: SW } = useWindowDimensions();

  const [societyInfo, setSocietyInfo] = useState<SocietyInfo | null>(null);
  const [lastClean,   setLastClean]   = useState<LastClean | null>(null);

  const s = makeStyles(c);

  // Fetch society info + last cleaning record for this customer
  useEffect(() => {
    let cancelled = false;

    async function load(uid: string) {
      try {
        const snap = await firestore().collection('customers').doc(uid).get();
        if (cancelled || !snap.exists) return;

        const data = snap.data() as any;
        if (data.societyId && data.unitNumber) {
          setSocietyInfo({ societyName: data.societyName ?? 'Your Society', unitNumber: data.unitNumber });

          const logsSnap = await firestore()
            .collection('cleaningLogs')
            .where('customerId', '==', uid)
            .orderBy('cleanedAt', 'desc')
            .limit(1)
            .get();

          if (cancelled || logsSnap.empty) return;

          const log = logsSnap.docs[0].data() as CleaningLog;
          const cleanedAt: Date = (log.cleanedAt as any)?.toDate?.() ?? new Date(log.cleanedAt as any);

          setLastClean({
            vehicleRegistration: log.vehicleRegistration,
            cleanedAt,
            serviceType: log.serviceType,
          });
        }
      } catch {
        // Society info is non-critical; silent failure is acceptable here
      }
    }

    // Use an auth state listener so the effect re-runs after cold-start
    // token rehydration, not just at mount time.
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (!user) return;
      load(user.uid);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const BellButton = (
    <TouchableOpacity style={[s.bell, { backgroundColor: c.card, borderColor: c.line }]}>
      <Bell size={18} color={c.fg2} strokeWidth={1.5} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={[s.content, { paddingBottom: spacing[8] }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <TabTopBar showLocation right={BellButton} />
      </View>

      {/* Society card — shown when resident is linked to a partner society */}
      {societyInfo && (
        <View style={[s.societyCard, { marginHorizontal: spacing[5], borderColor: c.line, backgroundColor: c.card }]}>
          <View style={s.societyRow}>
            <View style={[s.societyIcon, { backgroundColor: c.sage }]}>
              <Building2 size={16} color={c.ink} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.societyName, { color: c.fg }]}>{societyInfo.societyName}</Text>
              <Text style={[s.societyUnit, { color: c.fg3 }]}>Unit {societyInfo.unitNumber}</Text>
            </View>
            <View style={[s.activePill, { backgroundColor: c.sage + '22', borderColor: c.sage + '55' }]}>
              <View style={[s.activeDot, { backgroundColor: c.sageHi }]} />
              <Text style={[s.activeText, { color: c.sageHi }]}>Active</Text>
            </View>
          </View>

          {/* Last clean status */}
          <View style={[s.lastCleanRow, { borderTopColor: c.line }]}>
            {lastClean ? (
              <>
                <CheckCircle2 size={14} color={c.sageHi} strokeWidth={1.5} />
                <Text style={[s.lastCleanText, { color: c.fg2 }]}>
                  <Text style={{ color: c.fg, fontFamily: typography.sansMedium }}>
                    {lastClean.vehicleRegistration}
                  </Text>
                  {' '}cleaned {formatCleanedAt(lastClean.cleanedAt)} · {lastClean.serviceType}
                </Text>
              </>
            ) : (
              <>
                <Clock size={14} color={c.fg3} strokeWidth={1.5} />
                <Text style={[s.lastCleanText, { color: c.fg3 }]}>Awaiting first scheduled clean</Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Hero card */}
      <View style={[s.hero, { width: SW - spacing[6] * 2, marginHorizontal: spacing[6], borderColor: c.line, backgroundColor: c.card }]}>
        <ImageBackground source={BRAND_HERO} style={s.heroBg} imageStyle={s.heroImg}>
          <View style={s.heroOverlay}>
            <Text style={ss.eyebrow}>[PERFECT CLEANERS] · DELHI NCR</Text>
            {societyInfo ? (
              <>
                <Text style={s.heroTitle}>Your car,{'\n'}showroom clean.</Text>
                <Text style={s.heroSub}>Professional cleaning by your society schedule. Need something extra? Book a premium add-on.</Text>
                <TouchableOpacity
                  style={ss.primaryBtn}
                  onPress={() => router.push('/(customer)/booking')}
                  activeOpacity={0.85}
                >
                  <Text style={ss.primaryBtnText}>Book Premium Add-on →</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.heroTitle}>Your car,{'\n'}showroom clean.</Text>
                <Text style={s.heroSub}>At-home car wash & detailing · Book in 30 seconds.</Text>
                <TouchableOpacity
                  style={ss.primaryBtn}
                  onPress={() => router.push('/(customer)/booking')}
                  activeOpacity={0.85}
                >
                  <Text style={ss.primaryBtnText}>Book a Wash →</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ImageBackground>
      </View>

      {/* USPs */}
      <View style={s.uspRow}>
        {USPS.map(({ icon: Icon, label }) => (
          <View key={label} style={[s.uspChip, { backgroundColor: c.card, borderColor: c.line }]}>
            <Icon size={13} color={c.sageHi} strokeWidth={1.5} />
            <Text style={[s.uspLabel, { color: c.fg2 }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Services */}
      <View style={s.section}>
        <Text style={ss.eyebrow}>
          {societyInfo ? '[PREMIUM ADD-ONS]' : '[OUR SERVICES]'}
        </Text>
        <View style={s.svcList}>
          {SERVICES.map(svc => (
            <TouchableOpacity
              key={svc.num}
              style={[s.svcCard, { backgroundColor: c.card, borderColor: c.line }]}
              onPress={() => router.push({ pathname: '/(customer)/booking', params: { service: svc.num } })}
              activeOpacity={0.75}
            >
              <View style={s.svcHead}>
                <Text style={[s.svcNum, { color: c.fg3 }]}>{svc.num}</Text>
                <Text style={[s.svcName, { color: c.fg }]}>{svc.name}</Text>
                <ChevronRight size={14} color={c.fg3} strokeWidth={1.5} />
              </View>
              <Text style={[s.svcBody, { color: c.fg2 }]}>{svc.body}</Text>
              <View style={s.svcMeta}>
                <Text style={[s.svcPrice, { color: c.fg }]}>{svc.price}</Text>
                <Text style={[s.svcDur, { color: c.fg3 }]}>· {svc.duration}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* WhatsApp CTA */}
      <View style={s.section}>
        <TouchableOpacity style={[s.waCta, { backgroundColor: c.card, borderColor: c.line }]} activeOpacity={0.8}>
          <Phone size={16} color={c.sageHi} strokeWidth={1.5} />
          <Text style={[s.waText, { color: c.fg }]}>Chat on WhatsApp</Text>
          <ChevronRight size={14} color={c.fg3} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    content:        { gap: spacing[5] },
    bell:           { width: 36, height: 36, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    hero:           { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden', minHeight: 260 },
    heroBg:         { flex: 1 },
    heroImg:        { resizeMode: 'cover', opacity: 0.35 },
    heroOverlay:    { padding: spacing[5], gap: spacing[3], flex: 1, justifyContent: 'flex-end' },
    heroTitle:      { fontFamily: typography.serif, fontSize: 32, color: '#fff', letterSpacing: -0.4, lineHeight: 38 },
    heroSub:        { fontFamily: typography.sans, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 19 },
    uspRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingHorizontal: spacing[5] },
    uspChip:        { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
    uspLabel:       { fontFamily: typography.sans, fontSize: 11.5 },
    section:        { paddingHorizontal: spacing[5], gap: spacing[3] },
    svcList:        { gap: spacing[2] },
    svcCard:        { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: spacing[2] },
    svcHead:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
    svcNum:         { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8 },
    svcName:        { flex: 1, fontFamily: typography.sansMedium, fontSize: 14 },
    svcBody:        { fontFamily: typography.sans, fontSize: 12.5, lineHeight: 18 },
    svcMeta:        { flexDirection: 'row', gap: 6, alignItems: 'baseline' },
    svcPrice:       { fontFamily: typography.sansSemiBold, fontSize: 13 },
    svcDur:         { fontFamily: typography.mono, fontSize: 10.5, letterSpacing: 0.4 },
    waCta:          { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radii.md, padding: 14 },
    waText:         { flex: 1, fontFamily: typography.sansMedium, fontSize: 14 },
    // Society card
    societyCard:    { borderRadius: radii.md, borderWidth: 1, overflow: 'hidden' },
    societyRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing[4] },
    societyIcon:    { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    societyName:    { fontFamily: typography.sansSemiBold, fontSize: 14 },
    societyUnit:    { fontFamily: typography.mono, fontSize: 11, letterSpacing: 0.5, marginTop: 1 },
    activePill:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
    activeDot:      { width: 6, height: 6, borderRadius: 999 },
    activeText:     { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.4 },
    lastCleanRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderTopWidth: 1 },
    lastCleanText:  { fontFamily: typography.sans, fontSize: 12.5, flex: 1, lineHeight: 18 },
  });
}
