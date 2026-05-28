import { useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Star } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { ScreenHeader } from '../../components/RowGroup';

const ALL_TAGS = [
  'On-time',
  'Spotless finish',
  'Polite & professional',
  'Careful with paint',
  'Great communication',
  'Smelled fresh',
  'Worth every rupee',
];

const STAR_LABELS = ['', 'Disappointed', 'Could be better', 'Good', 'Great', 'Perfect'];

export default function RateBookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [stars, setStars] = useState(5);
  const [tags, setTags]   = useState<string[]>(['On-time', 'Spotless finish']);
  const [note, setNote]   = useState('');

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    hero: { paddingHorizontal: spacing[5], paddingBottom: spacing[2], gap: spacing[2] },
    heroTitle: {
      fontFamily: typography.serif, fontSize: 36, color: c.fg,
      letterSpacing: -0.4, lineHeight: 40,
    },
    heroBmeta: { fontFamily: typography.sans, fontSize: 14, color: c.fg2 },
    starsRow: {
      flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: spacing[6],
    },
    starLabel: {
      fontFamily: typography.sansSemiBold, fontSize: 17, color: c.fg,
      textAlign: 'center', letterSpacing: -0.2, marginBottom: spacing[5],
    },
    tagsSection: { paddingHorizontal: spacing[5], gap: spacing[2] },
    tagsEyebrow: {
      fontFamily: typography.mono, fontSize: 9.5, color: c.fg3,
      letterSpacing: 0.8, textTransform: 'uppercase',
    },
    tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
      paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill,
      borderWidth: 1, borderColor: c.line, backgroundColor: c.card,
    },
    tagActive: { backgroundColor: c.sageHi, borderColor: 'transparent' },
    tagText: { fontFamily: typography.sansMedium, fontSize: 13, color: c.fg2 },
    tagTextActive: { color: '#fff' },
    noteSection: { paddingHorizontal: spacing[5], paddingTop: spacing[5] },
    noteCard: {
      backgroundColor: c.card, borderRadius: radii.md,
      borderWidth: 1, borderColor: c.line, padding: 14,
    },
    noteInput: {
      fontFamily: typography.sans, fontSize: 14, color: c.fg, minHeight: 80, padding: 0,
    },
    submitSection: { paddingHorizontal: spacing[5], paddingTop: spacing[5] },
    submitBtn: {
      backgroundColor: c.warm, borderRadius: radii.pill, paddingVertical: 14, alignItems: 'center',
    },
    submitBtnText: {
      fontFamily: typography.sansSemiBold, fontSize: 13, color: c.ink, letterSpacing: 0.6,
    },
  });

  function toggleTag(t: string) {
    setTags(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);
  }

  function handleSubmit() {
    Alert.alert(
      'Review submitted',
      `${stars} stars · "${STAR_LABELS[stars]}" for booking ${id ?? '#PC-2041'}.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[10] }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Rate your wash" />
      </View>

      <View style={s.hero}>
        <Text style={s.heroTitle}>How was{'\n'}your wash?</Text>
        <Text style={s.heroBmeta}>Exterior Wash · 22 May · Rahul Sharma</Text>
      </View>

      <View style={s.starsRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setStars(n)} activeOpacity={0.75}>
            <Star
              size={44}
              color={n <= stars ? c.gold : c.fg4}
              fill={n <= stars ? c.gold : 'transparent'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.starLabel}>{STAR_LABELS[stars]}</Text>

      <View style={s.tagsSection}>
        <Text style={s.tagsEyebrow}>[WHAT STOOD OUT?]</Text>
        <View style={s.tagsList}>
          {ALL_TAGS.map(t => {
            const active = tags.includes(t);
            return (
              <TouchableOpacity
                key={t}
                style={[s.tag, active && s.tagActive]}
                onPress={() => toggleTag(t)}
                activeOpacity={0.8}
              >
                <Text style={[s.tagText, active && s.tagTextActive]}>
                  {active ? '✓ ' : ''}{t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={s.noteSection}>
        <View style={s.noteCard}>
          <TextInput
            style={s.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Tell us more (optional)"
            placeholderTextColor={c.fg3}
            multiline
            numberOfLines={3}
            maxLength={300}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={s.submitSection}>
        <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={s.submitBtnText}>Submit Review →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
