import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

function makeReferralCode(name: string): string {
  const first = name.split(' ')[0]?.slice(0, 5).toUpperCase() ?? 'USER';
  return `${first}-PC`;
}

interface Friend {
  initials: string;
  name: string;
  sub: string;
  amt: string | null;
}

const FRIENDS: Friend[] = [
  { initials: 'PV', name: 'Priya Verma', sub: 'Joined · 24 May',   amt: '₹200' },
  { initials: 'KS', name: 'Karan Singh', sub: 'Joined · 18 May',   amt: '₹200' },
  { initials: 'MI', name: 'Meera Iyer',  sub: 'Joined · 02 May',   amt: '₹200' },
  { initials: 'RP', name: 'Rishi Patel', sub: 'Invited · pending', amt: null    },
];

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const ss = useSharedStyles();
  const [referralCode, setReferralCode] = useState('YOURNAME-PC');

  useEffect(() => {
    AsyncStorage.getItem('@pc/profile').then(raw => {
      if (raw) {
        const profile = JSON.parse(raw);
        setReferralCode(makeReferralCode(profile.name ?? ''));
      }
    });
  }, []);

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    hero: { paddingHorizontal: spacing[5], paddingBottom: spacing[4], alignItems: 'center', gap: spacing[2] },
    heroBody: {
      fontFamily: typography.sans, fontSize: 14, color: c.fg2,
      lineHeight: 21, textAlign: 'center', maxWidth: 290,
    },
    codeCard: {
      marginHorizontal: spacing[5], backgroundColor: c.card, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.lineStrong, padding: 18, alignItems: 'center', gap: spacing[3],
    },
    codeText: { fontFamily: typography.mono, fontSize: 26, color: c.fg, letterSpacing: 4 },
    codeActions: { flexDirection: 'row', gap: 8, width: '100%' },
    shareBtn: {
      flex: 1, backgroundColor: c.warm, borderRadius: radii.sm, paddingVertical: 11, alignItems: 'center',
    },
    shareBtnText: { fontFamily: typography.sansSemiBold, fontSize: 13, color: c.ink, letterSpacing: 0.3 },
    copyBtn: {
      flex: 1, backgroundColor: c.cardHi, borderRadius: radii.sm, paddingVertical: 11, alignItems: 'center',
      borderWidth: 1, borderColor: c.line,
    },
    copyBtnText: { fontFamily: typography.sansSemiBold, fontSize: 13, color: c.fg, letterSpacing: 0.3 },
    stats: {
      flexDirection: 'row', gap: spacing[2],
      paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[1],
    },
    statCard: {
      flex: 1, backgroundColor: c.card, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.line, padding: 14, gap: 4,
    },
    statValue: { fontFamily: typography.serif, fontSize: 28, color: c.fg, letterSpacing: -0.3 },
    friendInitials: { fontFamily: typography.sansSemiBold, fontSize: 12, color: '#fff' },
    pendingText: { fontFamily: typography.sans, fontSize: 13, color: c.fg3 },
    earnedText: { fontFamily: typography.serif, fontSize: 17, color: c.success },
  });

  async function handleShare() {
    try {
      await Share.share({
        message: `Use my code ${referralCode} to get ₹200 off your first Perfect Cleaners wash. Book at perfectcleaners.in`,
      });
    } catch {}
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('Copied!', `${referralCode} is now in your clipboard.`);
  }

  return (
    <ScrollView
      style={s.root}
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

      <View style={s.codeCard}>
        <Text style={s.codeText}>{referralCode}</Text>
        <View style={s.codeActions}>
          <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={s.shareBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
            <Text style={s.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.stats}>
        <View style={s.statCard}>
          <Text style={ss.eyebrow}>[FRIENDS JOINED]</Text>
          <Text style={s.statValue}>3</Text>
        </View>
        <View style={s.statCard}>
          <Text style={ss.eyebrow}>[YOU EARNED]</Text>
          <Text style={s.statValue}>₹600</Text>
        </View>
      </View>

      <Group header="Friends">
        {FRIENDS.map((f, i) => (
          <Row
            key={f.name}
            icon={<Text style={s.friendInitials}>{f.initials}</Text>}
            iconBg={f.amt === null ? c.fg3 : c.sageHi}
            title={f.name}
            sub={f.sub}
            value={
              f.amt === null ? (
                <Text style={s.pendingText}>pending</Text>
              ) : (
                <Text style={s.earnedText}>{'+' + f.amt}</Text>
              )
            }
            isLast={i === FRIENDS.length - 1}
          />
        ))}
      </Group>
    </ScrollView>
  );
}
