import { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography } from '@pc/tokens';
import PCMonogram from '../components/PCMonogram';

export default function Index() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Check auth/role state
    (async () => {
      const onboarding = await AsyncStorage.getItem('@pc/onboarding');
      if (!onboarding) {
        router.replace('/(auth)/login');
        return;
      }
      const role = await AsyncStorage.getItem('@pc/role');
      if (role === 'worker') {
        router.replace('/(worker)/(tabs)');
      } else {
        router.replace('/(customer)/(tabs)');
      }
    })();
  }, []);

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
});
