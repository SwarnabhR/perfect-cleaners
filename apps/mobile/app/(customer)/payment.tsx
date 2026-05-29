import { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RazorpayCheckout, { type CheckoutOptions, type ErrorResponse } from 'react-native-razorpay';
import {
  X, Droplet, CreditCard, Wallet, Check, Shield,
} from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import HapticButton from '../../components/HapticButton';

const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

const METHODS = [
  ['upi',        'UPI',         'Google Pay · PhonePe · Paytm · BHIM'],
  ['card',       'Cards',       'Visa · Mastercard · RuPay · Amex'   ],
  ['netbanking', 'Net Banking', 'HDFC · ICICI · SBI · 60 banks'      ],
  ['wallet',     'Wallets',     'Paytm · Mobikwik · Freecharge'      ],
] as const;

const UPI_APPS = [
  ['gpay',    'GP', '#1A73E8'],
  ['phonepe', 'PP', '#5F259F'],
  ['paytm',   'PT', '#00BAF2'],
  ['bhim',    'BH', '#00A6CB'],
] as const;

// Icons declared at module level; colour is passed as a prop at render time.
function MethodIcon({ id, color }: { id: string; color: string }) {
  const p = { size: 16, color, strokeWidth: 1.5 } as const;
  if (id === 'upi')  return <Droplet    {...p} />;
  if (id === 'card') return <CreditCard {...p} />;
  return <Wallet {...p} />;
}

export default function PaymentSheet() {
  const [method,  setMethod]  = useState('upi');
  const [upiApp,  setUpiApp]  = useState('gpay');
  const [loading, setLoading] = useState(false);
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const c = useThemeColors();

  const params = useLocalSearchParams<{
    bookingId?:  string;
    bookingRef?: string;
    amount?:     string;
    label?:      string;
    slot?:       string;
    orderId?:    string;
    phone?:      string;
    name?:       string;
  }>();

  const bookingId     = params.bookingId  ?? '';
  const bookingRef    = params.bookingRef ?? 'PC-0000';
  const amountRs      = Number(params.amount ?? 1080);
  const label         = params.label    ?? 'Premium Wash + Interior';
  const phone         = params.phone    ?? '';
  const name          = params.name     ?? '';
  const promoDiscount = 120;
  const totalRs       = amountRs - promoDiscount;

  async function handlePay() {
    if (!RAZORPAY_KEY) {
      Alert.alert(
        'Configuration error',
        'Razorpay key not set. Add EXPO_PUBLIC_RAZORPAY_KEY_ID to your .env file.',
      );
      return;
    }
    setLoading(true);
    const options: CheckoutOptions = {
      key:         RAZORPAY_KEY,
      amount:      totalRs * 100,
      currency:    'INR',
      name:        'Perfect Cleaners',
      description: label,
      image:       'https://perfectcleaners.in/logo-pc-monogram.png',
      order_id:    params.orderId ?? '',
      prefill: { name, contact: phone ? `+91${phone}` : '' },
      notes:   { booking_ref: bookingRef },
      theme: { color: colors.sage, backdrop_color: colors.ink },
      modal: { ondismiss: () => setLoading(false) },
    };
    try {
      const data = await RazorpayCheckout.open(options);
      router.push({
        pathname: '/(customer)/payment-success',
        params: {
          paymentId:  data.razorpay_payment_id,
          bookingId,
          bookingRef,
          amount:     String(totalRs),
          label:      params.label ?? 'Premium Wash',
          slot:       params.slot  ?? '',
        },
      });
    } catch (err: unknown) {
      const e = err as Partial<ErrorResponse>;
      if (e.code !== 0) {
        Alert.alert('Payment failed', e.description ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[s.overlay, { paddingBottom: insets.bottom }]}>
      <View style={[s.sheet, { backgroundColor: c.inkRaised, borderTopColor: c.lineStrong }]}>
        <View style={[s.handle, { backgroundColor: c.lineStrong }]} />

        {/* Razorpay header strip */}
        <View style={s.razorpayStrip}>
          <View style={s.razorpayIcon}>
            <Text style={s.razorpayIconText}>R</Text>
          </View>
          <View style={s.razorpayInfo}>
            <Text style={[s.razorpayLabel,    { color: c.fg3 }]}>SECURED BY RAZORPAY</Text>
            <Text style={[s.razorpayMerchant, { color: c.fg  }]}>Perfect Cleaners · #{bookingRef}</Text>
          </View>
          <TouchableOpacity
            style={[s.closeBtn, { backgroundColor: c.card, borderColor: c.line }]}
            onPress={() => router.back()}
          >
            <X size={12} color={c.fg2} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

          {/* Order summary */}
          <View style={[s.orderSummary, { backgroundColor: c.card, borderColor: c.line }]}>
            <View style={s.orderRow}>
              <Text style={[s.orderLabel, { color: c.fg2 }]}>{label}</Text>
              <Text style={[s.orderLabel, { color: c.fg2 }]}>₹{amountRs.toLocaleString('en-IN')}</Text>
            </View>
            <View style={s.orderRow}>
              <Text style={[s.orderCode,    { color: c.fg3    }]}>Promo · SHINE10</Text>
              <Text style={[s.orderDiscount,{ color: c.sageHi }]}>− ₹{promoDiscount}</Text>
            </View>
            <View style={[s.orderDivider, { backgroundColor: c.line }]} />
            <View style={s.orderRow}>
              <Text style={[s.orderTotalLabel, { color: c.fg }]}>Total</Text>
              <Text style={[s.orderTotal,      { color: c.fg }]}>₹{totalRs.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <Text style={[s.eyebrow, { color: c.fg3 }]}>[PAYMENT METHOD]</Text>

          {/* Method selector */}
          <View style={s.methodsList}>
            {METHODS.map(([id, methodLabel, sub]) => {
              const active = method === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    s.methodCard,
                    { backgroundColor: active ? c.cardHi : c.card,
                      borderColor:      active ? c.lineStrong : c.line },
                  ]}
                  onPress={() => setMethod(id)}
                >
                  <View style={[s.methodIconBox, { backgroundColor: c.lineFaint, borderColor: c.line }]}>
                    <MethodIcon id={id} color={c.fg2} />
                  </View>
                  <View style={s.methodInfo}>
                    <Text style={[s.methodLabel, { color: c.fg  }]}>{methodLabel}</Text>
                    <Text style={[s.methodSub,   { color: c.fg2 }]}>{sub}</Text>
                  </View>
                  <View style={[
                    s.radio,
                    { borderColor: active ? c.warm : c.lineStrong,
                      backgroundColor: active ? c.warm : 'transparent' },
                  ]}>
                    {active && <View style={[s.radioDot, { backgroundColor: c.ink }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* UPI panel */}
          {method === 'upi' && (
            <>
              <Text style={[s.eyebrow, s.panelEyebrow, { color: c.fg3 }]}>[CHOOSE UPI APP]</Text>
              <View style={s.upiGrid}>
                {UPI_APPS.map(([id, initials, color]) => {
                  const active = upiApp === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[
                        s.upiCard,
                        { backgroundColor: active ? c.cardHi : c.card,
                          borderColor:      active ? c.lineStrong : c.line },
                      ]}
                      onPress={() => setUpiApp(id)}
                    >
                      <View style={[s.upiIcon, { backgroundColor: color }]}>
                        <Text style={s.upiIconText}>{initials}</Text>
                      </View>
                      <Text style={[s.upiLabel, { color: c.fg2 }]}>{id.toUpperCase()}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[s.eyebrow, s.panelEyebrow2, { color: c.fg3 }]}>OR PAY VIA UPI ID</Text>
              <View style={[s.upiInputRow, { backgroundColor: c.card, borderColor: c.line }]}>
                <Text style={[s.upiInputText, { color: c.fg }]}>aarav@okhdfcbank</Text>
                <View style={[s.upiInputCheck, { backgroundColor: c.sage }]}>
                  <Check size={11} color="#fff" strokeWidth={2.5} />
                </View>
              </View>
            </>
          )}

          {/* Card panel */}
          {method === 'card' && (
            <>
              <Text style={[s.eyebrow, s.panelEyebrow, { color: c.fg3 }]}>[CARD DETAILS]</Text>
              <View style={[s.cardInput, { backgroundColor: c.card, borderColor: c.lineStrong }]}>
                <Text style={[s.cardNumber, { color: c.fg }]}>4242  4242  4242  4242</Text>
                <View style={[s.cardBrand, { backgroundColor: c.ink }]}>
                  <Text style={s.cardBrandText}>VISA</Text>
                </View>
              </View>
              <View style={s.cardRow}>
                <View style={[s.cardInput, s.cardHalf, { backgroundColor: c.card, borderColor: c.lineStrong }]}>
                  <Text style={[s.cardNumber, { color: c.fg }]}>09/29</Text>
                </View>
                <View style={[s.cardInput, s.cardHalf, { backgroundColor: c.card, borderColor: c.lineStrong }]}>
                  <Text style={[s.cardNumber, { color: c.fg }]}>•••</Text>
                </View>
              </View>
            </>
          )}

          <HapticButton
            haptic="medium"
            style={[s.payBtn, { backgroundColor: c.warm }, loading && s.payBtnLoading]}
            onPress={handlePay}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={[s.payBtnText, { color: c.ink }]}>
              {loading ? 'OPENING CHECKOUT…' : `PAY ₹${totalRs.toLocaleString('en-IN')}`}
            </Text>
          </HapticButton>

          <View style={s.secureBar}>
            <Shield size={11} color={c.fg3} strokeWidth={1.5} />
            <Text style={[s.secureText, { color: c.fg3 }]}>
              256-BIT TLS · PCI-DSS COMPLIANT · NO CARD DETAILS STORED
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Module-level StyleSheet ─────────────────────────────────────────────────
// No color values here — all theme colors are applied as inline style overrides
// in the JSX above so this object is allocated exactly once.
const s = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(7,6,10,0.92)',
  },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: spacing[5], paddingTop: spacing[2],
    maxHeight: '92%',
  },
  scrollContent: { paddingBottom: 20 },
  handle: {
    width: 40, height: 4, borderRadius: 999,
    alignSelf: 'center', marginBottom: spacing[4],
  },

  razorpayStrip:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing[4] },
  razorpayIcon:     { width: 32, height: 32, borderRadius: 8, backgroundColor: '#0F4FFF', alignItems: 'center', justifyContent: 'center' },
  razorpayIconText: { fontFamily: typography.sansBold, fontSize: 14, color: '#fff', letterSpacing: -0.3 },
  razorpayInfo:     { flex: 1 },
  razorpayLabel:    { fontFamily: typography.mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  razorpayMerchant: { fontFamily: typography.sansMedium, fontSize: 13 },
  closeBtn:         { width: 44, height: 44, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  orderSummary:     { borderWidth: 1, borderRadius: radii.md, padding: 14, marginBottom: spacing[4], gap: spacing[1] },
  orderRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  orderLabel:       { fontFamily: typography.sans, fontSize: 13 },
  orderCode:        { fontFamily: typography.sans, fontSize: 12 },
  orderDiscount:    { fontFamily: typography.sans, fontSize: 12 },
  orderDivider:     { height: 1, marginVertical: spacing[1] },
  orderTotalLabel:  { fontFamily: typography.sansMedium, fontSize: 13 },
  orderTotal:       { fontFamily: typography.serif, fontSize: typography['2xl'], letterSpacing: -0.1 },

  eyebrow:          { fontFamily: typography.mono, fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  panelEyebrow:     { marginTop: spacing[4] },
  panelEyebrow2:    { marginTop: spacing[3] },

  methodsList:      { marginTop: spacing[2], gap: spacing[1] },
  methodCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  methodIconBox:    { width: 44, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  methodInfo:       { flex: 1 },
  methodLabel:      { fontFamily: typography.sansMedium, fontSize: 14 },
  methodSub:        { fontFamily: typography.sans, fontSize: 11.5, marginTop: 1 },
  radio:            { width: 18, height: 18, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  radioDot:         { width: 6, height: 6, borderRadius: 999 },

  upiGrid:          { flexDirection: 'row', gap: spacing[1], marginTop: spacing[2] },
  upiCard:          { flex: 1, alignItems: 'center', gap: spacing[1], borderWidth: 1, borderRadius: 12, padding: spacing[2] },
  upiIcon:          { width: 44, height: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  upiIconText:      { fontFamily: typography.sansBold, fontSize: 13, color: '#fff' },
  upiLabel:         { fontFamily: typography.mono, fontSize: 9, letterSpacing: 0.6 },
  upiInputRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing[1], borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  upiInputText:     { flex: 1, fontFamily: typography.mono, fontSize: 14, letterSpacing: 0.4 },
  upiInputCheck:    { width: 22, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  cardInput:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing[2], borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  cardHalf:         { flex: 1 },
  cardNumber:       { flex: 1, fontFamily: typography.mono, fontSize: 14, letterSpacing: 1.8 },
  cardBrand:        { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  cardBrandText:    { fontFamily: typography.sansBold, fontSize: 9, color: '#fff', letterSpacing: 0.4 },
  cardRow:          { flexDirection: 'row', gap: spacing[2] },

  payBtn:           { borderRadius: radii.pill, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: spacing[5] },
  payBtnLoading:    { opacity: 0.6 },
  payBtnText:       { fontFamily: typography.sansSemiBold, fontSize: 13, letterSpacing: 0.6 },

  secureBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing[2], marginBottom: spacing[2] },
  secureText:       { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.6 },
});
