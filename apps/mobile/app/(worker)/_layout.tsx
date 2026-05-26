import { Stack } from 'expo-router';
import { colors } from '@pc/tokens';

export default function WorkerStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="job-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="photo-capture" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="otp-complete" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack>
  );
}
