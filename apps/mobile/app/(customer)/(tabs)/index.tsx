import { ImageBackground, ScrollView, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Phone, Star, Clock, Shield, Sparkles, ChevronRight } from 'lucide-react-native';
import { typography, spacing, radii, layout } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
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
  const router  = useRouter();
  const c       = useThemeColors();
  const { width: SW } = useWindowDimensions();

  // Styles that depend on theme colors — memoised by component instance
  const s = makeStyles(c);

  const BellButton = (
    <TouchableOpacity style={[s.bell, { backgroundColor: c.card, borderColor: c.line }]}>
      <Bell size={18} color={c.fg2} strokeWidth={1.5} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[s.root, { backgroundColor: c.ink }]}
      contentContainerStyle={[s.content, { paddingBottom: spacing[8] }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <TabTopBar showLocation right={BellButton} />
      </View>

      {/* Hero card */}
      <View style={[s.hero, { width: SW - spacing[6] * 2, marginHorizontal: spacing[6], borderColor: c.line, backgroundColor: c.card }]}>
        <ImageBackground source={BRAND_HERO} resizeMode="cover" style={s.heroImage}>
          <View style={s.heroTopFade} />
          <View style={s.heroBottomFade} />
          <View style={s.heroFeatured}>
            <Text style={[s.heroFeaturedText, { color: c.fg2 }]}>[FEATURED]</Text>
          </View>
          <View style={s.heroContent}>
            <Text style={[s.heroTitle, { color: c.fg }]}>Bringing Your Car's{'\n'}Shine Back to Life</Text>
            <Text style={[s.heroSub, { color: c.fg2 }]}>
              Professional detailing, advanced technology, and showroom-quality results.
            </Text>
            <View style={s.heroBtns}>
              <TouchableOpacity
                style={[s.heroBtnPrimary, { backgroundColor: c.warm }]}
                onPress={() => router.push('/(customer)/booking')}
                activeOpacity={0.8}
              >
                <Text style={[s.heroBtnPrimaryText, { color: c.ink }]}>BOOK NOW</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.heroBtnGhost, { borderColor: c.lineStrong }]} activeOpacity={0.7}>
                <Phone size={14} color={c.fg2} strokeWidth={1.5} />
                <Text style={[s.heroBtnGhostText, { color: c.fg2 }]}>CONTACT US</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Stat strip */}
      <View style={[s.statStrip, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={s.statCard}>
          <Text style={[s.statValue, { color: c.fg }]}>9K+</Text>
          <Text style={[s.statLabel, { color: c.fg3 }]}>Cars Cleaned</Text>
        </View>
        <View style={[s.statCard, { borderLeftWidth: 1, borderLeftColor: c.line }]}>
          <Text style={[s.statValue, { color: c.fg }]}>500+</Text>
          <Text style={[s.statLabel, { color: c.fg3 }]}>5-Star Reviews</Text>
        </View>
      </View>

      {/* Services intro */}
      <View style={s.section}>
        <Text style={[s.eyebrow, { color: c.fg3 }]}>OUR SERVICES</Text>
        <Text style={[s.sectionTitle, { color: c.fg }]}>What We Offer</Text>
      </View>

      {/* Service cards */}
      <View style={s.serviceList}>
        {SERVICES.map(svc => (
          <TouchableOpacity
            key={svc.num}
            style={[s.serviceCard, { backgroundColor: c.card, borderColor: c.line }]}
            onPress={() => router.push({ pathname: '/(customer)/booking', params: { service: svc.num } })}
            activeOpacity={0.75}
          >
            <View style={s.serviceCardHead}>
              <Text style={[s.serviceNum, { color: c.fg4 }]}>{svc.num}</Text>
              <View style={s.serviceMeta}>
                <Text style={[s.serviceName, { color: c.fg }]}>{svc.name}</Text>
                <Text style={[s.servicePrice, { color: c.sage }]}>{svc.price}</Text>
              </View>
              <ChevronRight size={16} color={c.fg3} strokeWidth={1.5} />
            </View>
            <Text style={[s.serviceBody, { color: c.fg3 }]}>{svc.body}</Text>
            <View style={s.serviceDurationRow}>
              <Clock size={11} color={c.fg4} strokeWidth={1.5} />
              <Text style={[s.serviceDuration, { color: c.fg4 }]}>{svc.duration}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Premium banner */}
      <View style={[s.premiumBanner, { backgroundColor: c.sageLo, borderColor: c.sage + '40' }]}>
        <Text style={[s.premiumEye, { color: c.sageInk + 'AA' }]}>PREMIUM TIER</Text>
        <Text style={[s.premiumTitle, { color: c.sageInk }]}>Elite Detailing{'\n'}& Restoration</Text>
        <Text style={[s.premiumBody, { color: c.sageInk + 'BB' }]}>
          Showroom-quality finish with machine polishing, ceramic coating, and multi-step paint correction.
        </Text>
        <TouchableOpacity
          style={[s.premiumBtn, { borderColor: c.sageInk + '60' }]}
          onPress={() => router.push({ pathname: '/(customer)/booking', params: { service: '03' } })}
          activeOpacity={0.7}
        >
          <Text style={[s.premiumBtnText, { color: c.sageInk }]}>EXPLORE PREMIUM</Text>
        </TouchableOpacity>
      </View>

      {/* USP grid */}
      <View style={s.section}>
        <Text style={[s.eyebrow, { color: c.fg3 }]}>WHY CHOOSE US</Text>
      </View>
      <View style={s.uspGrid}>
        {USPS.map(({ icon: Icon, label }) => (
          <View key={label} style={[s.uspCard, { width: (SW - spacing[6] * 2 - 8) / 2, backgroundColor: c.card, borderColor: c.line }]}>
            <Icon size={20} color={c.sage} strokeWidth={1.5} />
            <Text style={[s.uspLabel, { color: c.fg2 }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* CTA banner */}
      <View style={[s.ctaBanner, { backgroundColor: c.inkRaised, borderColor: c.lineStrong }]}>
        <Text style={[s.ctaTitle, { color: c.fg }]}>Ready for a Spotless Car?</Text>
        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: c.warm }]}
          onPress={() => router.push('/(customer)/booking')}
          activeOpacity={0.8}
        >
          <Text style={[s.ctaBtnText, { color: c.ink }]}>BOOK A SERVICE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Static styles (no color dependencies) ────────────────────────────────────
function makeStyles(_c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    root:    { flex: 1 },
    content: { gap: 0 },

    bell: {
      width: layout.tapMin, height: layout.tapMin, borderRadius: radii.pill,
      borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },

    hero: {
      height: 360, borderRadius: radii.xl, overflow: 'hidden',
      marginTop: spacing[4], marginBottom: spacing[4], borderWidth: 1,
    },
    heroImage:      { flex: 1 },
    heroTopFade:    { position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(14,13,11,0.18)' },
    heroBottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 220, backgroundColor: 'rgba(14,13,11,0.72)' },
    heroFeatured: {
      position: 'absolute', top: spacing[4], left: spacing[4],
      borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4,
      backgroundColor: 'rgba(0,0,0,0.42)', borderColor: 'rgba(255,255,255,0.18)',
    },
    heroFeaturedText: { fontFamily: typography.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
    heroContent:  { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing[5], gap: 12 },
    heroSub:      { fontFamily: typography.sans, fontSize: typography.sm, lineHeight: 20, maxWidth: 280 },
    heroTitle:    { fontFamily: typography.serif, fontSize: 30, letterSpacing: -0.5, lineHeight: 32 },
    heroBtns:     { flexDirection: 'row', gap: 10, marginTop: 2 },
    heroBtnPrimary:     { borderRadius: radii.pill, paddingHorizontal: spacing[5], paddingVertical: 10 },
    heroBtnPrimaryText: { fontFamily: typography.sansSemiBold, fontSize: typography.sm },
    heroBtnGhost:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing[4], paddingVertical: 10 },
    heroBtnGhostText: { fontFamily: typography.sans, fontSize: typography.sm },

    statStrip: {
      flexDirection: 'row', marginHorizontal: spacing[6],
      borderRadius: radii.md, borderWidth: 1, marginBottom: spacing[8],
    },
    statCard:  { flex: 1, paddingVertical: spacing[4], alignItems: 'center', gap: 2 },
    statValue: { fontFamily: typography.serif, fontSize: typography['2xl'], letterSpacing: -0.5 },
    statLabel: { fontFamily: typography.sans, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },

    section:      { paddingHorizontal: spacing[6], marginBottom: spacing[4] },
    eyebrow:      { fontFamily: typography.sans, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
    sectionTitle: { fontFamily: typography.sansMedium, fontSize: typography.xl, letterSpacing: -0.3 },

    serviceList:     { gap: 8, paddingHorizontal: spacing[6], marginBottom: spacing[8] },
    serviceCard:     { borderWidth: 1, borderRadius: radii.md, padding: spacing[5], gap: 8 },
    serviceCardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    serviceNum:      { fontFamily: typography.mono, fontSize: typography.xs },
    serviceMeta:     { flex: 1 },
    serviceName:     { fontFamily: typography.sansMedium, fontSize: typography.base },
    servicePrice:    { fontFamily: typography.sans, fontSize: typography.xs },
    serviceBody:         { fontFamily: typography.sans, fontSize: typography.sm, lineHeight: 20 },
    serviceDurationRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
    serviceDuration:     { fontFamily: typography.sans, fontSize: 11 },

    premiumBanner: { marginHorizontal: spacing[6], borderRadius: radii.xl, padding: spacing[6], marginBottom: spacing[8], gap: 12, borderWidth: 1 },
    premiumEye:    { fontFamily: typography.sans, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
    premiumTitle:  { fontFamily: typography.serif, fontSize: typography['2xl'], letterSpacing: -0.3, lineHeight: 34 },
    premiumBody:   { fontFamily: typography.sans, fontSize: typography.sm, lineHeight: 20 },
    premiumBtn:    { alignSelf: 'flex-start', borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: spacing[5], paddingVertical: 10 },
    premiumBtnText:{ fontFamily: typography.sansMedium, fontSize: typography.sm },

    uspGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing[6], gap: 8, marginBottom: spacing[8] },
    uspCard: { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: 8 },
    uspLabel:{ fontFamily: typography.sansMedium, fontSize: typography.sm },

    ctaBanner: { marginHorizontal: spacing[6], borderRadius: radii.xl, padding: spacing[6], borderWidth: 1, alignItems: 'center', gap: 16 },
    ctaTitle:  { fontFamily: typography.serif, fontSize: typography['2xl'], textAlign: 'center' },
    ctaBtn:    { borderRadius: radii.pill, paddingHorizontal: spacing[8], paddingVertical: 14 },
    ctaBtnText:{ fontFamily: typography.sansSemiBold, fontSize: typography.base },
  });
}
