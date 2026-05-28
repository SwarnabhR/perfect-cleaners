import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { radii } from '@pc/tokens';
import { useThemeColors } from '../theme';

interface Props {
  /** Override default router.back() action */
  onPress?: () => void;
}

/**
 * Round outlined back button with ChevronLeft icon.
 * Used in OTP screen and all onboarding screens.
 */
export default function BackButton({ onPress }: Props) {
  const router = useRouter();
  const c = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: c.card, borderColor: c.line },
      ]}
      onPress={onPress ?? (() => router.back())}
      activeOpacity={0.75}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <ChevronLeft size={16} color={c.fg} strokeWidth={1.5} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
