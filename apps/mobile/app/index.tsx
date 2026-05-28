import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { colors, typography } from '@pc/tokens';
import PCMonogram from '../components/PCMonogram';

// AsyncStorage keys
const KEY_ONBOARDING = '@pc/onboarding'; // 'done' when complete
const KEY_ROLE       = '@pc/role';       // 'customer' | 'worker'

// Demo bypass — phone 0000000000 / OTP 000000 produces this uid.
const DEMO_UID = 'demo-user';

export default function Index() {
  const router   = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // @react-native-firebase/* are native modules — they crash on web
    // because the native bridge (Google Services plist/json) doesn't
    // exist in the react-dom renderer. This app is native-only; skip
    // the auth gate entirely on web.
    if (Platform.OS === 'web') return;

    /**
     * Gate logic (runs once per mount, cleaned up on unmount).
     *
     * Step 1 — Firebase auth listener.
     *   No authenticated user → go to login.
     *   Authenticated user → proceed to step 2.
     *
     * Step 2 — AsyncStorage fast path.
     *   '@pc/onboarding' === 'done' && '@pc/role' present
     *   → route immediately (avoids Firestore on every cold start).
     *
     * Step 3 — Firestore source of truth.
     *   getDoc /customers/{uid}
     *   → onboardingComplete true  : cache to AsyncStorage, route.
     *   → doc missing / flag false : go to onboarding.
     *   → network/rules error      : go to onboarding (safe fallback).
     *
     * Demo bypass:
     *   uid === 'demo-user' skips Firestore entirely and routes
     *   straight to the customer tabs.
     */
    const unsubscribe = auth().onAuthStateChanged(async user => {
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      // Demo bypass
      if (user.uid === DEMO_UID) {
        router.replace('/(customer)/(tabs)');
        return;
      }

      try {
        // Fast path — cached in AsyncStorage from a previous launch.
        const [cachedOnboarding, cachedRole] = await Promise.all([
          AsyncStorage.getItem(KEY_ONBOARDING),
          AsyncStorage.getItem(KEY_ROLE),
        ]);

        if (cachedOnboarding === 'done' && cachedRole) {
          routeByRole(cachedRole);
          return;
        }

        // Firestore fallback — authoritative source of truth.
        const snap = await firestore()
          .collection('customers')
          .doc(user.uid)
          .get();

        if (snap.exists) {
          const data = snap.data()!;
          if (data.onboardingComplete === true) {
            const role = (data.role as string) || 'customer';
            // Hydrate local cache so next launch uses the fast path.
            await Promise.all([
              AsyncStorage.setItem(KEY_ONBOARDING, 'done'),
              AsyncStorage.setItem(KEY_ROLE, role),
            ]);
            routeByRole(role);
            return;
          }
        }

        // No doc, or onboardingComplete !== true → first-run flow.
        router.replace('/(onboarding)/name');
      } catch {
        // Network / security-rules error — send to onboarding.
        // The user can complete onboarding and we will write the
        // Firestore doc then, resolving the inconsistency.
        router.replace('/(onboarding)/name');
      }
    });

    return () => unsubscribe();
  }, []);

  function routeByRole(role: string) {
    if (role === 'worker') {
      router.replace('/(worker)/(tabs)');
    } else {
      router.replace('/(customer)/(tabs)');
    }
  }

  // Web: native modules unavailable — render a static notice instead
  // of crashing. The app is not intended to run on web.
  if (Platform.OS === 'web') {
    return (
      <View style={[s.root, s.webRoot]}>
        <View style={s.monogramWrap}>
          <PCMonogram size={32} />
        </View>
        <Text style={s.wordmark}>PERFECT CLEANERS</Text>
        <Text style={s.webNotice}>
          Download the iOS or Android app to continue.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Animated.View style={[s.content, { opacity: fadeAnim }]}>
        <View style={s.monogramWrap}>
          <PCMonogram size={32} />
        </View>
        <Text style={s.wordmark}>PERFECT CLEANERS</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webRoot: {
    gap: 16,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  monogramWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wordmark: {
    fontFamily: typography.mono,
    fontSize: 9.5,
    letterSpacing: 1.2,
    color: colors.fg,
  },
  webNotice: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.fg3,
    letterSpacing: 0.2,
  },
});
