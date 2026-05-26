import { View, Text, StyleSheet, type ViewProps, type TextStyle } from 'react-native';
import { colors, typography, radii } from '@pc/tokens';

type PillProps = ViewProps & {
  sage?: boolean;
  dark?: boolean;
  textStyle?: TextStyle;
};

export function Pill({ children, sage, dark, style, textStyle, ...rest }: PillProps) {
  return (
    <View style={[s.pill, sage && s.sage, dark && s.dark, style]} {...rest}>
      <Text style={[s.text, sage && s.sageText, dark && s.darkText, textStyle]}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sage: {
    backgroundColor: colors.sage,
    borderColor: 'transparent',
  },
  dark: {
    backgroundColor: colors.card,
  },
  text: {
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: '500',
    color: colors.fg,
  },
  sageText: { color: '#fff' },
  darkText: { color: colors.fg },
});
