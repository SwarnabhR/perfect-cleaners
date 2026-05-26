import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { colors, typography } from '@pc/tokens';

type AvatarProps = ViewProps & {
  name: string;
  size?: number;
  bg?: string;
};

export function Avatar({ name, size = 32, bg = colors.sage, style, ...rest }: AvatarProps) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[s.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, style]} {...rest}>
      <Text style={[s.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.sans,
    fontWeight: '600',
    color: '#fff',
  },
});
