import { View, StyleSheet, type ViewProps } from 'react-native';

const COLORS = ['#A4736A', '#7A8A6F', '#86678A', '#6F8FA4'];

type AvatarStackProps = ViewProps & {
  count?: number;
};

export function AvatarStack({ count = 3, style, ...rest }: AvatarStackProps) {
  return (
    <View style={[s.row, style]} {...rest}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[s.circle, { backgroundColor: COLORS[i % COLORS.length], marginLeft: i === 0 ? 0 : -8 }]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row' as const, alignItems: 'center' as const },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
});
