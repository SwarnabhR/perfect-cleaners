import { Text, type TextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@pc/tokens';

type EyebrowProps = TextProps & {
  color?: string;
};

export function Eyebrow({ children, color, style, ...rest }: EyebrowProps) {
  return (
    <Text style={[s.base, { color: color || colors.fg3 }, style]} {...rest}>
      {children}
    </Text>
  );
}

const s = StyleSheet.create({
  base: {
    fontFamily: typography.mono,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
