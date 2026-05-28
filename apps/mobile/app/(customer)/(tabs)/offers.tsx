import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, ArrowUpRight } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import TabTopBar from '../../../components/TabTopBar';

const ALL_OFFERS = [
  ['SHINE10',   '10% off any wash',          'New customers · expires 30 May'],
  ['BUNDLE2',   '₹300 off when you book 2',  'Any service · valid for 1 month'],
  ['REFERRAL',  'Refer a friend, get ₹200',  'Credited on their first booking'],
] as const;

export default function OffersScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const c       = useThemeColors();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.ink }}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <TabTopBar showLocation />
      </View>

      <View style={styles.sectionHead}>
        <Text style={[styles.eyebrow, { color: c.fg3 }]}>[OFFERS] · LIMITED TIME</Text>
        <Text style={[styles.pageTitle, { color: c.fg }]}>Save on your next detail.</Text>
      </View>

      {/* Featured promo */}
      <View style={[styles.featuredPromo, { backgroundColor: c.sage }]}>
        <Text style={styles.featuredEye}>[FLAGSHIP] · MONSOON SHIELD</Text>
        <Text style={styles.featuredTitle}>30% off ceramic coating, this week only.</Text>
        <View style={styles.codeChip}>
          <Text style={styles.codeText}>MONSOON30</Text>
          <Text style={styles.codeHint}>TAP TO COPY</Text>
        </View>
        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: '#fff' }]}
          onPress={() => router.push('/(customer)/booking')}
          activeOpacity={0.8}
        >
          <Text style={[styles.applyBtnText, { color: c.ink }]}>Apply & Book →</Text>
        </TouchableOpacity>
      </View>

      {/* All offers */}
      <View style={styles.offersSection}>
        <Text style={[styles.eyebrow, { color: c.fg3 }]}>[ALL OFFERS]</Text>
        <View style={styles.offersList}>
          {ALL_OFFERS.map(([code, title, sub]) => (
            <TouchableOpacity
              key={code}
              style={[styles.offerCard, { backgroundColor: c.card, borderColor: c.line }]}
              activeOpacity={0.75}
            >
              <View style={[styles.offerIcon, { backgroundColor: 'rgba(91,111,82,0.18)', borderColor: 'rgba(91,111,82,0.4)' }]}>
                <Sparkles size={18} color={c.sageHi} strokeWidth={1.5} />
              </View>
              <View style={styles.offerInfo}>
                <Text style={[styles.offerTitle, { color: c.fg }]}>{title}</Text>
                <Text style={[styles.offerSub, { color: c.fg2 }]}>{sub}</Text>
                <Text style={[styles.offerCode, { color: c.warm }]}>{code}</Text>
              </View>
              <ArrowUpRight size={14} color={c.fg3} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Refer & earn */}
      <View style={styles.offersSection}>
        <Text style={[styles.eyebrow, { color: c.fg3 }]}>[REFER & EARN]</Text>
        <View style={[styles.referCard, { backgroundColor: c.card, borderColor: c.line }]}>
          <Text style={[styles.referTitle, { color: c.fg }]}>Your code</Text>
          <View style={[styles.referCodeBox, { backgroundColor: c.cardHi, borderColor: c.lineStrong }]}>
            <Text style={[styles.referCode, { color: c.fg }]}>AARAV-PC</Text>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: c.warm }]} activeOpacity={0.8}>
              <Text style={[styles.shareBtnText, { color: c.ink }]}>Share</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.referStats}>
            <View>
              <Text style={[styles.eyebrow, { color: c.fg3 }]}>FRIENDS JOINED</Text>
              <Text style={[styles.referStatValue, { color: c.fg }]}>3</Text>
            </View>
            <View>
              <Text style={[styles.eyebrow, { color: c.fg3 }]}>YOU EARNED</Text>
              <Text style={[styles.referStatValue, { color: c.fg }]}>₹600</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionHead:    { paddingHorizontal: spacing[5], gap: spacing[1] },
  eyebrow:        { fontFamily: typography.mono, fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  pageTitle:      { fontFamily: typography.serif, fontSize: 32, letterSpacing: -0.3, lineHeight: 34 },

  featuredPromo:  { marginHorizontal: spacing[5], marginTop: spacing[5], borderRadius: radii.lg, padding: 22, overflow: 'hidden', gap: spacing[2] },
  featuredEye:    { fontFamily: typography.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8, textTransform: 'uppercase' },
  featuredTitle:  { fontFamily: typography.serif, fontSize: 30, color: '#fff', letterSpacing: -0.3, lineHeight: 33, maxWidth: 220 },
  codeChip:       { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(14,13,11,0.4)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  codeText:       { fontFamily: typography.mono, fontSize: 14, color: '#fff', letterSpacing: 1.2 },
  codeHint:       { fontFamily: typography.mono, fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8 },
  applyBtn:       { alignSelf: 'flex-start', borderRadius: radii.pill, paddingVertical: 10, paddingHorizontal: 20, marginTop: spacing[1] },
  applyBtnText:   { fontFamily: typography.sansMedium, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },

  offersSection:  { paddingHorizontal: spacing[5], paddingTop: spacing[5] },
  offersList:     { marginTop: spacing[2], gap: spacing[2] },
  offerCard:      { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: radii.md, padding: 14 },
  offerIcon:      { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  offerInfo:      { flex: 1 },
  offerTitle:     { fontFamily: typography.sansMedium, fontSize: 14 },
  offerSub:       { fontFamily: typography.sans, fontSize: 11.5, marginTop: 2 },
  offerCode:      { fontFamily: typography.mono, fontSize: 10, letterSpacing: 1, marginTop: 4 },

  referCard:      { marginTop: spacing[2], borderWidth: 1, borderRadius: radii.md, padding: 18, gap: 14 },
  referTitle:     { fontFamily: typography.sansMedium, fontSize: typography.xl },
  referCodeBox:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  referCode:      { flex: 1, fontFamily: typography.mono, fontSize: 18, letterSpacing: 1.8 },
  shareBtn:       { borderRadius: radii.pill, paddingVertical: 8, paddingHorizontal: 16 },
  shareBtnText:   { fontFamily: typography.sansMedium, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  referStats:     { flexDirection: 'row', justifyContent: 'space-between' },
  referStatValue: { fontFamily: typography.sansSemiBold, fontSize: typography.xl, marginTop: 2 },
});
