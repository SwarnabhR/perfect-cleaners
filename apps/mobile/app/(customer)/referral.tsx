import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { colors, typography, spacing, radii } from '@pc/tokens';
import { ScreenHeader, Group, Row } from '../../components/RowGroup';

const REFERRAL_CODE = 'AARAV-PC';

interface Friend {
  initials: string;
  name: string;
  sub: string;
  amt: string | null; // null = pending
}

const FRIENDS: Friend[] = [
  { initials: 'PV', name: 'Priya Verma', sub: 'Joined · 24 May',   amt: '₹200' },
  { initials: 'KS', name: 'Karan Singh', sub: 'Joined · 18 May',   amt: '₹200' },
  { initials: 'MI', name: 'Meera Iyer',  sub: 'Joined · 02 May',   amt: '₹200' },
  { initials: 'RP', name: 'Rishi Patel', sub: 'Invited · pending', amt: null    },
];

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();

  async function handleShare() {
    try {
      await Share.share({
        message: `Use my code ${REFERRAL_CODE} to get ₹200 off your first Perfect Cleaners wash. Book at perfectcleaners.in`,
      });
    } catch {}
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(REFERRAL_CODE);
    Alert.alert('Copied!', `${REFERRAL_CODE} is now in your clipboard.`);
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

      {/* Hero */}
      <View style={s.hero}>
        <Text style={s.heroEyebrow}>[GIVE ₹200, GET ₹200]</Text>
        <Text style={s.heroTitle}>Share your shine.</Text>
        <Text style={s.heroBody}>
          Refer a friend with your code. They get ₹200 off their first wash.
          You get ₹200 credit when they book.
        </Text>
      </View>

      {/* Code card */}
      <View style={s.codeCard}>
        <Text style={s.codeText}>{REFERRAL_CODE}</Text>
        <View style={s.codeActions}>
          <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={s.shareBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
            <Text style={s.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={s.stats}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>[FRIENDS JOINED]</Text>
          <Text style={s.statValue}>3</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>[YOU EARNED]</Text>
          <Text style={s.statValue}>₹600</Text>
        </View>
      </View>

      {/* Friends list */}
      <Group header="Friends">
        {FRIENDS.map((f, i) => (
          <Row
            key={f.name}
            icon={
              <Text style={s.friendInitials}>{f.initials}</Text>
            }
            iconBg={f.amt === null ? colors.fg3 : colors.sageHi}
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  hero: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
  },
  heroEyebrow: {
    fontFamily: typography.mono,
    fontSize: 9.5,
    color: colors.fg3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: typography.serif,
    fontSize: 36,
    color: colors.fg,
    letterSpacing: -0.4,
    lineHeight: 40,
    textAlign: 'center',
  },
  heroBody: {
    fontFamily: typography.sans,
    fontSize: 14,
    color: colors.fg2,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 290,
  },

  codeCard: {
    marginHorizontal: spacing[5],
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    padding: 18,
    alignItems: 'center',
    gap: spacing[3],
  },
  codeText: {
    fontFamily: typography.mono,
    fontSize: 26,
    color: colors.fg,
    letterSpacing: 4,
  },
  codeActions: { flexDirection: 'row', gap: 8, width: '100%' },
  shareBtn: {
    flex: 1,
    backgroundColor: colors.warm,
    borderRadius: radii.sm,
    paddingVertical: 11,
    alignItems: 'center',
  },
  shareBtnText: {
    fontFamily: typography.sansSemiBold, fontSize: 13, color: colors.ink, letterSpacing: 0.3,
  },
  copyBtn: {
    flex: 1,
    backgroundColor: colors.cardHi,
    borderRadius: radii.sm,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  copyBtnText: {
    fontFamily: typography.sansSemiBold, fontSize: 13, color: colors.fg, letterSpacing: 0.3,
  },

  stats: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[1],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 4,
  },
  statLabel: {
    fontFamily: typography.mono, fontSize: 9, color: colors.fg3,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: typography.serif, fontSize: 28, color: colors.fg, letterSpacing: -0.3,
  },

  friendInitials: {
    fontFamily: typography.sansSemiBold, fontSize: 12, color: '#fff',
  },
  pendingText: {
    fontFamily: typography.sans, fontSize: 13, color: colors.fg3,
  },
  earnedText: {
    fontFamily: typography.serif, fontSize: 17, color: colors.success,
  },
});
