import { ImageBackground, ScrollView, View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, MapPin, ChevronRight, Phone, Star, Clock, Shield, Sparkles } from 'lucide-react-native';
import { typography, spacing, radii, layout } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import PCMonogram from '../../../components/PCMonogram';

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
  { icon: Star,    label: 'Certified Professionals' },
  { icon: Clock,   label: 'On-Time Guarantee'       },
  { icon: Shield,  label: 'Damage-Free Promise'     },
  { icon: Sparkles,label: 'Premium Products Only'   },
] as const;

export default function CustomerHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useThemeColors();
  const { width: SW } = useWindowDimensions();

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    content: { gap: 0 },

    topBar: {
      height: layout.topBar,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: layout.screenPad,
    },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    monogram: {
      width: 32, height: 32, borderRadius: radii.sm,
      backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center',
    },
    locationPill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5,
    },
    locationText: { fontFamily: typography.sans, fontSize: 11, color: c.fg3 },
    bell: {
      width: layout.tapMin, height: layout.tapMin, borderRadius: radii.pill,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      alignItems: 'center', justifyContent: 'center',
    },

    hero: {
      height: 360, backgroundColor: c.card,
      borderRadius: radii.xl, overflow: 'hidden',
      marginTop: spacing[4], marginBottom: spacing[4],
      borderWidth: 1, borderColor: c.line,
    },
    heroImage: { flex: 1 },
    heroTopFade: {
      position: 'absolute', top: 0, left: 0, right: 0, height: 120,
      backgroundColor: 'rgba(14,13,11,0.18)',
    },
    heroBottomFade: {
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 220,
      backgroundColor: 'rgba(14,13,11,0.72)',
    },
    heroFeatured: {
      position: 'absolute', top: spacing[4], left: spacing[4],
      borderWidth: 1, borderColor: c.lineStrong,
      borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4,
      backgroundColor: 'rgba(0,0,0,0.42)',
    },
    heroFeaturedText: {
      fontFamily: typography.mono, fontSize: 10, color: c.fg2,
      letterSpacing: 1, textTransform: 'uppercase',
    },
    heroContent: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing[5], gap: 12 },
    heroSub: {
      fontFamily: typography.sans, fontSize: typography.sm,
      color: c.fg2, lineHeight: 20, maxWidth: 280,
    },
    heroTitle: {
      fontFamily: typography.serif, fontSize: 30,
      color: c.fg, letterSpacing: -0.5, lineHeight: 32,
    },
    heroBtns: { flexDirection: 'row', gap: 10, marginTop: 2 },
    heroBtnPrimary: {
      backgroundColor: c.warm, borderRadius: radii.pill,
      paddingHorizontal: spacing[5], paddingVertical: 10,
    },
    heroBtnPrimaryText: { fontFamily: typography.sansSemiBold, fontSize: typography.sm, color: c.ink },
    heroBtnGhost: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'transparent', borderWidth: 1, borderColor: c.lineStrong,
      borderRadius: radii.pill, paddingHorizontal: spacing[4], paddingVertical: 10,
    },
    heroBtnGhostText: { fontFamily: typography.sans, fontSize: typography.sm, color: c.fg2 },
    statStrip: {
      flexDirection: 'row', marginHorizontal: spacing[6],
      backgroundColor: c.card, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.line, marginBottom: spacing[8],
    },
    statCard: { flex: 1, paddingVertical: spacing[4], alignItems: 'center', gap: 2 },
    statValue: { fontFamily: typography.serif, fontSize: typography['2xl'], color: c.fg, letterSpacing: -0.5 },
    statLabel: { fontFamily: typography.sans, fontSize: 11, color: c.fg3, textTransform: 'uppercase', letterSpacing: 0.8 },

    section: { paddingHorizontal: spacing[6], marginBottom: spacing[4] },
    eyebrow: { fontFamily: typography.sans, fontSize: 10, color: c.fg3, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
    sectionTitle: { fontFamily: typography.sansMedium, fontSize: typography.xl, color: c.fg, letterSpacing: -0.3 },

    serviceList: { gap: 8, paddingHorizontal: spacing[6], marginBottom: spacing[8] },
    serviceCard: {
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, padding: spacing[5], gap: 8,
    },
    serviceCardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    serviceNum: { fontFamily: typography.mono, fontSize: typography.xs, color: c.fg4 },
    serviceMeta: { flex: 1 },
    serviceName: { fontFamily: typography.sansMedium, fontSize: typography.base, color: c.fg },
    servicePrice: { fontFamily: typography.sans, fontSize: typography.xs, color: c.sage },
    serviceBody: { fontFamily: typography.sans, fontSize: typography.sm, color: c.fg3, lineHeight: 20 },
    serviceDurationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    serviceDuration: { fontFamily: typography.sans, fontSize: 11, color: c.fg4 },

    premiumBanner: {
      marginHorizontal: spacing[6], backgroundColor: c.sageLo,
      borderRadius: radii.xl, padding: spacing[6],
      marginBottom: spacing[8], gap: 12,
      borderWidth: 1, borderColor: c.sage + '40',
    },
    premiumEye: { fontFamily: typography.sans, fontSize: 10, color: c.sageInk + 'AA', letterSpacing: 2, textTransform: 'uppercase' },
    premiumTitle: { fontFamily: typography.serif, fontSize: typography['2xl'], color: c.sageInk, letterSpacing: -0.3, lineHeight: 34 },
    premiumBody: { fontFamily: typography.sans, fontSize: typography.sm, color: c.sageInk + 'BB', lineHeight: 20 },
    premiumBtn: {
      alignSelf: 'flex-start',
      borderWidth: 1, borderColor: c.sageInk + '60',
      borderRadius: radii.pill, paddingHorizontal: spacing[5], paddingVertical: 10,
    },
    premiumBtnText: { fontFamily: typography.sansMedium, fontSize: typography.sm, color: c.sageInk },

    uspGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      paddingHorizontal: spacing[6], gap: 8, marginBottom: spacing[8],
    },
    uspCard: {
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, padding: spacing[4], gap: 8,
    },
    uspLabel: { fontFamily: typography.sansMedium, fontSize: typography.sm, color: c.fg2 },

    ctaBanner: {
      marginHorizontal: spacing[6],
      backgroundColor: c.inkRaised,
      borderRadius: radii.xl, padding: spacing[6],
      borderWidth: 1, borderColor: c.lineStrong,
      alignItems: 'center', gap: 16,
    },
    ctaTitle: { fontFamily: typography.serif, fontSize: typography['2xl'], color: c.fg, textAlign: 'center' },
    ctaBtn: {
      backgroundColor: c.warm, borderRadius: radii.pill,
      paddingHorizontal: spacing[8], paddingVertical: 14,
    },
    ctaBtnText: { fontFamily: typography.sansSemiBold, fontSize: typography.base, color: c.ink },
  });

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingBottom: spacing[8] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={{ paddingTop: insets.top }}>
        <View style={s.topBar}>
        <View style={s.logoRow}>
          <View style={s.monogram}>
            <PCMonogram size={18} color={c.warm} />
          </View>
          <TouchableOpacity style={s.locationPill}>
            <MapPin size={12} color={c.fg3} strokeWidth={1.5} />
            <Text style={s.locationText}>Ghaziabad, NCR</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.bell}>
          <Bell size={18} color={c.fg2} strokeWidth={1.5} />
        </TouchableOpacity>
        </View>
      </View>

      {/* Hero card */}
      <View style={[s.hero, { width: SW - spacing[6] * 2, marginHorizontal: spacing[6] }]}>
        <ImageBackground source={BRAND_HERO} resizeMode="cover" style={s.heroImage}>
          <View style={s.heroTopFade} />
          <View style={s.heroBottomFade} />
          <View style={s.heroFeatured}>
            <Text style={s.heroFeaturedText}>[FEATURED]</Text>
          </View>
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>Bringing Your Car's{'\n'}Shine Back to Life</Text>
            <Text style={s.heroSub}>
              Professional detailing, advanced technology, and showroom-quality results.
            </Text>
            <View style={s.heroBtns}>
              <TouchableOpacity
                style={s.heroBtnPrimary}
                onPress={() => router.push('/(customer)/booking')}
                activeOpacity={0.8}
              >
                <Text style={s.heroBtnPrimaryText}>BOOK NOW</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.heroBtnGhost} activeOpacity={0.7}>
                <Phone size={14} color={c.fg2} strokeWidth={1.5} />
                <Text style={s.heroBtnGhostText}>CONTACT US</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Stat strip */}
      <View style={s.statStrip}>
        <View style={s.statCard}>
          <Text style={s.statValue}>9K+</Text>
          <Text style={s.statLabel}>Cars Cleaned</Text>
        </View>
        <View style={[s.statCard, { borderLeftWidth: 1, borderLeftColor: c.line }]}>
          <Text style={s.statValue}>500+</Text>
          <Text style={s.statLabel}>5-Star Reviews</Text>
        </View>
      </View>

      {/* Services intro */}
      <View style={s.section}>
        <Text style={s.eyebrow}>OUR SERVICES</Text>
        <Text style={s.sectionTitle}>What We Offer</Text>
      </View>

      {/* Service cards */}
      <View style={s.serviceList}>
        {SERVICES.map(svc => (
          <TouchableOpacity
            key={svc.num}
            style={s.serviceCard}
            onPress={() => router.push({ pathname: '/(customer)/booking', params: { service: svc.num } })}
            activeOpacity={0.75}
          >
            <View style={s.serviceCardHead}>
              <Text style={s.serviceNum}>{svc.num}</Text>
              <View style={s.serviceMeta}>
                <Text style={s.serviceName}>{svc.name}</Text>
                <Text style={s.servicePrice}>{svc.price}</Text>
              </View>
              <ChevronRight size={16} color={c.fg3} strokeWidth={1.5} />
            </View>
            <Text style={s.serviceBody}>{svc.body}</Text>
            <View style={s.serviceDurationRow}>
              <Clock size={11} color={c.fg4} strokeWidth={1.5} />
              <Text style={s.serviceDuration}>{svc.duration}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Premium section */}
      <View style={s.premiumBanner}>
        <Text style={s.premiumEye}>PREMIUM TIER</Text>
        <Text style={s.premiumTitle}>Elite Detailing{'\n'}& Restoration</Text>
        <Text style={s.premiumBody}>
          Showroom-quality finish with machine polishing, ceramic coating, and multi-step paint correction.
        </Text>
        <TouchableOpacity
          style={s.premiumBtn}
          onPress={() => router.push({ pathname: '/(customer)/booking', params: { service: '03' } })}
          activeOpacity={0.7}
        >
          <Text style={s.premiumBtnText}>EXPLORE PREMIUM</Text>
        </TouchableOpacity>
      </View>

      {/* USP grid */}
      <View style={s.section}>
        <Text style={s.eyebrow}>WHY CHOOSE US</Text>
      </View>
      <View style={s.uspGrid}>
        {USPS.map(({ icon: Icon, label }) => (
          <View key={label} style={[s.uspCard, { width: (SW - spacing[6] * 2 - 8) / 2 }]}>
            <Icon size={20} color={c.sage} strokeWidth={1.5} />
            <Text style={s.uspLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* CTA banner */}
      <View style={s.ctaBanner}>
        <Text style={s.ctaTitle}>Ready for a Spotless Car?</Text>
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => router.push('/(customer)/booking')}
          activeOpacity={0.8}
        >
          <Text style={s.ctaBtnText}>BOOK A SERVICE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
