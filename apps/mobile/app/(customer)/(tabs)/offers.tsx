import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tag } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';

interface Offer {
  code: string;
  title: string;
  desc: string;
  expiry: string;
  discount: string;
  active: boolean;
}

const OFFERS: Offer[] = [
  { code: 'FIRST50',   title: 'First Wash Free',         desc: '50% off your first booking. No minimum order.',         expiry: '31 May 2026', discount: '50% OFF', active: true  },
  { code: 'REFER200',  title: 'Refer & Earn ₹200',        desc: 'Share your code — you and your friend each get ₹200.',  expiry: 'No expiry',   discount: '₹200',    active: true  },
  { code: 'MONSOON30', title: 'Monsoon Special',          desc: 'Pre-monsoon exterior wash at 30% off.',                 expiry: '14 Jun 2026', discount: '30% OFF', active: true  },
  { code: 'ELITE10',   title: '10% off Elite package',    desc: 'Elite full-detail package. One use per user.',          expiry: '30 Apr 2026', discount: '10% OFF', active: false },
  { code: 'SUMMER25',  title: 'Summer Shine 25%',         desc: 'Beat the heat — exterior + interior combo at 25% off.', expiry: '30 Apr 2026', discount: '25% OFF', active: false },
];

export default function OffersTab() {
  const insets = useSafeAreaInsets();
  const c  = useThemeColors();
  const ss = useSharedStyles();

  const active  = OFFERS.filter(o => o.active);
  const expired = OFFERS.filter(o => !o.active);

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <TabTopBar />
      </View>

      <View style={s.titleRow}>
        <Text style={[ss.pageTitle, { color: c.fg }]}>Offers.</Text>
      </View>

      {active.length > 0 && (
        <View style={s.section}>
          <Text style={ss.eyebrow}>[ACTIVE OFFERS] · {active.length}</Text>
          {active.map(offer => (
            <OfferCard key={offer.code} offer={offer} active />
          ))}
        </View>
      )}

      {expired.length > 0 && (
        <View style={s.section}>
          <Text style={ss.eyebrow}>[EXPIRED]</Text>
          {expired.map(offer => (
            <OfferCard key={offer.code} offer={offer} active={false} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function OfferCard({ offer, active }: { offer: Offer; active: boolean }) {
  const c  = useThemeColors();
  const ss = useSharedStyles();

  return (
    <View style={[
      s.card,
      { backgroundColor: c.card, borderColor: active ? c.lineStrong : c.line, opacity: active ? 1 : 0.55 },
    ]}>
      <View style={s.cardTop}>
        <View style={[s.tagIcon, { backgroundColor: active ? c.sage : c.cardHi }]}>
          <Tag size={14} color="#fff" strokeWidth={1.5} />
        </View>
        <View style={s.cardInfo}>
          <Text style={[s.offerTitle, { color: c.fg }]}>{offer.title}</Text>
          <Text style={[s.offerDesc, { color: c.fg2 }]}>{offer.desc}</Text>
        </View>
        <View style={[s.discountBadge, { backgroundColor: active ? c.warm : c.cardHi }]}>
          <Text style={[s.discountText, { color: active ? c.ink : c.fg3 }]}>{offer.discount}</Text>
        </View>
      </View>
      <View style={[s.cardBottom, { borderTopColor: c.line }]}>
        <Text style={[s.codeText, { color: c.fg3 }]}>CODE: <Text style={{ color: active ? c.sageHi : c.fg3, fontFamily: typography.sansSemiBold }}>{offer.code}</Text></Text>
        <Text style={[s.expiryText, { color: c.fg3 }]}>Exp: {offer.expiry}</Text>
      </View>
      {active && (
        <TouchableOpacity style={ss.primaryBtn} activeOpacity={0.85}>
          <Text style={ss.primaryBtnText}>Apply Offer →</Text>
        </TouchableOpacity>
      )}
      {!active && (
        <TouchableOpacity style={ss.ghostBtn} activeOpacity={0.6} disabled>
          <Text style={ss.ghostBtnText}>Expired</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  titleRow:     { paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  section:      { paddingHorizontal: spacing[5], gap: spacing[3], marginBottom: spacing[2] },
  card:         { borderWidth: 1, borderRadius: radii.md, padding: spacing[4], gap: spacing[3] },
  cardTop:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tagIcon:      { width: 36, height: 36, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardInfo:     { flex: 1, gap: 3 },
  offerTitle:   { fontFamily: typography.sansSemiBold, fontSize: 14 },
  offerDesc:    { fontFamily: typography.sans, fontSize: 12, lineHeight: 17 },
  discountBadge:{ borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0, alignSelf: 'flex-start' },
  discountText: { fontFamily: typography.sansSemiBold, fontSize: 11, letterSpacing: 0.4 },
  cardBottom:   { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: spacing[2] },
  codeText:     { fontFamily: typography.mono, fontSize: 10.5, letterSpacing: 0.6 },
  expiryText:   { fontFamily: typography.mono, fontSize: 10.5, letterSpacing: 0.4 },
});
