import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { colors, typography } from '@pc/tokens';

const PALETTES = {
  dark: ['#1a1816', '#0a0908', '#2a2725'],
  sage: ['#4A5E44', '#2f3d2c', '#5B6F52'],
  light: ['#3a3835', '#1a1816', '#26241f'],
};

type CarImageProps = ViewProps & {
  tone?: keyof typeof PALETTES;
  label?: string;
};

export function CarImage({ tone = 'dark', label, style, ...rest }: CarImageProps) {
  const [a, b, c] = PALETTES[tone] || PALETTES.dark;
  return (
    <View style={[s.box, { backgroundColor: a }, style]} {...rest}>
      {/* Spotlight gradient */}
      <View style={s.spotlight} />
      {/* Car silhouette */}
      <View style={[s.silhouette, { borderColor: 'rgba(255,255,255,0.18)' }]}>
        <View style={s.roof} />
        <View style={[s.wheel, { left: 20 }]} />
        <View style={[s.wheel, { right: 20 }]} />
      </View>
      {label && (
        <View style={s.labelBox}>
          <Text style={s.labelText}>[{label}]</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  spotlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: '80%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  silhouette: {
    position: 'absolute',
    bottom: 16, left: 16, right: 16,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
  },
  roof: {
    position: 'absolute',
    top: -14, left: 20, right: 20,
    height: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  wheel: {
    position: 'absolute',
    bottom: -6, width: 14, height: 14,
    borderRadius: 7,
    backgroundColor: '#0a0908',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  labelBox: {
    position: 'absolute',
    top: 10, left: 10,
    paddingVertical: 3, paddingHorizontal: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  labelText: {
    fontFamily: typography.mono,
    fontSize: 9,
    color: colors.fg2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
