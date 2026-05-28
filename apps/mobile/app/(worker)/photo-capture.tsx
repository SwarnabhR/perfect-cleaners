import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, Check } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

const ANGLES: [string, boolean][] = [
  ['Front 3/4',       true],
  ['Rear 3/4',        true],
  ['Driver side',     false],
  ['Passenger side',  false],
];

export default function PhotoCapture() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useThemeColors();
  const ss = useSharedStyles();
  const captured = ANGLES.filter(a => a[1]).length;

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },

    titleSection: { paddingHorizontal: spacing[5], paddingTop: spacing[1] },
    subtitle: { fontFamily: typography.sans, fontSize: 13, color: c.fg2, marginTop: 4 },

    angleGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 10,
      paddingHorizontal: spacing[5], paddingTop: spacing[5],
    },
    angleCell: {
      width: '47%', height: 130, borderRadius: radii.md, overflow: 'hidden',
      borderWidth: 1, borderColor: c.line,
    },
    angleCaptured: {
      flex: 1, backgroundColor: c.cardHi, justifyContent: 'flex-end', padding: spacing[2],
    },
    angleCheck: {
      position: 'absolute', top: 8, right: 8,
      width: 22, height: 22, borderRadius: 999, backgroundColor: c.sage,
      alignItems: 'center', justifyContent: 'center',
    },
    angleLabel: {
      fontFamily: typography.mono, fontSize: 9, color: '#fff', letterSpacing: 0.6,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0,0,0,0.5)', // always-dark photo label overlay
      paddingVertical: 3, paddingHorizontal: 7, borderRadius: 4,
    },
    angleEmpty: {
      flex: 1, backgroundColor: c.card,
      alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    angleEmptyLabel: { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.8 },

    notesSection: { paddingHorizontal: spacing[5], paddingTop: spacing[5] },
    notesBox: {
      marginTop: spacing[2], padding: spacing[3],
      backgroundColor: c.card, borderRadius: radii.sm,
      borderWidth: 1, borderColor: c.line, minHeight: 80,
    },
    notesText: { fontFamily: typography.sans, fontSize: 13, color: c.fg3, lineHeight: 20 },

    footerCount:  { fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8 },
    captureBtn: {
      marginLeft: 'auto', width: 64, height: 64, borderRadius: 999,
      backgroundColor: c.fg, borderWidth: 4, borderColor: c.lineStrong,
      alignItems: 'center', justifyContent: 'center',
    },
  });

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[5], paddingVertical: spacing[3] }}>
          <TouchableOpacity style={ss.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={16} color={c.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={ss.eyebrow}>[PHOTOS] · #PC-2058 · BEFORE</Text>
        </View>

        <View style={s.titleSection}>
          <Text style={ss.heroTitle}>4 angles, please.</Text>
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
                  <Camera size={22} color={c.fg3} strokeWidth={1.5} />
                  <Text style={s.angleEmptyLabel}>{label.toUpperCase()}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Condition notes */}
        <View style={s.notesSection}>
          <Text style={ss.eyebrow}>[CONDITION NOTES] · OPTIONAL</Text>
          <View style={s.notesBox}>
            <Text style={s.notesText}>
              Small dent on rear bumper. Pollen-heavy windshield. Customer mentioned dashboard light scratch.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Capture button */}
      <View style={[
        ss.footerBar,
        {
          position: 'absolute', bottom: 0, left: 0, right: 0,
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: spacing[5], paddingTop: spacing[3],
          paddingBottom: spacing[3] + insets.bottom,
        },
      ]}>
        <Text style={s.footerCount}>{captured} OF 4 CAPTURED</Text>
        <TouchableOpacity style={s.captureBtn}>
          <Camera size={22} color={c.ink} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
