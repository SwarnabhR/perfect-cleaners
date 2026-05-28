import { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Check, Car, MapPin, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import HapticButton from '../../components/HapticButton';

const SERVICE_TAB_MAP: Record<string, string> = {
  '01': 'Interior', '02': 'Exterior', '03': 'Coating',
};

const TABS     = ['All', 'Exterior', 'Interior', 'Detailing', 'Coating'];
const SLOTS    = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '4:30 PM'];
const PACKAGES = [
  {
    name: 'Basic',   price: '₹500',
    features: ['Hand wash', 'Tyre dressing', 'Interior vacuum'],
  },
  {
    name: 'Premium', price: '₹1,200',
    features: ['Everything in Basic', 'Wax & shine', 'Dashboard polish', 'Glass treatment'],
  },
  {
    name: 'Elite',   price: '₹2,400',
    features: ['Everything in Premium', 'Leather conditioning', 'Engine bay clean', 'Odor elimination'],
  },
];

interface Profile {
  name: string;
  car:     { make: string; model: string; plate: string; color: string };
  address: { line1: string; area: string; city: string };
}

export default function BookingScreen() {
  const { service } = useLocalSearchParams<{ service?: string }>();
  const [tab,     setTab]     = useState(SERVICE_TAB_MAP[service ?? ''] ?? 'All');
  const [pack,    setPack]    = useState('Premium');
  const [slot,    setSlot]    = useState('2:00 PM');
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c      = useThemeColors();
  const ss     = useSharedStyles();

  useEffect(() => {
    AsyncStorage.getItem('@pc/onboarding').then(raw => {
      if (raw) setProfile(JSON.parse(raw));
    });
  }, []);

  const activePkg = PACKAGES.find(p => p.name === pack)!;

  const s = StyleSheet.create({
    scrollContent: { paddingBottom: 120 },
    header:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
    titleSection: { paddingHorizontal: spacing[5], marginTop: spacing[1] },
    tabRow:  { flexDirection: 'row', gap: 8, paddingHorizontal: spacing[5], paddingVertical: spacing[5] },
    tab:     { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1 },
    tabText: { fontFamily: typography.sansMedium, fontSize: 12 },
    section:  { paddingHorizontal: spacing[5], marginBottom: spacing[4] },
    packages: { marginTop: spacing[2], gap: spacing[2] },
    pkgCard:  { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: spacing[1] },
    pkgHead:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[1] },
    pkgName:  { fontFamily: typography.sansSemiBold, fontSize: 14 },
    pkgPrice: { fontFamily: typography.serif, fontSize: 18, letterSpacing: -0.2 },
    pkgFeatures: { gap: 4 },
    pkgFeature:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pkgFeatureText: { fontFamily: typography.sans, fontSize: 12 },
    pkgSelected: { fontFamily: typography.mono, fontSize: 9.5, letterSpacing: 0.8, marginTop: spacing[1] },
    slotRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing[2] },
    slotChip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1 },
    slotText: { fontFamily: typography.sansMedium, fontSize: 13 },
    detailCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.md, padding: 14 },
    detailIcon:    { width: 36, height: 36, borderRadius: radii.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    detailInfo:    { flex: 1 },
    detailPrimary: { fontFamily: typography.sansMedium, fontSize: 14 },
    detailSub:     { fontFamily: typography.sans, fontSize: 12, marginTop: 2 },
    stickyBar:   { paddingHorizontal: spacing[5], paddingTop: spacing[3], paddingBottom: spacing[6], flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1 },
    stickyInfo:  { gap: 2 },
    stickyTotal: { fontFamily: typography.serif, fontSize: 22, letterSpacing: -0.3 },
  });

  return (
    <View style={[ss.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={ss.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={16} color={c.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={ss.eyebrow}>[BOOKING] / NEW</Text>
        </View>

        <View style={s.titleSection}>
          <Text style={ss.pageTitle}>Choose your wash.</Text>
        </View>

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
          {TABS.map(t => {
            const active = tab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[s.tab, { borderColor: c.line }, active && { backgroundColor: c.warm, borderColor: 'transparent' }]}
                onPress={() => setTab(t)}
              >
                <Text style={[s.tabText, { color: active ? c.ink : c.fg2 }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Step 01 — Package */}
        <View style={s.section}>
          <Text style={ss.eyebrow}>[STEP 01] · SELECT PACKAGE</Text>
          <View style={s.packages}>
            {PACKAGES.map(p => {
              const selected = pack === p.name;
              return (
                <TouchableOpacity
                  key={p.name}
                  style={[
                    s.pkgCard,
                    { backgroundColor: selected ? c.cardHi : c.card, borderColor: selected ? c.lineStrong : c.line },
                  ]}
                  onPress={() => setPack(p.name)}
                >
                  <View style={s.pkgHead}>
                    <Text style={[s.pkgName,  { color: c.fg }]}>{p.name}</Text>
                    <Text style={[s.pkgPrice, { color: c.fg }]}>{p.price}</Text>
                  </View>
                  <View style={s.pkgFeatures}>
                    {p.features.map(f => (
                      <View key={f} style={s.pkgFeature}>
                        <Check size={12} color={c.sageHi} strokeWidth={2.5} />
                        <Text style={[s.pkgFeatureText, { color: c.fg2 }]}>{f}</Text>
                      </View>
                    ))}
                  </View>
                  {selected && <Text style={[s.pkgSelected, { color: c.sageHi }]}>● SELECTED</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 02 — Time slot */}
        <View style={s.section}>
          <Text style={ss.eyebrow}>[STEP 02] · PICK A TIME · TUE, 28 MAY</Text>
          <View style={s.slotRow}>
            {SLOTS.map(time => {
              const active = slot === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    s.slotChip,
                    { borderColor: active ? c.lineStrong : c.line, backgroundColor: active ? c.cardHi : 'transparent' },
                  ]}
                  onPress={() => setSlot(time)}
                >
                  <Text style={[s.slotText, { color: active ? c.fg : c.fg2 }]}>{time}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 03 — Vehicle */}
        <View style={s.section}>
          <Text style={ss.eyebrow}>[STEP 03] · YOUR VEHICLE</Text>
          <DetailCard
            icon={<Car size={16} color={c.fg2} strokeWidth={1.5} />}
            primary={profile?.car ? `${profile.car.make} ${profile.car.model}` : 'Add your vehicle'}
            sub={
              profile?.car
                ? `${profile.car.color ? profile.car.color + ' · ' : ''}${profile.car.plate || 'No plate added'}`
                : 'Make, model and colour'
            }
            onPress={() => router.push('/(onboarding)/car')}
            c={c} s={s}
          />
        </View>

        {/* Step 04 — Address */}
        <View style={s.section}>
          <Text style={ss.eyebrow}>[STEP 04] · SERVICE ADDRESS</Text>
          <DetailCard
            icon={<MapPin size={16} color={c.fg2} strokeWidth={1.5} />}
            primary={profile?.address ? profile.address.line1 : 'Add pickup address'}
            sub={
              profile?.address
                ? `${profile.address.area}, ${profile.address.city}`
                : 'We come to you · Ghaziabad NCR'
            }
            onPress={() => router.push('/(onboarding)/address')}
            c={c} s={s}
          />
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[s.stickyBar, { backgroundColor: c.ink, borderTopColor: c.line }]}>
        <View style={s.stickyInfo}>
          <Text style={ss.eyebrow}>TOTAL</Text>
          <Text style={[s.stickyTotal, { color: c.fg }]}>{activePkg.price}</Text>
        </View>
        <HapticButton
          haptic="medium"
          style={[ss.primaryBtn, { flex: 1 }]}
          onPress={() => router.push('/(customer)/payment')}
          activeOpacity={0.85}
        >
          <Text style={ss.primaryBtnText}>Confirm Booking →</Text>
        </HapticButton>
      </View>
    </View>
  );
}

function DetailCard({
  icon, primary, sub, onPress, c, s,
}: {
  icon: React.ReactNode;
  primary: string;
  sub: string;
  onPress: () => void;
  c: ReturnType<typeof useThemeColors>;
  s: Record<string, any>;
}) {
  return (
    <TouchableOpacity
      style={[s.detailCard, { backgroundColor: c.card, borderColor: c.line }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[s.detailIcon, { backgroundColor: c.cardHi, borderColor: c.lineStrong }]}>
        {icon}
      </View>
      <View style={s.detailInfo}>
        <Text style={[s.detailPrimary, { color: c.fg  }]}>{primary}</Text>
        <Text style={[s.detailSub,     { color: c.fg2 }]}>{sub}</Text>
      </View>
      <ChevronRight size={14} color={c.fg3} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}
