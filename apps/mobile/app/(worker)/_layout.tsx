import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '../../theme';

export default function WorkerStackLayout() {
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const c = useThemeColors();

  useEffect(() => {
    AsyncStorage.getItem('@pc/role').then(role => {
      if (role !== 'worker') {
        router.replace('/(customer)/(tabs)');
      } else {
        setChecked(true);
      }
    });
  }, [router]);

  if (!checked) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.ink } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="job-detail"    options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="photo-capture" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="otp-complete"  options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack>
  );
}
