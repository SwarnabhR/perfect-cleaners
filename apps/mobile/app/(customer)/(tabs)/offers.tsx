import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, ArrowUpRight, MapPin } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import PCMonogram from '../../../components/PCMonogram';

const ALL_OFFERS = [
  ['SHINE10', '10% off any wash', 'New customers · expires 30 May'],
  ['BUNDLE2', '₹300 off when you book 2', 'Any service · valid for 1 month'],
  ['REFERRAL', 'Refer a friend, get ₹200', 'Credited on their first booking'],
];

export default function OffersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useThemeColors();

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    monogram: { width: 32, height: 32, borderRadius: radii.sm, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center' },
    locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
    locationText: { fontFamily: typography.sans, fontSize: 11, color: c.fg3 },
    sectionHead: { paddingHorizontal: spacing[5], gap: spacing[1] },
    eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
    pageTitle: { fontFamily: typography.serif, fontSize: 32, color: c.fg, letterSpacing: -0.3, lineHeight: 34 },
    featuredPromo: { marginHorizontal: spacing[5], marginTop: spacing[5], backgroundColor: c.sage, borderRadius: radii.lg, padding: 22, overflow: 'hidden', gap: spacing[2] },
    featuredEye: { fontFamily: typography.mono, fontSize: 9.5, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8, textTransform: 'uppercase' },
    featuredTitle: { fontFamily: typography.serif, fontSize: 30, color: '#fff', letterSpacing: -0.3, lineHeight: 33, maxWidth: 220 },
    codeChip: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(14,13,11,0.4)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
    codeText: { fontFamily: typography.mono, fontSize: 14, color: '#fff', letterSpacing: 1.2 },
    codeHint: { fontFamily: typography.mono, fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8 },
    applyBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: radii.pill, paddingVertical: 10, paddingHorizontal: 20, marginTop: spacing[1] },
    applyBtnText: { fontFamily: typography.sansMedium, fontSize: 12, color: c.ink, letterSpacing: 0.6, textTransform: 'uppercase' },
    offersSection: { paddingHorizontal: spacing[5], paddingTop: spacing[5] },
    offersList: { marginTop: spacing[2], gap: spacing[2] },
    offerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: 14 },
    offerIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(91,111,82,0.18)', borderWidth: 1, borderColor: 'rgba(91,111,82,0.4)', alignItems: 'center', justifyContent: 'center' },
    offerInfo: { flex: 1 },
    offerTitle: { fontFamily: typography.sansMedium, fontSize: 14, color: c.fg },
    offerSub: { fontFamily: typography.sans, fontSize: 11.5, color: c.fg2, marginTop: 2 },
    offerCode: { fontFamily: typography.mono, fontSize: 10, color: c.warm, letterSpacing: 1, marginTop: 4 },
    referCard: { marginTop: spacing[2], backgroundColor: c.card, borderWidth: 1, borderColor: c.line, borderRadius: radii.md, padding: 18, gap: 14 },
    referTitle: { fontFamily: typography.sansMedium, fontSize: typography.xl, color: c.fg },
    referCodeBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.cardHi, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: c.lineStrong },
    referCode: { flex: 1, fontFamily: typography.mono, fontSize: 18, color: c.fg, letterSpacing: 1.8 },
    shareBtn: { backgroundColor: c.warm, borderRadius: radii.pill, paddingVertical: 8, paddingHorizontal: 16 },
    shareBtnText: { fontFamily: typography.sansMedium, fontSize: 11, color: c.ink, letterSpacing: 0.6, textTransform: 'uppercase' },
    referStats: { flexDirection: 'row', justifyContent: 'space-between' },
    referStatValue: { fontFamily: typography.sansSemiBold, fontSize: typography.xl, color: c.fg, marginTop: 2 },
  });

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: spacing[10] }} showsVerticalScrollIndicator={false}>
      <View style={[s.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={s.logoRow}>
          <View style={s.monogram}><PCMonogram size={18} color={c.warm} /></View>
          <TouchableOpacity style={s.locationPill}>
            <MapPin size={12} color={c.fg3} strokeWidth={1.5} />
            <Text style={s.locationText}>Ghaziabad, NCR</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.sectionHead}>
        <Text style={s.eyebrow}>[OFFERS] · LIMITED TIME</Text>
        <Text style={s.pageTitle}>Save on your next detail.</Text>
      </View>
      <View style={s.featuredPromo}>
        <Text style={s.featuredEye}>[FLAGSHIP] · MONSOON SHIELD</Text>
        <Text style={s.featuredTitle}>30% off ceramic coating, this week only.</Text>
        <View style={s.codeChip}>
          <Text style={s.codeText}>MONSOON30</Text>
          <Text style={s.codeHint}>TAP TO COPY</Text>
        </View>
        <TouchableOpacity style={s.applyBtn} onPress={() => router.push('/(customer)/booking')} activeOpacity={0.8}>
          <Text style={s.applyBtnText}>Apply & Book →</Text>
        </TouchableOpacity>
      </View>
      <View style={s.offersSection}>
        <Text style={s.eyebrow}>[ALL OFFERS]</Text>
        <View style={s.offersList}>
          {ALL_OFFERS.map(([code, title, sub]) => (
            <TouchableOpacity key={code} style={s.offerCard} activeOpacity={0.75}>
              <View style={s.offerIcon}><Sparkles size={18} color={c.sageHi} strokeWidth={1.5} /></View>
              <View style={s.offerInfo}>
                <Text style={s.offerTitle}>{title}</Text>
                <Text style={s.offerSub}>{sub}</Text>
                <Text style={s.offerCode}>{code}</Text>
              </View>
              <ArrowUpRight size={14} color={c.fg3} strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={s.offersSection}>
        <Text style={s.eyebrow}>[REFER & EARN]</Text>
        <View style={s.referCard}>
          <Text style={s.referTitle}>Your code</Text>
          <View style={s.referCodeBox}>
            <Text style={s.referCode}>AARAV-PC</Text>
            <TouchableOpacity style={s.shareBtn} activeOpacity={0.8}>
              <Text style={s.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
          <View style={s.referStats}>
            <View><Text style={s.eyebrow}>FRIENDS JOINED</Text><Text style={s.referStatValue}>3</Text></View>
            <View><Text style={s.eyebrow}>YOU EARNED</Text><Text style={s.referStatValue}>₹600</Text></View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
