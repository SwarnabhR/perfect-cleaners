import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography, radii } from '@pc/tokens';

export interface CreditCardProps {
  last4: string;
  brand: 'visa' | 'mastercard' | 'rupay' | 'amex';
  name: string;
  expiry: string; // 'MM/YY'
  gradientIndex?: number; // 0-3
  flipped?: boolean; // shows back of card
  width?: number;
}

const GRADIENTS = [
  ['#1C1B19', '#2E2B28'], // 0: dark
  ['#1A2E1A', '#2A3F2A'], // 1: sage
  ['#1A1A2E', '#2A2A3F'], // 2: ink blue
  ['#2E1A1A', '#3F2A2A'], // 3: muted crimson
];

export function CreditCard({
  last4,
  brand,
  name,
  expiry,
  gradientIndex = 0,
  flipped = false,
  width = 300,
}: CreditCardProps) {
  const height = width * 0.63;
  const gradient = GRADIENTS[gradientIndex % GRADIENTS.length];
  const flipAnim = useRef(new Animated.Value(flipped ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(flipAnim, {
      toValue: flipped ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [flipped]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  return (
    <View style={{ width, height }}>
      {/* Front */}
      <Animated.View style={[s.cardBase, { width, height, backgroundColor: gradient[0] }, frontAnimatedStyle, s.front]}>
        <View style={[s.gradientOverlay, { backgroundColor: gradient[1] }]} />
        
        <View style={s.topRow}>
          <Text style={s.brand}>{brand.toUpperCase()}</Text>
          <View style={s.monogram}>
            <Text style={s.monogramText}>PC</Text>
          </View>
        </View>

        <View style={s.chip} />
        
        <Text style={s.number}>•••• •••• •••• {last4}</Text>
        
        <View style={s.bottomRow}>
          <Text style={s.name}>{name.toUpperCase()}</Text>
          <Text style={s.expiry}>EXPIRES{'\n'}{expiry}</Text>
        </View>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[s.cardBase, { width, height, backgroundColor: gradient[0] }, backAnimatedStyle, s.back]}>
        <View style={[s.gradientOverlay, { backgroundColor: gradient[1] }]} />
        
        <View style={s.magstripe} />
        
        <View style={s.sigStripRow}>
          <View style={s.sigStrip} />
          <View style={s.cvvBox}>
            <Text style={s.cvvText}>•••</Text>
          </View>
        </View>

        <Text style={s.securityNote}>For security, never share your CVV</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  cardBase: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'absolute',
    top: 0, left: 0,
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  front: { padding: 24, justifyContent: 'space-between' },
  back: { },
  gradientOverlay: {
    position: 'absolute', bottom: 0, right: 0, width: '60%', height: '60%',
    opacity: 0.6, borderTopLeftRadius: radii.xl,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontFamily: typography.sansBold, fontSize: 14, color: colors.fg, letterSpacing: 2 },
  monogram: { width: 24, height: 24, borderRadius: 4, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  monogramText: { fontFamily: typography.mono, fontSize: 8, color: colors.warm },
  chip: { width: 28, height: 20, borderRadius: 4, backgroundColor: colors.gold, opacity: 0.7, marginTop: 12 },
  number: { fontFamily: typography.mono, fontSize: 18, color: colors.fg, letterSpacing: 3, marginTop: 16 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' },
  name: { fontFamily: typography.sansMedium, fontSize: 11, color: colors.fg2 },
  expiry: { fontFamily: typography.mono, fontSize: 9, color: colors.fg3, textAlign: 'right' },
  
  magstripe: { width: '100%', height: 40, backgroundColor: '#000', marginTop: 32 },
  sigStripRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginHorizontal: 20 },
  sigStrip: { flex: 1, height: 36, backgroundColor: colors.warm },
  cvvBox: { height: 36, backgroundColor: '#fff', justifyContent: 'center', paddingHorizontal: 12 },
  cvvText: { fontFamily: typography.mono, fontSize: 14, color: colors.ink },
  securityNote: { fontFamily: typography.mono, fontSize: 9, color: colors.fg3, textAlign: 'center', position: 'absolute', bottom: 16, width: '100%' },
});
