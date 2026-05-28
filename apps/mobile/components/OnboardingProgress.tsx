import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme';

interface Props {
  /** 1-based current step index */
  current: number;
  /** Total number of steps */
  total: number;
}

/**
 * Horizontal pill-dot progress bar for onboarding screens.
 * Active step is filled with `c.warm`; inactive steps use `c.line`.
 */
export default function OnboardingProgress({ current, total }: Props) {
  const c = useThemeColors();

  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i + 1 === current ? c.warm : c.line },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  dot: { width: 20, height: 3, borderRadius: 999 },
});
