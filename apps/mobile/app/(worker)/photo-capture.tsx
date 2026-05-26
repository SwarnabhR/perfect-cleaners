import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, Check } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@pc/tokens';

const ANGLES: [string, boolean][] = [
  ['Front 3/4', true],
  ['Rear 3/4', true],
  ['Driver side', false],
  ['Passenger side', false],
];

export default function PhotoCapture() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const captured = ANGLES.filter(a => a[1]).length;

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={16} color={colors.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={s.eyebrow}>[PHOTOS] · #PC-2058 · BEFORE</Text>
        </View>

        <View style={s.titleSection}>
          <Text style={s.title}>4 angles, please.</Text>
          <Text style={s.subtitle}>Front, rear, both sides — clearly framed and well-lit.</Text>
        </View>

        {/* Angle grid */}
        <View style={s.angleGrid}>
          {ANGLES.map(([label, done]) => (
            <View key={label} style={s.angleCell}>
              {done ? (
                <View style={s.angleCaptured}>
                  <View style={s.angleCheck}>
                    <Check size={11} color="#fff" strokeWidth={2.5} />
                  </View>
                  <Text style={s.angleLabel}>{label.toUpperCase()}</Text>
                </View>
              ) : (
                <View style={s.angleEmpty}>
                  <Camera size={22} color={colors.fg3} strokeWidth={1.5} />
                  <Text style={s.angleEmptyLabel}>{label.toUpperCase()}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Condition notes */}
        <View style={s.notesSection}>
          <Text style={s.eyebrow}>[CONDITION NOTES] · OPTIONAL</Text>
          <View style={s.notesBox}>
            <Text style={s.notesText}>
              Small dent on rear bumper. Pollen-heavy windshield. Customer mentioned dashboard light scratch.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Capture button */}
      <View style={[s.footer, { paddingBottom: spacing[3] + insets.bottom }]}>
        <Text style={s.footerCount}>{captured} OF 4 CAPTURED</Text>
        <TouchableOpacity style={s.captureBtn}>
          <Camera size={22} color={colors.ink} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing[5], paddingVertical: spacing[3],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8, textTransform: 'uppercase' },
  titleSection: { paddingHorizontal: spacing[5], paddingTop: spacing[1] },
  title: { fontFamily: typography.serif, fontSize: typography['2xl'], color: colors.fg, letterSpacing: -0.3 },
  subtitle: { fontFamily: typography.sans, fontSize: 13, color: colors.fg2, marginTop: 4 },

  angleGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: spacing[5], paddingTop: spacing[5],
  },
  angleCell: {
    width: '47%', height: 130, borderRadius: radii.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.line,
  },
  angleCaptured: {
    flex: 1, backgroundColor: colors.cardHi,
    justifyContent: 'flex-end', padding: spacing[2],
  },
  angleCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 999, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  angleLabel: {
    fontFamily: typography.mono, fontSize: 9, color: '#fff', letterSpacing: 0.6,
    alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 3, paddingHorizontal: 7, borderRadius: 4,
  },
  angleEmpty: {
    flex: 1, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  angleEmptyLabel: { fontFamily: typography.mono, fontSize: 10, color: colors.fg3, letterSpacing: 0.8 },

  notesSection: { paddingHorizontal: spacing[5], paddingTop: spacing[5] },
  notesBox: {
    marginTop: spacing[2], padding: spacing[3],
    backgroundColor: colors.card, borderRadius: radii.sm,
    borderWidth: 1, borderColor: colors.line, minHeight: 80,
  },
  notesText: { fontFamily: typography.sans, fontSize: 13, color: colors.fg3, lineHeight: 20 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing[5], paddingTop: spacing[3],
    // paddingBottom set inline: spacing[3] + insets.bottom
    backgroundColor: 'rgba(14,13,11,0.95)',
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  footerCount: { fontFamily: typography.mono, fontSize: 9.5, color: colors.fg3, letterSpacing: 0.8 },
  captureBtn: {
    marginLeft: 'auto', width: 64, height: 64, borderRadius: 999,
    backgroundColor: '#fff', borderWidth: 4, borderColor: colors.lineStrong,
    alignItems: 'center', justifyContent: 'center',
  },
});
