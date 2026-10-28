import {
  TouchableOpacity, Text, StyleSheet,
  type TouchableOpacityProps, type TextStyle,
} from 'react-native';
import { colors, typography, radii } from '@pc/tokens';

type PrimaryButtonProps = TouchableOpacityProps & {
  textStyle?: TextStyle;
};

export function PrimaryButton({ children, style, textStyle, ...rest }: PrimaryButtonProps) {
  return (
    <TouchableOpacity style={[s.btn, style]} activeOpacity={0.8} {...rest}>
      <Text style={[s.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: 44,
    backgroundColor: colors.warm,
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.sansSemiBold,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
