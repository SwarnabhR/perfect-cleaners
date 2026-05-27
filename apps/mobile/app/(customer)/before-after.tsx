import { useState, useRef } from 'react';
import {
  ImageBackground, View, Text, TouchableOpacity, StyleSheet,
  PanResponder, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';

const COMPARATOR_H_MARGIN = spacing[5] * 2;
const BRAND_HERO = require('../../../../design-system/assets/brand-hero.png');

export default function BeforeAfterViewer() {
  const [pos, setPos] = useState(56);
  const comparatorWidth = useRef(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SW } = useWindowDimensions();

  function clampPos(x: number): number {
    const w = comparatorWidth.current || SW - COMPARATOR_H_MARGIN;
    return Math.min(95, Math.max(5, (x / w) * 100));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setPos(clampPos(e.nativeEvent.locationX));
      },
      onPanResponderMove: (e) => {
        setPos(clampPos(e.nativeEvent.locationX));
      },
    }),
  ).current;

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <X size={16} color={colors.fg} strokeWidth={1.5} />
        </TouchableOpacity>
        <View>
          <Text style={s.eyebrow}>[BEFORE / AFTER] · #PC-2058</Text>
          <Text style={s.serviceName}>Premium Wash + Interior</Text>
        </View>
      </View>

      {/* Image comparator — touch anywhere to drag */}
      <View
        style={s.comparator}
        onLayout={e => { comparatorWidth.current = e.nativeEvent.layout.width; }}
        {...panResponder.panHandlers}
      >
        {/* Before (full width, dull) */}
        <View style={s.beforeLayer}>
          <ImageBackground source={BRAND_HERO} resizeMode="cover" style={s.compareImage}>
            <View style={s.beforeWash} />
            <View style={s.beforeDust} />
          </ImageBackground>
          <View style={s.labelBefore}>
            <Text style={s.labelText}>BEFORE</Text>
          </View>
        </View>

        {/* After (clipped to pos%) */}
        <View style={[s.afterLayer, { width: `${pos}%` as any }]}>
          <ImageBackground
            source={BRAND_HERO}
            resizeMode="cover"
            style={[s.compareImage, { width: comparatorWidth.current || SW - COMPARATOR_H_MARGIN }]}
          >
            <View style={s.afterPolish} />
          </ImageBackground>
          <View style={s.labelAfter}>
            <Text style={s.labelTextAfter}>AFTER</Text>
          </View>
        </View>

        {/* Divider line */}
        <View style={[s.divider, { left: `${pos}%` as any }]} />

        {/* Drag handle */}
        <View style={[s.handle, { left: `${pos}%` as any }]}>
          <ChevronLeft size={14} color={colors.ink} strokeWidth={2.5} />
          <ChevronRight size={14} color={colors.ink} strokeWidth={2.5} />
        </View>
      </View>

      {/* Bottom slider — tap anywhere on track */}
      <View style={s.sliderSection}>
        <View
          style={s.sliderTrackOuter}
          onStartShouldSetResponder={() => true}
          onResponderGrant={e => setPos(clampPos(e.nativeEvent.locationX))}
          onResponderMove={e => setPos(clampPos(e.nativeEvent.locationX))}
        >
          <View style={[s.sliderFill, { width: `${pos}%` as any }]} />
          <View style={[s.sliderThumb, { left: `${pos}%` as any }]} />
        </View>
        <View style={s.sliderLabels}>
          <Text style={s.sliderLabel}>← DRAG TO COMPARE</Text>
          <Text style={s.sliderLabel}>27 MAY · 12:48 PM</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(7,6,10,0.97)' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing[5], paddingVertical: spacing[3],
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
  serviceName: { fontFamily: typography.sansMedium, fontSize: 13, color: colors.fg },

  comparator: {
    flex: 1, marginHorizontal: spacing[5],
    borderRadius: radii.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.line,
    position: 'relative',
  },

  beforeLayer: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: '#1c1a17',
  },
  afterLayer: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    overflow: 'hidden',
    backgroundColor: '#0e0d0b',
  },
  compareImage: { flex: 1 },
  beforeWash: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(48,44,38,0.46)',
  },
  beforeDust: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%',
    backgroundColor: 'rgba(120,108,88,0.18)',
  },
  afterPolish: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(14,13,11,0.08)',
  },

  divider: {
    position: 'absolute', top: 0, bottom: 0,
    width: 2, backgroundColor: '#fff',
    shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 6,
  },
  handle: {
    position: 'absolute', top: '50%',
    width: 44, height: 44, borderRadius: 999,
    backgroundColor: '#fff',
    transform: [{ translateX: -22 }, { translateY: -22 }],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12,
    elevation: 8,
  },

  labelBefore: {
    position: 'absolute', top: 12, left: 12,
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  labelText: { fontFamily: typography.mono, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8 },
  labelAfter: {
    position: 'absolute', top: 12, right: 12,
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4,
    backgroundColor: colors.sage,
  },
  labelTextAfter: { fontFamily: typography.mono, fontSize: 10, color: '#fff', letterSpacing: 0.8 },

  sliderSection: { paddingHorizontal: spacing[5], paddingVertical: spacing[6] },
  sliderTrackOuter: {
    height: 3, backgroundColor: colors.lineStrong, borderRadius: 2,
    position: 'relative',
  },
  sliderFill: { height: '100%', backgroundColor: colors.warm, borderRadius: 2 },
  sliderThumb: {
    position: 'absolute', top: -11, width: 24, height: 24, borderRadius: 999,
    backgroundColor: '#fff', marginLeft: -12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[3],
  },
  sliderLabel: { fontFamily: typography.mono, fontSize: 10, color: colors.fg3, letterSpacing: 0.8 },
});
