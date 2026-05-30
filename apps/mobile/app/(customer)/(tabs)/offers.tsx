import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tag } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import type { Promotion } from '@pc/firebase';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../../theme';
import { useSharedStyles } from '../../../theme/sharedStyles';
import TabTopBar from '../../../components/TabTopBar';

interface OfferRow {
  code:     string;
  title:    string;
  desc:     string;
  expiry:   string;
  discount: string;
  active:   boolean;
}

function toOfferRow(p: Promotion & { id: string }): OfferRow {
  const now     = new Date();
  const until   = (p.validUntil as any)?.toDate?.() ?? new Date(p.validUntil);
  const expired = until < now || p.usedCount >= p.maxUses;
  const discount = p.discountType === 'percent'
    ? `${p.discountValue}% OFF`
    : `₹${p.discountValue.toLocaleString('en-IN')} OFF`;
  const expiry = isNaN(until.getTime())
    ? 'No expiry'
    : until.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return {
    code:    p.code,
    title:   discount,
    desc:    p.description,
    expiry,
    discount,
    active:  p.isActive && !expired,
  };
}

export default function OffersTab() {
  const insets = useSafeAreaInsets();
  const c      = useThemeColors();
  const ss     = useSharedStyles();
  const [offers,  setOffers]  = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = firestore()
      .collection('promotions')
      .onSnapshot(snap => {
        const rows = snap.docs
          .map(d => toOfferRow({ ...(d.data() as Promotion), id: d.id }))
          .sort((a, b) => Number(b.active) - Number(a.active));
        setOffers(rows);
        setLoading(false);
      }, () => setLoading(false));
    return unsub;
  }, []);

  const active  = offers.filter(o => o.active);
  const expired = offers.filter(o => !o.active);

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

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={c.fg3} />
      ) : offers.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <Text style={[{ fontFamily: typography.serif, fontSize: 20, color: c.fg2 }]}>No offers right now.</Text>
        </View>
      ) : (
        <>
          {active.length > 0 && (
            <View style={s.section}>
              <Text style={ss.eyebrow}>[ACTIVE OFFERS] · {active.length}</Text>
              {active.map(offer => <OfferCard key={offer.code} offer={offer} active />)}
            </View>
          )}
          {expired.length > 0 && (
            <View style={s.section}>
              <Text style={ss.eyebrow}>[EXPIRED]</Text>
              {expired.map(offer => <OfferCard key={offer.code} offer={offer} active={false} />)}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function OfferCard({ offer, active }: { offer: OfferRow; active: boolean }) {
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
          <Text style={[s.offerTitle, { color: c.fg }]}>{offer.desc}</Text>
        </View>
        <View style={[s.discountBadge, { backgroundColor: active ? c.warm : c.cardHi }]}>
          <Text style={[s.discountText, { color: active ? c.ink : c.fg3 }]}>{offer.discount}</Text>
        </View>
      </View>
      <View style={[s.cardBottom, { borderTopColor: c.line }]}>
        <Text style={[s.codeText, { color: c.fg3 }]}>CODE: <Text style={{ color: active ? c.sageHi : c.fg3, fontFamily: typography.sansSemiBold }}>{offer.code}</Text></Text>
        <Text style={[s.expiryText, { color: c.fg3 }]}>Exp: {offer.expiry}</Text>
      </View>
      {active ? (
        <TouchableOpacity style={ss.primaryBtn} activeOpacity={0.85}>
          <Text style={ss.primaryBtnText}>Apply Offer →</Text>
        </TouchableOpacity>
      ) : (
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
  offerTitle:   { fontFamily: typography.sansSemiBold, fontSize: 13, lineHeight: 18 },
  discountBadge:{ borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0, alignSelf: 'flex-start' },
  discountText: { fontFamily: typography.sansSemiBold, fontSize: 11, letterSpacing: 0.4 },
  cardBottom:   { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: spacing[2] },
  codeText:     { fontFamily: typography.mono, fontSize: 10.5, letterSpacing: 0.6 },
  expiryText:   { fontFamily: typography.mono, fontSize: 10.5, letterSpacing: 0.4 },
});
