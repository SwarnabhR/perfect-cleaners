import { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Check, Car, MapPin, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, radii } from '@pc/tokens';
import HapticButton from '../../components/HapticButton';

// service param: '01' Interior Detailing, '02' Exterior Wash, '03' Paint Protection
const SERVICE_TAB_MAP: Record<string, string> = {
  '01': 'Interior', '02': 'Exterior', '03': 'Coating',
};

const TABS = ['All', 'Exterior', 'Interior', 'Detailing', 'Coating'];
const SLOTS = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '4:30 PM'];

const PACKAGES = [
  {
    name: 'Basic', price: '₹500',
    features: ['Hand wash', 'Tyre dressing', 'Interior vacuum'],
  },
  {
    name: 'Premium', price: '₹1,200',
    features: ['Everything in Basic', 'Wax & shine', 'Dashboard polish', 'Glass treatment'],
  },
  {
    name: 'Elite', price: '₹2,400',
    features: ['Everything in Premium', 'Leather conditioning', 'Engine bay clean', 'Odor elimination'],
  },
];

interface Profile {
  name: string;
  car: { make: string; model: string; plate: string; color: string };
  address: { line1: string; area: string; city: string };
}

export default function BookingScreen() {
  const { service } = useLocalSearchParams<{ service?: string }>();
  const [tab, setTab] = useState(SERVICE_TAB_MAP[service ?? ''] ?? 'All');
  const [pack, setPack] = useState('Premium');
  const [slot, setSlot] = useState('2:00 PM');
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const activePkg = PACKAGES.find(p => p.name === pack)!;

  useEffect(() => {
    AsyncStorage.getItem('@pc/onboarding').then(raw => {
      if (raw) setProfile(JSON.parse(raw));
    });
  }, []);

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={16} color={colors.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={s.eyebrow}>[BOOKING] / NEW</Text>
        </View>

        <View style={s.titleSection}>
          <Text style={s.title}>Choose your wash.</Text>
        </View>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabRow}
        >
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tab, tab === t && s.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Package selection */}
        <View style={s.section}>
          <Text style={s.eyebrow}>[STEP 01] · SELECT PACKAGE</Text>
          <View style={s.packages}>
            {PACKAGES.map(p => {
              const selected = pack === p.name;
              return (
                <TouchableOpacity
                  key={p.name}
                  style={[s.pkgCard, selected && s.pkgCardSelected]}
                  onPress={() => setPack(p.name)}
                >
                  <View style={s.pkgHead}>
                    <Text style={s.pkgName}>{p.name}</Text>
                    <Text style={s.pkgPrice}>{p.price}</Text>
                  </View>
                  <View style={s.pkgFeatures}>
                    {p.features.map(f => (
                      <View key={f} style={s.pkgFeature}>
                        <Check size={12} color={colors.sageHi} strokeWidth={2.5} />
                        <Text style={s.pkgFeatureText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                  {selected && (
                    <Text style={s.pkgSelected}>● SELECTED</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time slots */}
        <View style={s.section}>
          <Text style={s.eyebrow}>[STEP 02] · PICK A TIME · TUE, 28 MAY</Text>
          <View style={s.slotRow}>
            {SLOTS.map(time => (
              <TouchableOpacity
                key={time}
                style={[s.slot, slot === time && s.slotActive]}
                onPress={() => setSlot(time)}
              >
                <Text style={[s.slotText, slot === time && s.slotTextActive]}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vehicle */}
        <View style={s.section}>
          <Text style={s.eyebrow}>[STEP 03] · YOUR VEHICLE</Text>
          <TouchableOpacity
            style={s.detailCard}
            onPress={() => router.push('/(onboarding)/car')}
            activeOpacity={0.75}
          >
            <View style={s.detailIcon}>
              <Car size={16} color={colors.fg2} strokeWidth={1.5} />
            </View>
            <View style={s.detailInfo}>
              {profile?.car ? (
                <>
                  <Text style={s.detailPrimary}>{profile.car.make} {profile.car.model}</Text>
                  <Text style={s.detailSub}>
                    {profile.car.color ? `${profile.car.color} · ` : ''}
                    {profile.car.plate || 'No plate added'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.detailPrimary}>Add your vehicle</Text>
                  <Text style={s.detailSub}>Make, model and colour</Text>
                </>
              )}
            </View>
            <ChevronRight size={14} color={colors.fg3} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {/* Address */}
        <View style={s.section}>
          <Text style={s.eyebrow}>[STEP 04] · SERVICE ADDRESS</Text>
          <TouchableOpacity
            style={s.detailCard}
            onPress={() => router.push('/(onboarding)/address')}
            activeOpacity={0.75}
          >
            <View style={s.detailIcon}>
              <MapPin size={16} color={colors.fg2} strokeWidth={1.5} />
            </View>
            <View style={s.detailInfo}>
              {profile?.address ? (
                <>
                  <Text style={s.detailPrimary}>{profile.address.line1}</Text>
                  <Text style={s.detailSub}>{profile.address.area}, {profile.address.city}</Text>
                </>
              ) : (
                <>
                  <Text style={s.detailPrimary}>Add pickup address</Text>
                  <Text style={s.detailSub}>We come to you · Ghaziabad NCR</Text>
                </>
              )}
            </View>
            <ChevronRight size={14} color={colors.fg3} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={s.stickyBar}>
        <View style={s.stickyInfo}>
          <Text style={s.eyebrow}>TOTAL</Text>
          <Text style={s.stickyTotal}>{activePkg.price}</Text>
        </View>
        <HapticButton
          haptic="medium"
          style={s.stickyBtn}
          onPress={() => router.push('/(customer)/payment')}
          activeOpacity={0.85}
        >
          <Text style={s.stickyBtnText}>Confirm Booking →</Text>
        </HapticButton>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing[5], paddingVertical: spacing[3],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
  titleSection: { paddingHorizontal: spacing[5], marginTop: spacing[1] },
  title: {
    fontFamily: typography.serif, fontSize: 32, color: colors.fg,
    letterSpacing: -0.3, lineHeight: 34,
  },

  tabRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  tab: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.line,
  },
  tabActive: { backgroundColor: colors.warm, borderColor: 'transparent' },
  tabText: { fontFamily: typography.sansMedium, fontSize: 12, color: colors.fg2 },
  tabTextActive: { color: colors.ink },

  section: { paddingHorizontal: spacing[5], marginBottom: spacing[4] },
  packages: { marginTop: spacing[2], gap: spacing[2] },
  pkgCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: spacing[4], gap: spacing[2],
  },
  pkgCardSelected: { backgroundColor: colors.cardHi, borderColor: colors.lineStrong },
  pkgHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  pkgName: { fontFamily: typography.sansMedium, fontSize: typography.base, color: colors.fg },
  pkgPrice: { fontFamily: typography.sansSemiBold, fontSize: typography.lg, color: colors.fg },
  pkgFeatures: { gap: 6 },
  pkgFeature: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pkgFeatureText: { fontFamily: typography.sans, fontSize: 12, color: colors.fg2 },
  pkgSelected: {
    fontFamily: typography.mono, fontSize: 9, color: colors.sageHi,
    letterSpacing: 1, alignSelf: 'flex-end',
  },

  slotRow: { flexDirection: 'row', gap: 8, marginTop: spacing[2], flexWrap: 'wrap' },
  slot: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1, borderColor: colors.line,
  },
  slotActive: { backgroundColor: colors.cardHi, borderColor: colors.lineStrong },
  slotText: { fontFamily: typography.sans, fontSize: 13, color: colors.fg2 },
  slotTextActive: { color: colors.fg },

  detailCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: spacing[2],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: spacing[4],
  },
  detailIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.cardHi, borderWidth: 1, borderColor: colors.lineStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  detailInfo: { flex: 1 },
  detailPrimary: { fontFamily: typography.sansMedium, fontSize: typography.base, color: colors.fg },
  detailSub: { fontFamily: typography.sans, fontSize: 12, color: colors.fg2, marginTop: 2 },

  stickyBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing[5], paddingTop: spacing[3], paddingBottom: spacing[3],
    backgroundColor: 'rgba(14,13,11,0.95)',
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  stickyInfo: { flex: 1 },
  stickyTotal: { fontFamily: typography.serif, fontSize: typography['2xl'], color: colors.fg },
  stickyBtn: {
    backgroundColor: colors.warm, borderRadius: radii.pill,
    paddingVertical: 14, paddingHorizontal: 22,
  },
  stickyBtnText: {
    fontFamily: typography.sansSemiBold, fontSize: 13, color: colors.ink, letterSpacing: 0.6,
  },
});
