import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, radii } from '@pc/tokens';

export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[s.card, style]} {...rest}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: 16,
  },
});
