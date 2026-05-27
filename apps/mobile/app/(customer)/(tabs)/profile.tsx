import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronRight, Plus, MapPin, Bell, CreditCard,
  Users, HelpCircle, LogOut, Settings,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { colors, typography, spacing, radii } from '@pc/tokens';
import { Group, Row } from '../../../components/RowGroup';
import PCMonogram from '../../../components/PCMonogram';

interface StoredProfile {
  name: string;
  phone?: string;
  car?: { make: string; model: string; plate: string; color: string };
}

const PREFERENCES = [
  ['map-pin', 'Saved Addresses'],
  ['bell', 'Notifications'],
  ['credit-card', 'Payment Methods'],
  ['users', 'Refer & Earn'],
  ['help-circle', 'Help & Support'],
  ['log-out', 'Sign Out'],
];

const PREF_ICONS: Record<string, React.ReactNode> = {
  'map-pin': <MapPin size={16} color={colors.fg2} strokeWidth={1.5} />,
  bell: <Bell size={16} color={colors.fg2} strokeWidth={1.5} />,
  'credit-card': <CreditCard size={16} color={colors.fg2} strokeWidth={1.5} />,
  users: <Users size={16} color={colors.fg2} strokeWidth={1.5} />,
  'help-circle': <HelpCircle size={16} color={colors.fg2} strokeWidth={1.5} />,
  'log-out': <LogOut size={16} color={colors.fg2} strokeWidth={1.5} />,
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<StoredProfile | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@pc/onboarding').then(json => {
      if (json) setProfile(JSON.parse(json));
    });
  }, []);

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('@pc/onboarding');
            await auth().signOut();
            router.replace('/(auth)/login');
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  }

  const displayName = profile?.name ?? 'Your Name';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const cars: [string, string, string][] = profile?.car
    ? [[`${profile.car.make} ${profile.car.model}`, profile.car.plate, profile.car.color]]
    : [['BMW 3 Series', 'DL 4C AB 1234', 'Mineral Grey']]; // fallback demo car

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={s.monogram}>
          <PCMonogram size={18} color={colors.warm} />
        </View>
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => router.push('/(customer)/settings')}
          activeOpacity={0.7}
        >
          <Settings size={15} color={colors.fg} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <View style={s.sectionHead}>
        <Text style={s.pageTitle}>Your account.</Text>
      </View>

      {/* User card */}
      <View style={s.userCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.userInfo}>
          <Text style={s.userName}>{displayName}</Text>
          <Text style={s.userPhone}>{profile?.phone ?? '+91 ··········'}</Text>
        </View>
        <ChevronRight size={16} color={colors.fg3} strokeWidth={1.5} />
      </View>

      {/* Cars */}
      <Group header="Your Cars">
        {cars.map(([name, plate, color], i) => (
          <Row
            key={plate}
            title={name}
            sub={`${plate} · ${color}`}
            onPress={() => router.push('/(customer)/cars')}
          />
        ))}
        <Row
          title="Add Car"
          icon={<Plus size={14} color={colors.fg2} strokeWidth={1.5} />}
          iconBg={colors.cardHi}
          onPress={() => router.push('/(customer)/cars')}
          isLast
        />
      </Group>

      {/* Preferences */}
      <Group header="Preferences">
        {PREFERENCES.map(([icon, label], i, arr) => (
          <Row
            key={label}
            title={label}
            icon={PREF_ICONS[icon]}
            iconBg={colors.cardHi}
            onPress={
              label === 'Sign Out'           ? handleSignOut
              : label === 'Saved Addresses'  ? () => router.push('/(customer)/addresses')
              : label === 'Notifications'    ? () => router.push('/(customer)/notifications')
              : label === 'Payment Methods'  ? () => router.push('/(customer)/payment-methods')
              : label === 'Refer & Earn'     ? () => router.push('/(customer)/referral')
              : label === 'Help & Support'   ? () => router.push('/(customer)/help')
              : undefined
            }
            destructive={label === 'Sign Out'}
            isLast={i === arr.length - 1}
          />
        ))}
      </Group>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingBottom: spacing[3],
  },
  settingsBtn: {
    width: 36, height: 36, borderRadius: radii.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  monogram: {
    width: 32, height: 32, borderRadius: radii.sm,
    backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center',
  },
  sectionHead: { paddingHorizontal: spacing[5] },
  pageTitle: {
    fontFamily: typography.serif, fontSize: 32, color: colors.fg, letterSpacing: -0.3,
  },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: spacing[5], marginTop: spacing[4],
    backgroundColor: colors.inkRaised, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line,
    padding: spacing[4],
  },
  avatar: {
    width: 52, height: 52, borderRadius: 999, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: typography.sansSemiBold, fontSize: 20, color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontFamily: typography.sansMedium, fontSize: 16, color: colors.fg },
  userPhone: { fontFamily: typography.sans, fontSize: 12, color: colors.fg2 },
});
