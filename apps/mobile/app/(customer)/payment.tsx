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
import HapticButton from '../../components/HapticButton';

// ─── Razorpay key — loaded from env so it's never hard-coded ─────────────────
const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';

// ─── Static data ──────────────────────────────────────────────────────────────

const METHODS = [
  ['upi',        'UPI',         'Google Pay · PhonePe · Paytm · BHIM', 'droplet'    ],
  ['card',       'Cards',       'Visa · Mastercard · RuPay · Amex',    'credit-card'],
  ['netbanking', 'Net Banking', 'HDFC · ICICI · SBI · 60 banks',       'wallet'     ],
  ['wallet',     'Wallets',     'Paytm · Mobikwik · Freecharge',       'wallet'     ],
] as const;

const UPI_APPS = [
  ['gpay',   'GP', '#1A73E8'],
  ['phonepe','PP', '#5F259F'],
  ['paytm',  'PT', '#00BAF2'],
  ['bhim',   'BH', '#00A6CB'],
] as const;

const METHOD_ICONS: Record<string, React.ReactNode> = {
  upi:        <Droplet    size={16} color={colors.fg2} strokeWidth={1.5} />,
  card:       <CreditCard size={16} color={colors.fg2} strokeWidth={1.5} />,
  netbanking: <Wallet     size={16} color={colors.fg2} strokeWidth={1.5} />,
  wallet:     <Wallet     size={16} color={colors.fg2} strokeWidth={1.5} />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentSheet() {
  const [method,  setMethod]  = useState('upi');
  const [upiApp,  setUpiApp]  = useState('gpay');
  const [loading, setLoading] = useState(false);
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  // Route params — populated from the booking detail screen
  const params = useLocalSearchParams<{
    bookingRef?: string;
    amount?:     string;   // in ₹, e.g. "1080"
    label?:      string;   // e.g. "Premium Wash + Interior"
    orderId?:    string;   // Razorpay order ID from backend (optional in test mode)
    phone?:      string;
    name?:       string;
  }>();

  const bookingRef = params.bookingRef ?? 'PC-0000';
  const amountRs   = Number(params.amount ?? 1080);
  const amountPaise = amountRs * 100;
  const label      = params.label    ?? 'Premium Wash + Interior';
  const phone      = params.phone    ?? '';
  const name       = params.name     ?? '';

  // ── Promo (demo) ────────────────────────────────────────────────────────────
  const promoDiscount = 120;
  const totalRs = amountRs - promoDiscount;

  // ── Pay handler ─────────────────────────────────────────────────────────────
  async function handlePay() {
    if (!RAZORPAY_KEY) {
      Alert.alert(
        'Configuration error',
        'Razorpay key not set. Add EXPO_PUBLIC_RAZORPAY_KEY_ID to your .env file.',
      );
      return;
    }

    setLoading(true);

    /**
     * `order_id` should come from your backend (Cloud Function that calls the
     * Razorpay Orders API). Pass it via route params from the booking detail
     * screen once that integration is wired:
     *
     *   const { orderId } = await createRazorpayOrder({ amountPaise: totalRs * 100 });
     *   router.push({ pathname: '/(customer)/payment', params: { orderId } });
     *
     * Empty string is accepted in Razorpay test mode.
     */
    const options: CheckoutOptions = {
      key:         RAZORPAY_KEY,
      amount:      totalRs * 100,           // paise (number, not string)
      currency:    'INR',
      name:        'Perfect Cleaners',
      description: label,
      image:       'https://perfectcleaners.in/logo-pc-monogram.png',
      order_id:    params.orderId ?? '',    // supplied by backend in production
      prefill: {
        name:    name,
        contact: phone ? `+91${phone}` : '',
      },
      notes: {
        booking_ref: bookingRef,
      },
      theme: {
        color:          colors.sage,
        backdrop_color: colors.ink,
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    };

    try {
      const data = await RazorpayCheckout.open(options);
      // data.razorpay_payment_id — verify this signature on the backend
      router.push({
        pathname: '/(customer)/payment-success',
        params: {
          paymentId:  data.razorpay_payment_id,
          bookingRef,
        },
      });
    } catch (err: unknown) {
      const e = err as Partial<ErrorResponse>;
      if (e.code !== 0) {
        // code 0 = user dismissed; anything else is a real error
        Alert.alert('Payment failed', e.description ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────

  return (
    <View style={[s.overlay, { paddingBottom: insets.bottom }]}>
      <View style={s.sheet}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Razorpay strip */}
        <View style={s.razorpayStrip}>
          <View style={s.razorpayIcon}>
            <Text style={s.razorpayIconText}>R</Text>
          </View>
          <View style={s.razorpayInfo}>
            <Text style={s.razorpayLabel}>SECURED BY RAZORPAY</Text>
            <Text style={s.razorpayMerchant}>Perfect Cleaners · #{bookingRef}</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <X size={12} color={colors.fg2} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Order summary */}
          <View style={s.orderSummary}>
            <View style={s.orderRow}>
              <Text style={s.orderLabel}>{label}</Text>
              <Text style={s.orderLabel}>₹{amountRs.toLocaleString('en-IN')}</Text>
            </View>
            <View style={s.orderRow}>
              <Text style={s.orderCode}>Promo · SHINE10</Text>
              <Text style={s.orderDiscount}>− ₹{promoDiscount}</Text>
            </View>
            <View style={s.orderDivider} />
            <View style={s.orderRow}>
              <Text style={s.orderTotalLabel}>Total</Text>
              <Text style={s.orderTotal}>₹{totalRs.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <Text style={s.eyebrow}>[PAYMENT METHOD]</Text>

          {/* Method picker */}
          <View style={s.methodsList}>
            {METHODS.map(([id, label, sub]) => (
              <TouchableOpacity
                key={id}
                style={[s.methodCard, method === id && s.methodCardActive]}
                onPress={() => setMethod(id)}
              >
                <View style={s.methodIconBox}>
                  {METHOD_ICONS[id]}
                </View>
                <View style={s.methodInfo}>
                  <Text style={s.methodLabel}>{label}</Text>
                  <Text style={s.methodSub}>{sub}</Text>
                </View>
                <View style={[s.radio, method === id && s.radioActive]}>
                  {method === id && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* UPI sub-options */}
          {method === 'upi' && (
            <>
              <Text style={[s.eyebrow, { marginTop: spacing[4] }]}>[CHOOSE UPI APP]</Text>
              <View style={s.upiGrid}>
                {UPI_APPS.map(([id, initials, color]) => (
                  <TouchableOpacity
                    key={id}
                    style={[s.upiCard, upiApp === id && s.upiCardActive]}
                    onPress={() => setUpiApp(id)}
                  >
                    <View style={[s.upiIcon, { backgroundColor: color }]}>
                      <Text style={s.upiIconText}>{initials}</Text>
                    </View>
                    <Text style={s.upiLabel}>{id.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.eyebrow, { marginTop: spacing[3] }]}>OR PAY VIA UPI ID</Text>
              <View style={s.upiInputRow}>
                <Text style={s.upiInputText}>aarav@okhdfcbank</Text>
                <View style={s.upiInputCheck}>
                  <Check size={11} color="#fff" strokeWidth={2.5} />
                </View>
              </View>
            </>
          )}

          {/* Card sub-options */}
          {method === 'card' && (
            <>
              <Text style={[s.eyebrow, { marginTop: spacing[4] }]}>[CARD DETAILS]</Text>
              <View style={s.cardInput}>
                <Text style={s.cardNumber}>4242  4242  4242  4242</Text>
                <View style={s.cardBrand}>
                  <Text style={s.cardBrandText}>VISA</Text>
                </View>
              </View>
              <View style={s.cardRow}>
                <View style={[s.cardInput, { flex: 1 }]}>
                  <Text style={s.cardNumber}>09/29</Text>
                </View>
                <View style={[s.cardInput, { flex: 1 }]}>
                  <Text style={s.cardNumber}>•••</Text>
                </View>
              </View>
            </>
          )}

          <HapticButton
            haptic="medium"
            style={[s.payBtn, loading && s.payBtnLoading]}
            onPress={handlePay}
            activeOpacity={0.85}
            disabled={loading}
          >
            <Text style={s.payBtnText}>
              {loading ? 'OPENING CHECKOUT…' : `PAY ₹${totalRs.toLocaleString('en-IN')}`}
            </Text>
          </HapticButton>

          <View style={s.secureBar}>
            <Shield size={11} color={colors.fg3} strokeWidth={1.5} />
            <Text style={s.secureText}>
              256-BIT TLS · PCI-DSS COMPLIANT · NO CARD DETAILS STORED
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(7,6,10,0.92)',
  },
  sheet: {
    backgroundColor: colors.inkRaised,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: colors.lineStrong,
    paddingHorizontal: spacing[5], paddingTop: spacing[2],
    maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: colors.lineStrong, alignSelf: 'center', marginBottom: spacing[4],
  },

  razorpayStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing[4],
  },
  razorpayIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#0F4FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  razorpayIconText: {
    fontFamily: typography.sansBold, fontSize: 14, color: '#fff', letterSpacing: -0.3,
  },
  razorpayInfo: { flex: 1 },
  razorpayLabel: {
    fontFamily: typography.mono, fontSize: 9, color: colors.fg3,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  razorpayMerchant: {
    fontFamily: typography.sansMedium, fontSize: 13, color: colors.fg,
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },

  orderSummary: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radii.md, padding: 14, marginBottom: spacing[4], gap: spacing[1],
  },
  orderRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  orderLabel:     { fontFamily: typography.sans, fontSize: 13, color: colors.fg2 },
  orderCode:      { fontFamily: typography.sans, fontSize: 12, color: colors.fg3 },
  orderDiscount:  { fontFamily: typography.sans, fontSize: 12, color: colors.sageHi },
  orderDivider:   { height: 1, backgroundColor: colors.line, marginVertical: spacing[1] },
  orderTotalLabel:{ fontFamily: typography.sansMedium, fontSize: 13, color: colors.fg },
  orderTotal:     { fontFamily: typography.serif, fontSize: typography['2xl'], color: colors.fg, letterSpacing: -0.1 },

  eyebrow: {
    fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  methodsList: { marginTop: spacing[2], gap: spacing[1] },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: 14,
  },
  methodCardActive: { backgroundColor: colors.cardHi, borderColor: colors.lineStrong },
  methodIconBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  methodInfo:  { flex: 1 },
  methodLabel: { fontFamily: typography.sansMedium, fontSize: 14, color: colors.fg },
  methodSub:   { fontFamily: typography.sans, fontSize: 11.5, color: colors.fg2, marginTop: 1 },
  radio: {
    width: 18, height: 18, borderRadius: 999,
    borderWidth: 1, borderColor: colors.lineStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.warm, backgroundColor: colors.warm },
  radioDot:    { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.ink },

  upiGrid:    { flexDirection: 'row', gap: spacing[1], marginTop: spacing[2] },
  upiCard: {
    flex: 1, alignItems: 'center', gap: spacing[1],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, padding: spacing[2],
  },
  upiCardActive: { backgroundColor: colors.cardHi, borderColor: colors.lineStrong },
  upiIcon: {
    width: 44, height: 44, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  upiIconText: { fontFamily: typography.sansBold, fontSize: 13, color: '#fff' },
  upiLabel:    { fontFamily: typography.mono, fontSize: 9, color: colors.fg2, letterSpacing: 0.6 },
  upiInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing[1],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
  },
  upiInputText:  { flex: 1, fontFamily: typography.mono, fontSize: 14, color: colors.fg, letterSpacing: 0.4 },
  upiInputCheck: {
    width: 22, height: 22, borderRadius: 999, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },

  cardInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing[2],
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.lineStrong,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
  },
  cardNumber: { flex: 1, fontFamily: typography.mono, fontSize: 14, color: colors.fg, letterSpacing: 1.8 },
  cardBrand: {
    backgroundColor: colors.ink, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4,
  },
  cardBrandText: { fontFamily: typography.sansBold, fontSize: 9, color: '#fff', letterSpacing: 0.4 },
  cardRow: { flexDirection: 'row', gap: spacing[2] },

  payBtn: {
    backgroundColor: colors.warm, borderRadius: radii.pill,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing[5],
  },
  payBtnLoading: { opacity: 0.6 },
  payBtnText: {
    fontFamily: typography.sansSemiBold, fontSize: 13, color: colors.ink, letterSpacing: 0.6,
  },

  secureBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: spacing[2], marginBottom: spacing[2],
  },
  secureText: {
    fontFamily: typography.mono, fontSize: 10, color: colors.fg3, letterSpacing: 0.6,
  },
});
