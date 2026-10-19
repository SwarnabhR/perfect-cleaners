import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '../../theme';

export default function AdminStackLayout() {
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const c = useThemeColors();

  useEffect(() => {
    AsyncStorage.getItem('@pc/role').then(role => {
      if (role !== 'admin') router.replace('/');
      else setChecked(true);
    });
  }, [router]);

  if (!checked) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.ink } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="session/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
