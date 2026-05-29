import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import HapticButton from '../../components/HapticButton';

async function updateBookingPayment(bookingId: string, paymentId: string) {
  if (!bookingId) return;
  try {
    await firestore()
      .collection('bookings')
      .doc(bookingId)
      .update({
        paymentStatus: 'paid',
        paymentId,
        status:        'pending', // stays pending until admin assigns a worker
        updatedAt:     firestore.FieldValue.serverTimestamp(),
      });
  } catch (err: any) {
    console.warn('[PaymentSuccess] Firestore update failed:', err?.message);
  }
}

export default function PaymentSuccess() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const c       = useThemeColors();
  const ss      = useSharedStyles();

  const params = useLocalSearchParams<{
    paymentId?:  string;
    bookingId?:  string;
    bookingRef?: string;
    amount?:     string;
    label?:      string;
    slot?:       string;
  }>();

  const paymentId  = params.paymentId  ?? '—';
  const bookingId  = params.bookingId  ?? '';
  const bookingRef = params.bookingRef ?? bookingId.slice(0, 8).toUpperCase();
  const amount     = params.amount     ?? '—';
  const label      = params.label      ?? 'Wash Service';
  const slot       = params.slot       ?? '';

  const scale        = useRef(new Animated.Value(0)).current;
  const glowOpacity  = useRef(new Animated.Value(0)).current;
  const glowScale    = useRef(new Animated.Value(0.4)).current;

  const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: c.ink },
    content: {
      flex: 1, paddingHorizontal: spacing[6],
      alignItems: 'center', justifyContent: 'center', gap: spacing[5],
    },
    glowContainer: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
    checkGlow: {
      position: 'absolute',
      width: 110, height: 110, borderRadius: 999,
      backgroundColor: c.sage, opacity: 0.22,
    },
    checkCircle: {
      width: 78, height: 78, borderRadius: 999, backgroundColor: c.sage,
      alignItems: 'center', justifyContent: 'center',
    },
    textSection: { alignItems: 'center', gap: spacing[2] },
    title: {
      fontFamily: typography.serif, fontSize: 32, color: c.fg,
      letterSpacing: -0.3, lineHeight: 35, textAlign: 'center',
    },
    body: {
      fontFamily: typography.sans, fontSize: 14, color: c.fg2,
      lineHeight: 21, textAlign: 'center', maxWidth: 280,
    },
    detailsCard: {
      width: '100%',
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, padding: spacing[4], gap: spacing[2],
    },
    detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailValue: { fontFamily: typography.mono, fontSize: 11, color: c.fg },
    detailAmount:{ fontFamily: typography.sansSemiBold, fontSize: 14, color: c.fg },
    actions: { paddingHorizontal: spacing[6], paddingBottom: spacing[8], gap: spacing[1] },
  });

  useEffect(() => {
    void updateBookingPayment(bookingId, paymentId);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(glowScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.content}>
        <View style={s.glowContainer}>
          <Animated.View style={[s.checkGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]} />
          <Animated.View style={[s.checkCircle, { transform: [{ scale }] }]}>
            <Check size={36} color="#fff" strokeWidth={2} />
          </Animated.View>
        </View>

        <View style={s.textSection}>
          <Text style={ss.eyebrow}>[CONFIRMED] · #{bookingRef}</Text>
          <Text style={s.title}>Booking confirmed.</Text>
          <Text style={s.body}>
            {label}{slot ? ` · ${slot}` : ''}. We've sent a confirmation to your registered number.
          </Text>
        </View>

        <View style={s.detailsCard}>
          <View style={s.detailRow}>
            <Text style={ss.eyebrow}>PAYMENT ID</Text>
            <Text style={s.detailValue}>{paymentId}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={ss.eyebrow}>BOOKING REF</Text>
            <Text style={s.detailValue}>#{bookingRef}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={ss.eyebrow}>AMOUNT</Text>
            <Text style={s.detailAmount}>₹{Number(amount).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </View>

      <View style={s.actions}>
        <HapticButton
          haptic="success"
          style={ss.primaryBtn}
          onPress={() => router.push({ pathname: '/(customer)/tracker', params: { bookingId } })}
          activeOpacity={0.8}
        >
          <Text style={ss.primaryBtnText}>Track Your Booking →</Text>
        </HapticButton>
        <HapticButton haptic="light" style={ss.ghostBtn} onPress={() => router.replace('/(customer)/(tabs)')} activeOpacity={0.7}>
          <Text style={ss.ghostBtnText}>Back to Home</Text>
        </HapticButton>
      </View>
    </View>
  );
}
