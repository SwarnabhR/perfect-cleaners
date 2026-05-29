import { ImageBackground, ScrollView, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Phone, Star, Clock, Shield, Sparkles, ChevronRight } from 'lucide-react-native';
import { typography, spacing, radii, layout } from '@pc/tokens';
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

export default function CustomerHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c      = useThemeColors();
  const ss     = useSharedStyles();
  const { width: SW } = useWindowDimensions();

  const s = makeStyles(c);

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

      {/* Hero card */}
      <View style={[s.hero, { width: SW - spacing[6] * 2, marginHorizontal: spacing[6], borderColor: c.line, backgroundColor: c.card }]}>
        <ImageBackground source={BRAND_HERO} style={s.heroBg} imageStyle={s.heroImg}>
          <View style={s.heroOverlay}>
            <Text style={ss.eyebrow}>[PERFECT CLEANERS] · DELHI NCR</Text>
            <Text style={s.heroTitle}>Your car,{'\n'}showroom clean.</Text>
            <Text style={s.heroSub}>At-home car wash & detailing · Book in 30 seconds.</Text>
            <TouchableOpacity
              style={ss.primaryBtn}
              onPress={() => router.push('/(customer)/booking')}
              activeOpacity={0.85}
            >
              <Text style={ss.primaryBtnText}>Book a Wash →</Text>
            </TouchableOpacity>
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
        <Text style={ss.eyebrow}>[OUR SERVICES]</Text>
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
    content:     { gap: spacing[5] },
    bell:        { width: 36, height: 36, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    hero:        { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden', minHeight: 260 },
    heroBg:      { flex: 1 },
    heroImg:     { resizeMode: 'cover', opacity: 0.35 },
    heroOverlay: { padding: spacing[5], gap: spacing[3], flex: 1, justifyContent: 'flex-end' },
    heroTitle:   { fontFamily: typography.serif, fontSize: 32, color: '#fff', letterSpacing: -0.4, lineHeight: 38 },
    heroSub:     { fontFamily: typography.sans, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 19 },
    uspRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], paddingHorizontal: spacing[5] },
    uspChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
    uspLabel:    { fontFamily: typography.sans, fontSize: 11.5 },
    section:     { paddingHorizontal: spacing[5], gap: spacing[3] },
    svcList:     { gap: spacing[2] },
    svcCard:     { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: spacing[2] },
    svcHead:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
    svcNum:      { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8 },
    svcName:     { flex: 1, fontFamily: typography.sansMedium, fontSize: 14 },
    svcBody:     { fontFamily: typography.sans, fontSize: 12.5, lineHeight: 18 },
    svcMeta:     { flexDirection: 'row', gap: 6, alignItems: 'baseline' },
    svcPrice:    { fontFamily: typography.sansSemiBold, fontSize: 13 },
    svcDur:      { fontFamily: typography.mono, fontSize: 10.5, letterSpacing: 0.4 },
    waCta:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radii.md, padding: 14 },
    waText:      { flex: 1, fontFamily: typography.sansMedium, fontSize: 14 },
  });
}
