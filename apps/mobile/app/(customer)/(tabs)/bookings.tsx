import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';

export default function EmptyBookings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.topSection, { paddingTop: insets.top + 12 }]}>
        <Text style={s.pageTitle}>Your bookings.</Text>
      </View>

      <View style={s.emptyState}>
        <View style={s.glow} />
        <View style={s.iconCircle}>
          <Car size={28} color={colors.fg2} strokeWidth={1.5} />
        </View>
        <View style={s.emptyText}>
          <Text style={s.eyebrow}>[NO BOOKINGS]</Text>
          <Text style={s.emptyTitle}>
            No bookings yet.{"\n"}Your car's first detail is one tap away.
          </Text>
          <Text style={s.emptyBody}>
            Browse our services and book a slot — most washes available within 24 hours.
          </Text>
        </View>
        <TouchableOpacity
          style={s.browseBtn}
          onPress={() => router.push('/(customer)/booking')}
        >
          <Text style={s.browseBtnText}>Browse Services →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  topSection: { paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  pageTitle: {
    fontFamily: typography.serif, fontSize: 32, color: colors.fg,
    letterSpacing: -0.3,
  },

  emptyState: {
    alignItems: 'center', paddingHorizontal: spacing[8], paddingTop: 60, gap: spacing[5],
  },
  glow: {
    position: 'absolute', top: 60, width: 140, height: 140, borderRadius: 999,
    backgroundColor: 'rgba(91,111,82,0.18)',
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { alignItems: 'center', gap: spacing[2] },
  eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
  emptyTitle: {
    fontFamily: typography.serif, fontSize: typography['2xl'], color: colors.fg,
    letterSpacing: -0.3, lineHeight: 34, textAlign: 'center',
  },
  emptyBody: {
    fontFamily: typography.sans, fontSize: 13, color: colors.fg2,
    lineHeight: 20, textAlign: 'center', maxWidth: 280,
  },
  browseBtn: {
    backgroundColor: colors.warm, borderRadius: radii.pill,
    paddingVertical: 14, paddingHorizontal: 26, marginTop: spacing[1],
  },
  browseBtnText: {
    fontFamily: typography.sansSemiBold, fontSize: 13, color: colors.ink, letterSpacing: 0.6,
  },
});
