import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Car, MapPin, CreditCard, Bell, Shield, HelpCircle, LogOut } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';
import { Group, Row } from '../../../components/RowGroup';

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c      = useThemeColors();
  const ss     = useSharedStyles();

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
          <Text style={s.avatarInitials}>AM</Text>
        </View>
        <View style={s.nameBlock}>
          <Text style={ss.eyebrow}>[CUSTOMER ACCOUNT]</Text>
          <Text style={[ss.pageTitle, { color: c.fg }]}>Aarav Mehta</Text>
          <Text style={[s.phone, { color: c.fg2 }]}>+91 98765 43210</Text>
        </View>
      </View>

      <Group header="My Details">
        <Row icon={<Car size={14} color={c.fg2} strokeWidth={1.5} />} title="Vehicles" sub="BMW 3 Series · Hyundai Creta" onPress={() => router.push('/(onboarding)/car')} />
        <Row icon={<MapPin size={14} color={c.fg2} strokeWidth={1.5} />} title="Saved Addresses" sub="B-204, Kavi Nagar" onPress={() => router.push('/(onboarding)/address')} />
        <Row icon={<CreditCard size={14} color={c.fg2} strokeWidth={1.5} />} title="Payment Methods" sub="HDFC ···· 4242 · UPI" onPress={() => router.push('/(customer)/payment-methods')} isLast />
      </Group>

      <Group header="Preferences">
        <Row icon={<Bell size={14} color={c.fg2} strokeWidth={1.5} />} title="Notifications" value="On" />
        <Row icon={<Shield size={14} color={c.fg2} strokeWidth={1.5} />} title="Privacy" />
        <Row icon={<HelpCircle size={14} color={c.fg2} strokeWidth={1.5} />} title="Help & Support" isLast />
      </Group>

      <View style={s.signOutWrap}>
        <TouchableOpacity style={ss.ghostBtn} activeOpacity={0.75} onPress={() => router.replace('/(auth)/login')}>
          <Text style={ss.ghostBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], paddingHorizontal: spacing[5], paddingBottom: spacing[4] },
  avatar:        { width: 64, height: 64, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:{ fontFamily: typography.sansSemiBold, fontSize: 22, color: '#fff' },
  nameBlock:     { flex: 1, gap: 2 },
  phone:         { fontFamily: typography.sans, fontSize: 13 },
  signOutWrap:   { paddingHorizontal: spacing[5], marginTop: spacing[2] },
});
