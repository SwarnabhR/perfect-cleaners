import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { typography } from '@pc/tokens';
import { useThemeColors } from '../theme';
import BrandLogo from '../components/BrandLogo';

const KEY_ONBOARDING = '@pc/onboarding';
const KEY_ROLE       = '@pc/role';
const DEMO_UID = 'demo-user';

export default function Index() {
  const router   = useRouter();
  const c        = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();

    if (Platform.OS === 'web') return;

    const unsubscribe = auth().onAuthStateChanged(async user => {
      if (!user) { router.replace('/(auth)/login'); return; }
      if (user.uid === DEMO_UID) { router.replace('/(customer)/(tabs)'); return; }

      try {
        const [cachedOnboarding, cachedRole] = await Promise.all([
          AsyncStorage.getItem(KEY_ONBOARDING),
          AsyncStorage.getItem(KEY_ROLE),
        ]);

        if (cachedOnboarding === 'done' && cachedRole) {
          routeByRole(cachedRole);
          return;
        }

        const snap = await firestore().collection('customers').doc(user.uid).get();
        if (Boolean(snap.exists)) {
          const data = snap.data()!;
          if (data.onboardingComplete === true) {
            const role = (data.role as string) || 'customer';
            await Promise.all([
              AsyncStorage.setItem(KEY_ONBOARDING, 'done'),
              AsyncStorage.setItem(KEY_ROLE, role),
            ]);
            routeByRole(role);
            return;
          }
        }
        router.replace('/(onboarding)/name');
      } catch {
        router.replace('/(onboarding)/name');
      }
    });

    return () => unsubscribe();
  }, []);

  function routeByRole(role: string) {
    router.replace(role === 'worker' ? '/(worker)/(tabs)' : '/(customer)/(tabs)');
  }

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' },
    webNotice: { fontFamily: typography.sans, fontSize: 13, color: c.fg3, letterSpacing: 0.2 },
  });

  if (Platform.OS === 'web') {
    return (
      <View style={[s.root, { gap: 16 }]}>
        <BrandLogo size="sm" />
        <Text style={s.webNotice}>Download the iOS or Android app to continue.</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Animated.View style={{ alignItems: 'center', gap: 12, opacity: fadeAnim }}>
        <BrandLogo size="sm" />
      </Animated.View>
    </View>
  );
}
