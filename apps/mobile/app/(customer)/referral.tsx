import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Share, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader } from '../../components/RowGroup';

function generateCode(name: string): string {
  const first = (name.split(' ')[0] ?? 'USER').slice(0, 5).toUpperCase();
  const rand  = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${first}${rand}`;
}

interface ReferralStats {
  code:         string;
  friendsCount: number;
  earned:       number;
}

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const c  = useThemeColors();
  const ss = useSharedStyles();
  const [stats,   setStats]   = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) { setLoading(false); return; }

    const unsub = firestore().collection('customers').doc(user.uid).onSnapshot(
      async snap => {
        if (!snap.exists()) { setLoading(false); return; }
        const data = snap.data()!;

        // Ensure referral code exists — generate + persist if not
        let code = data.referralCode as string | undefined;
        if (!code) {
          code = generateCode(data.name ?? '');
          await firestore().collection('customers').doc(user.uid).update({ referralCode: code });
        }

        setStats({
          code,
          friendsCount: data.referralCount   ?? 0,
          earned:       data.referralEarnings ?? 0,
        });
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  const s = StyleSheet.create({
    hero:     { paddingHorizontal: spacing[5], paddingBottom: spacing[4], alignItems: 'center', gap: spacing[2] },
    heroBody: { fontFamily: typography.sans, fontSize: 14, color: c.fg2, lineHeight: 21, textAlign: 'center', maxWidth: 290 },
    codeCard: { marginHorizontal: spacing[5], backgroundColor: c.card, borderRadius: radii.md, borderWidth: 1, borderColor: c.lineStrong, padding: 18, alignItems: 'center', gap: spacing[3] },
    codeText: { fontFamily: typography.mono, fontSize: 26, color: c.fg, letterSpacing: 4 },
    codeActions: { flexDirection: 'row', gap: 8, width: '100%' },
    shareBtn: { flex: 1, backgroundColor: c.warm, borderRadius: radii.sm, paddingVertical: 11, alignItems: 'center' },
    shareBtnText: { fontFamily: typography.sansSemiBold, fontSize: 13, color: c.ink, letterSpacing: 0.3 },
    copyBtn: { flex: 1, backgroundColor: c.cardHi, borderRadius: radii.sm, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: c.line },
    copyBtnText: { fontFamily: typography.sansSemiBold, fontSize: 13, color: c.fg, letterSpacing: 0.3 },
    stats: { flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[1] },
    statCard: { flex: 1, backgroundColor: c.card, borderRadius: radii.md, borderWidth: 1, borderColor: c.line, padding: 14, gap: 4 },
    statValue: { fontFamily: typography.serif, fontSize: 28, color: c.fg, letterSpacing: -0.3 },
    emptyFriends: { fontFamily: typography.sans, fontSize: 13, color: c.fg3, textAlign: 'center', paddingVertical: spacing[6], paddingHorizontal: spacing[5] },
  });

  async function handleShare() {
    if (!stats) return;
    try {
      await Share.share({
        message: `Use my code ${stats.code} to get ₹200 off your first Perfect Cleaners wash. Book at perfectcleaners.in`,
      });
    } catch {}
  }

  async function handleCopy() {
    if (!stats) return;
    await Clipboard.setStringAsync(stats.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied!', `${stats.code} is now in your clipboard.`);
  }

  return (
    <ScrollView
      style={[ss.screen, { backgroundColor: c.ink }]}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Refer & Earn" />
      </View>

      <View style={s.hero}>
        <Text style={ss.eyebrow}>[GIVE ₹200, GET ₹200]</Text>
        <Text style={ss.heroTitle}>Share your shine.</Text>
        <Text style={s.heroBody}>
          Refer a friend with your code. They get ₹200 off their first wash.
          You get ₹200 credit when they book.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.fg3} />
      ) : stats ? (
        <>
          <View style={s.codeCard}>
            <Text style={s.codeText}>{stats.code}</Text>
            <View style={s.codeActions}>
              <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.8}>
                <Text style={s.shareBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
                <Text style={s.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.stats}>
            <View style={s.statCard}>
              <Text style={ss.eyebrow}>[FRIENDS JOINED]</Text>
              <Text style={s.statValue}>{stats.friendsCount}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={ss.eyebrow}>[YOU EARNED]</Text>
              <Text style={s.statValue}>₹{stats.earned.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {stats.friendsCount === 0 && (
            <Text style={s.emptyFriends}>
              Friends who use your code will appear here once they make their first booking.
            </Text>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}
