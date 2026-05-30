import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Shield, HelpCircle, Star } from 'lucide-react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Worker } from '@pc/firebase';
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

  const [worker,  setWorker]  = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    return firestore()
      .collection('workers')
      .doc(uid)
      .onSnapshot(snap => {
        if (snap.exists()) setWorker(snap.data() as Worker);
        setLoading(false);
      }, () => setLoading(false));
  }, [uid]);

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(['@pc/onboarding', '@pc/role', '@pc/profile']);
            await auth().signOut();
            router.replace('/(auth)/login');
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  }

  const name     = worker?.name ?? '—';
  const phone    = auth().currentUser?.phoneNumber ?? '';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const rating   = (worker?.rating  ?? 0).toFixed(1);
  const jobs     = worker?.totalJobs ?? 0;

  const fmtPhone = phone
    ? `+91 ${phone.replace('+91', '').slice(0, 5)} ${phone.replace('+91', '').slice(5)}`
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

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={c.fg3} />
      ) : (
        <>
          {/* Avatar + name */}
          <View style={s.avatarSection}>
            <View style={[s.avatar, { backgroundColor: c.sage }]}>
              <Text style={s.avatarInitials}>{initials || '?'}</Text>
            </View>
            <View style={s.nameBlock}>
              <Text style={ss.eyebrow}>[TECHNICIAN ACCOUNT]</Text>
              <Text style={[ss.pageTitle, { color: c.fg }]}>{name}</Text>
              <Text style={[s.phone, { color: c.fg2 }]}>{fmtPhone}</Text>
            </View>
          </View>

          {/* Rating + jobs badge */}
          <View style={s.ratingRow}>
            <View style={[s.ratingBadge, { backgroundColor: c.card, borderColor: c.line }]}>
              <Star size={13} color={c.gold ?? c.warm} strokeWidth={1.5} fill={c.gold ?? c.warm} />
              <Text style={[s.ratingText, { color: c.fg }]}>{rating}</Text>
              <Text style={[s.ratingCount, { color: c.fg3 }]}>· {jobs} jobs</Text>
            </View>
          </View>

          <Group header="Account">
            <Row icon={<Bell     size={14} color={c.fg2} strokeWidth={1.5} />} title="Notifications" value="On" />
            <Row icon={<Shield   size={14} color={c.fg2} strokeWidth={1.5} />} title="Privacy" />
            <Row icon={<HelpCircle size={14} color={c.fg2} strokeWidth={1.5} />} title="Help & Support" isLast />
          </Group>

          <View style={s.signOutWrap}>
            <TouchableOpacity style={ss.ghostBtn} activeOpacity={0.75} onPress={handleSignOut}>
              <Text style={ss.ghostBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
