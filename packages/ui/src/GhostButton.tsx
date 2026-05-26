import {
  TouchableOpacity, Text, StyleSheet,
  type TouchableOpacityProps, type TextStyle,
} from 'react-native';
import { colors, typography, radii } from '@pc/tokens';

type GhostButtonProps = TouchableOpacityProps & {
  textStyle?: TextStyle;
};

export function GhostButton({ children, style, textStyle, ...rest }: GhostButtonProps) {
  return (
    <TouchableOpacity style={[s.btn, style]} activeOpacity={0.8} {...rest}>
      <Text style={[s.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: 'transparent',
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  text: {
    fontFamily: typography.sans,
    fontSize: 13,
    color: colors.fg,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
