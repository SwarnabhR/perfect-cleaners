import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { ChevronRight, Car, MapPin, CreditCard, Bell, Shield, HelpCircle, LogOut } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';
import { Group, Row } from '../../../components/RowGroup';

interface CachedProfile {
  name:    string;
  phone:   string;
  car?:    { make: string; model: string; plate: string; color: string };
  address?:{ line1: string; area: string; city: string };
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
}

export default function ProfileTab() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const c       = useThemeColors();
  const ss      = useSharedStyles();
  const [profile, setProfile] = useState<CachedProfile | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@pc/profile').then(raw => {
      if (raw) setProfile(JSON.parse(raw));
    });
  }, []);

  async function handleSignOut() {
    try {
      await AsyncStorage.multiRemove(['@pc/onboarding', '@pc/role', '@pc/profile']);
      await auth().signOut();
    } catch {}
    router.replace('/(auth)/login');
  }

  const displayName  = profile?.name  || 'Your Account';
  const displayPhone = profile?.phone ? `+91 ${profile.phone.replace('+91', '')}` : '—';
  const carLabel     = profile?.car
    ? `${profile.car.make} ${profile.car.model}`.trim() || 'Your vehicle'
    : 'Add a vehicle';
  const carSub       = profile?.car
    ? [profile.car.color, profile.car.plate].filter(Boolean).join(' · ') || 'Tap to update'
    : 'Make, model, plate';
  const addressLabel = profile?.address?.line1 || 'Add a service address';
  const addressSub   = profile?.address
    ? `${profile.address.area}, ${profile.address.city}`
    : 'We come to you · Ghaziabad NCR';

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <TabTopBar />
      </View>

      {/* Avatar + name */}
      <View style={s.avatarSection}>
        <View style={[s.avatar, { backgroundColor: c.sage }]}>
          <Text style={s.avatarInitials}>{initials(displayName)}</Text>
        </View>
        <View style={s.nameBlock}>
          <Text style={ss.eyebrow}>[CUSTOMER ACCOUNT]</Text>
          <Text style={[ss.pageTitle, { fontSize: 26 }]}>{displayName}</Text>
          <Text style={[s.phone, { color: c.fg2 }]}>{displayPhone}</Text>
        </View>
      </View>

      <Group header="My Details">
        <Row
          icon={<Car size={14} color={c.fg2} strokeWidth={1.5} />}
          title="Vehicles"
          sub={carLabel}
          value={carSub !== carLabel ? carSub : undefined}
          onPress={() => router.push('/(customer)/cars')}
        />
        <Row
          icon={<MapPin size={14} color={c.fg2} strokeWidth={1.5} />}
          title="Saved Addresses"
          sub={addressLabel}
          value={addressSub !== addressLabel ? addressSub : undefined}
          onPress={() => router.push('/(customer)/addresses')}
        />
        <Row
          icon={<CreditCard size={14} color={c.fg2} strokeWidth={1.5} />}
          title="Payment Methods"
          sub="Manage cards & UPI"
          onPress={() => router.push('/(customer)/payment-methods')}
          isLast
        />
      </Group>

      <Group header="Preferences">
        <Row
          icon={<Bell size={14} color={c.fg2} strokeWidth={1.5} />}
          title="Notifications"
          onPress={() => router.push('/(customer)/notifications')}
        />
        <Row
          icon={<Shield size={14} color={c.fg2} strokeWidth={1.5} />}
          title="Settings"
          onPress={() => router.push('/(customer)/settings')}
        />
        <Row
          icon={<HelpCircle size={14} color={c.fg2} strokeWidth={1.5} />}
          title="Help & Support"
          onPress={() => router.push('/(customer)/help')}
          isLast
        />
      </Group>

      <View style={s.signOutWrap}>
        <TouchableOpacity style={ss.ghostBtn} activeOpacity={0.75} onPress={handleSignOut}>
          <LogOut size={14} color={c.fg2} strokeWidth={1.5} style={{ marginRight: 6 }} />
          <Text style={ss.ghostBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  avatarSection:  { flexDirection: 'row', alignItems: 'center', gap: spacing[4], paddingHorizontal: spacing[5], paddingBottom: spacing[4] },
  avatar:         { width: 64, height: 64, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: typography.sansSemiBold, fontSize: 22, color: '#fff' },
  nameBlock:      { flex: 1, gap: 2 },
  phone:          { fontFamily: typography.sans, fontSize: 13 },
  signOutWrap:    { paddingHorizontal: spacing[5], marginTop: spacing[2] },
});
