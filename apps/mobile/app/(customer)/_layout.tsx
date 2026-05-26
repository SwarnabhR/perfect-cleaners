import { Stack } from 'expo-router';
import { colors } from '@pc/tokens';

export default function CustomerStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="booking" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="payment" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="payment-success" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="tracker" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="before-after" options={{ animation: 'fade' }} />
    </Stack>
  );
}
