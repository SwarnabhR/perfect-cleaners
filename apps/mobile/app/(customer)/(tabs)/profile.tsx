import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  Car, MapPin, CreditCard, Bell, Shield,
  HelpCircle, LogOut, Clock, Gift, Gem, MessageSquare,
} from 'lucide-react-native';
import { typography, spacing } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';
import { Group, Row } from '../../../components/RowGroup';

function initials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
}

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c      = useThemeColors();
  const ss     = useSharedStyles();

  const [name,  setName]  = useState('Your Account');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Phone from Firebase Auth (immediate)
    setPhone(auth().currentUser?.phoneNumber ?? '');

    // Cached name from AsyncStorage (instant)
    AsyncStorage.getItem('@pc/profile').then(raw => {
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.name) setName(cached.name);
      }
    });

    // Live from Firestore
    const uid = auth().currentUser?.uid;
    if (!uid) return;
    const unsub = firestore().collection('customers').doc(uid).onSnapshot(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.name)  setName(data.name);
        if (data?.email) setEmail(data.email);
        if (data?.phone) setPhone(data.phone);
      }
    }, () => {});
    return () => unsub();
  }, []);

  async function handleSignOut() {
    try {
      await AsyncStorage.multiRemove(['@pc/onboarding', '@pc/role', '@pc/profile']);
      await auth().signOut();
    } catch {}
    router.replace('/(auth)/login');
  }

  const rawPhone = phone.replace('+91', '').replace(/\s/g, '');
  const displayPhone = rawPhone
    ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`.trim()
    : '—';

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <TabTopBar />
      </View>

      {/* Avatar + identity */}
      <View style={s.avatarSection}>
        <View style={[s.avatar, { backgroundColor: c.sage }]}>
          <Text style={s.avatarInitials}>{initials(name)}</Text>
        </View>
        <View style={s.nameBlock}>
          <Text style={ss.eyebrow}>[CUSTOMER ACCOUNT]</Text>
          <Text style={[ss.pageTitle, { fontSize: 24, lineHeight: 30 }]}>{name}</Text>
          <Text style={[s.meta, { color: c.fg2 }]}>{displayPhone}</Text>
          {email ? <Text style={[s.meta, { color: c.fg3 }]}>{email}</Text> : null}
        </View>
      </View>

      {/* ORDERS */}
      <Group header="ORDERS">
        <Row
          icon={<Clock size={14} color="#fff" strokeWidth={1.5} />}
          iconBg={c.cardHi}
          title="Order History"
          sub="View past and upcoming bookings"
          onPress={() => router.push('/(customer)/(tabs)/bookings')}
        />
        <Row
          icon={<MessageSquare size={14} color="#fff" strokeWidth={1.5} />}
          iconBg={c.cardHi}
          title="Raise a Complaint"
          sub="We respond within 24 hours"
          onPress={() => router.push('/(customer)/support-chat')}
          isLast
        />
      </Group>

      {/* MY ACCOUNT */}
      <Group header="MY ACCOUNT">
        <Row
          icon={<MapPin size={14} color="#fff" strokeWidth={1.5} />}
          iconBg={c.cardHi}
          title="Saved Addresses"
          sub="Manage your service locations"
          onPress={() => router.push('/(customer)/addresses')}
        />
        <Row
          icon={<Car size={14} color="#fff" strokeWidth={1.5} />}
          iconBg={c.cardHi}
          title="Vehicles"
          sub="Manage your registered cars"
          onPress={() => router.push('/(customer)/cars')}
        />
        <Row
          icon={<CreditCard size={14} color="#fff" strokeWidth={1.5} />}
          iconBg={c.cardHi}
          title="Payment Methods"
          sub="Cards, UPI, wallet"
          onPress={() => router.push('/(customer)/payment-methods')}
        />
        <Row
          icon={<Gift size={14} color="#fff" strokeWidth={1.5} />}
          iconBg={c.cardHi}
          title="Referral"
          sub="Earn rewards for every friend you invite"
          onPress={() => router.push('/(customer)/referral')}
          isLast
        />
      </Group>

      {/* SUBSCRIPTION */}
      <Group header="SUBSCRIPTION">
        <Row
          icon={<Gem size={14} color="#fff" strokeWidth={1.5} />}
          iconBg={c.sage}
          title="Membership & Plans"
          sub="Gold · Platinum — unlimited washes"
          onPress={() => router.push('/(customer)/(tabs)/offers')}
          isLast
        />
      </Group>

      {/* SETTINGS */}
      <Group header="SETTINGS">
        <Row
          icon={<Bell size={14} color="#fff" strokeWidth={1.5} />}
          iconBg={c.cardHi}
          title="Notifications"
          onPress={() => router.push('/(customer)/notifications')}
        />
        <Row
          icon={<Shield size={14} color="#fff" strokeWidth={1.5} />}
          iconBg={c.cardHi}
          title="Settings"
          onPress={() => router.push('/(customer)/settings')}
        />
        <Row
          icon={<HelpCircle size={14} color="#fff" strokeWidth={1.5} />}
          iconBg={c.cardHi}
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
  avatarSection:  { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[4], paddingHorizontal: spacing[5], paddingBottom: spacing[4] },
  avatar:         { width: 64, height: 64, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarInitials: { fontFamily: typography.sansSemiBold, fontSize: 22, color: '#fff' },
  nameBlock:      { flex: 1, gap: 2, paddingTop: 2 },
  meta:           { fontFamily: typography.sans, fontSize: 13, marginTop: 2 },
  signOutWrap:    { paddingHorizontal: spacing[5], marginTop: spacing[2] },
});
