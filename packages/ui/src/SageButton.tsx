import {
  TouchableOpacity, Text, StyleSheet,
  type TouchableOpacityProps, type TextStyle,
} from 'react-native';
import { colors, typography, radii } from '@pc/tokens';

type SageButtonProps = TouchableOpacityProps & {
  textStyle?: TextStyle;
};

export function SageButton({ children, style, textStyle, ...rest }: SageButtonProps) {
  return (
    <TouchableOpacity style={[s.btn, style]} activeOpacity={0.8} {...rest}>
      <Text style={[s.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: colors.sage,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.6,
  },
});
