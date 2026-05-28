import { Stack } from 'expo-router';
import { useThemeColors } from '../../theme';

export default function OnboardingLayout() {
  const c = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.ink },
        animation: 'slide_from_right',
      }}
    />
  );
}
