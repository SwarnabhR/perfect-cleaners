import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Shield, HelpCircle, Star } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';
import { Group, Row } from '../../../components/RowGroup';

export default function WorkerProfileTab() {
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
          <Text style={s.avatarInitials}>RS</Text>
        </View>
        <View style={s.nameBlock}>
          <Text style={ss.eyebrow}>[TECHNICIAN ACCOUNT]</Text>
          <Text style={[ss.pageTitle, { color: c.fg }]}>Rahul Sharma</Text>
          <Text style={[s.phone, { color: c.fg2 }]}>+91 99988 77665</Text>
        </View>
      </View>

      {/* Rating badge */}
      <View style={s.ratingRow}>
        <View style={[s.ratingBadge, { backgroundColor: c.card, borderColor: c.line }]}>
          <Star size={13} color={c.gold ?? c.warm} strokeWidth={1.5} fill={c.gold ?? c.warm} />
          <Text style={[s.ratingText, { color: c.fg }]}>4.9</Text>
          <Text style={[s.ratingCount, { color: c.fg3 }]}>· 312 jobs</Text>
        </View>
      </View>

      <Group header="Account">
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
  ratingRow:     { paddingHorizontal: spacing[5], marginBottom: spacing[2] },
  ratingBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 6 },
  ratingText:    { fontFamily: typography.sansSemiBold, fontSize: 14 },
  ratingCount:   { fontFamily: typography.mono, fontSize: 10.5, letterSpacing: 0.4 },
  signOutWrap:   { paddingHorizontal: spacing[5], marginTop: spacing[2] },
});
