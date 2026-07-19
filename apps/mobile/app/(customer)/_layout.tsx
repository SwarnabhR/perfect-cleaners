import { Stack } from 'expo-router';
import { useThemeColors } from '../../theme';

export default function CustomerStackLayout() {
  const c = useThemeColors();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.ink } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="booking"         options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="payment"         options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="payment-success" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="tracker"         options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="before-after"    options={{ animation: 'fade' }} />
      <Stack.Screen name="booking-detail"  options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="rate-booking"    options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="notifications"   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="addresses"       options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="cars"            options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings"        options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="wallet"          options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="referral"        options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="help"            options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="support-chat"    options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="payment-methods" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="cleaning-schedule" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
