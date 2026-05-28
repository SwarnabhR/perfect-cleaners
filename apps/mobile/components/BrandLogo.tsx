import { View, Text, StyleSheet } from 'react-native';
import { typography, radii } from '@pc/tokens';
import { useThemeColors } from '../theme';
import PCMonogram from './PCMonogram';

interface Props {
  /** Size of the monogram container. Defaults to 64. */
  size?: 'sm' | 'md' | 'lg';
  /** Show tagline below wordmark. Defaults to false. */
  tagline?: string;
}

const SIZES = {
  sm: { container: 32, monogram: 18, containerRadius: 8 },
  md: { container: 48, monogram: 26, containerRadius: 10 },
  lg: { container: 64, monogram: 34, containerRadius: 12 },
} as const;

/**
 * Shared brand block: rounded monogram square + "PERFECT CLEANERS" wordmark.
 * Used on the splash screen and the login screen.
 */
export default function BrandLogo({ size = 'lg', tagline }: Props) {
  const c = useThemeColors();
  const { container, monogram, containerRadius } = SIZES[size];

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.monogramWrap,
          { width: container, height: container, borderRadius: containerRadius, backgroundColor: c.sage },
        ]}
      >
        <PCMonogram size={monogram} color={c.warm} />
      </View>
      <Text style={[styles.wordmark, { color: c.fg }]}>PERFECT CLEANERS</Text>
      {tagline ? <Text style={[styles.tagline, { color: c.fg3 }]}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 8 },
  monogramWrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  wordmark: {
    fontFamily: typography.serif,
    fontSize: (typography as any)['2xl'] ?? 24,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  tagline: {
    fontFamily: typography.sans,
    fontSize: (typography as any).xs ?? 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
