import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
import HapticButton from '../../components/HapticButton';

const DEMO_BOOKING_ID = 'PC-2058';

async function seedDemoBooking() {
  try {
    const user = auth().currentUser;
    const profileJson = await AsyncStorage.getItem('@pc/onboarding');
    const profile = profileJson ? JSON.parse(profileJson) : null;

    await firestore()
      .collection('bookings')
      .doc(DEMO_BOOKING_ID)
      .set(
        {
          id: DEMO_BOOKING_ID,
          customerId: user?.uid ?? 'demo',
          status: 'enroute',
          paymentStatus: 'paid',
          paymentId: 'pay_NL2x9KQ4mZ',
          serviceIds: ['premium-wash-interior'],
          vehicle: {
            id: 'v1',
            make: profile?.car?.make ?? 'BMW',
            model: profile?.car?.model ?? '3 Series',
            year: 2022,
            type: 'sedan',
            registration: profile?.car?.plate ?? 'DL 4C AB 1234',
            color: profile?.car?.color ?? 'Mineral Grey',
          },
          address: {
            line1: profile?.address?.line1 ?? 'B-204, Kavi Nagar',
            city: profile?.address?.city ?? 'Ghaziabad',
            pincode: '201002',
            coordinates: { latitude: 28.6735, longitude: 77.4449 },
          },
          priceBreakdown: { subtotal: 1200, tax: 0, total: 1080 },
          photos: { before: [], after: [] },
          scheduledAt: new Date('2025-05-28T08:30:00Z'),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    console.log('[PaymentSuccess] Demo booking seeded →', DEMO_BOOKING_ID);
  } catch (err: any) {
    console.warn('[PaymentSuccess] Firestore seed failed:', err?.message);
  }
}

export default function PaymentSuccess() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const ss = useSharedStyles();

  const scale = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.4)).current;

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    content: {
      flex: 1, paddingHorizontal: spacing[6],
      alignItems: 'center', justifyContent: 'center', gap: spacing[5],
    },
    glowContainer: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
    checkGlow: {
      position: 'absolute',
      width: 110, height: 110, borderRadius: 999,
      backgroundColor: c.sage,
      opacity: 0.22,
    },
    checkCircle: {
      width: 78, height: 78, borderRadius: 999, backgroundColor: c.sage,
      alignItems: 'center', justifyContent: 'center',
    },
    textSection: { alignItems: 'center', gap: spacing[2] },
    title: {
      fontFamily: 'typography.serif', fontSize: 32, color: c.fg,
      letterSpacing: -0.3, lineHeight: 35, textAlign: 'center',
    },
    body: {
      fontFamily: 'typography.sans', fontSize: 14, color: c.fg2,
      lineHeight: 21, textAlign: 'center', maxWidth: 280,
    },
    emailHighlight: { color: c.fg },
    detailsCard: {
      width: '100%',
      backgroundColor: c.card, borderWidth: 1, borderColor: c.line,
      borderRadius: radii.md, padding: spacing[4], gap: spacing[2],
    },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailValue: { fontFamily: 'typography.mono', fontSize: 11, color: c.fg },
    detailAmount: { fontFamily: 'typography.sansSemiBold', fontSize: 14, color: c.fg },
    actions: { paddingHorizontal: spacing[6], paddingBottom: spacing[8], gap: spacing[1] },
  });

  useEffect(() => {
    void seedDemoBooking();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(glowScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.content}>
        <View style={s.glowContainer}>
          <Animated.View
            style={[
              s.checkGlow,
              { opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />
          <Animated.View style={[s.checkCircle, { transform: [{ scale }] }]}>
            <Check size={36} color="#fff" strokeWidth={2} />
          </Animated.View>
        </View>

        <View style={s.textSection}>
          <Text style={ss.eyebrow}>[CONFIRMED] · #PC-2058</Text>
          <Text style={s.title}>Booking confirmed.</Text>
          <Text style={s.body}>
            Premium Wash + Interior · ₹1,080 · Tue 28 May at 2:00 PM. We've sent a receipt to{' '}
            <Text style={s.emailHighlight}>aarav@mail.com</Text>.
          </Text>
        </View>

        <View style={s.detailsCard}>
          <View style={s.detailRow}>
            <Text style={ss.eyebrow}>PAYMENT ID</Text>
            <Text style={s.detailValue}>pay_NL2x9KQ4mZ</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={ss.eyebrow}>METHOD</Text>
            <Text style={s.detailValue}>UPI · GPay</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={ss.eyebrow}>AMOUNT</Text>
            <Text style={s.detailAmount}>₹1,080</Text>
          </View>
        </View>
      </View>

      <View style={s.actions}>
        <HapticButton
          haptic="success"
          style={ss.primaryBtn}
          onPress={() => router.push('/(customer)/tracker')}
          activeOpacity={0.8}
        >
          <Text style={ss.primaryBtnText}>Track Your Booking →</Text>
        </HapticButton>
        <HapticButton haptic="light" style={ss.ghostBtn} activeOpacity={0.7}>
          <Text style={ss.ghostBtnText}>Download Receipt</Text>
        </HapticButton>
      </View>
    </View>
  );
}
