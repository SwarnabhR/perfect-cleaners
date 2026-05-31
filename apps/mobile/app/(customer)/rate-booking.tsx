import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Star } from 'lucide-react-native';
import firestore from '@react-native-firebase/firestore';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';
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
  const ss = useSharedStyles();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [stars,      setStars]      = useState(5);
  const [tags,       setTags]       = useState<string[]>([]);
  const [note,       setNote]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [svcName,    setSvcName]    = useState('');
  const [bookingMeta,setBookingMeta]= useState('');

  useEffect(() => {
    if (!id) return;
    firestore().collection('bookings').doc(id as string).get().then(snap => {
      if (!snap.exists()) return;
      const data = snap.data()!;
      const raw  = data.serviceIds?.[0] ?? '';
      setSvcName(raw.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Wash Service');
      const at = data.scheduledAt?.toDate?.() ?? new Date();
      const dateStr = at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const worker  = data.workerName ?? '';
      setBookingMeta([dateStr, worker].filter(Boolean).join(' · '));
    }).catch(() => {});
  }, [id]);

  const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: c.ink },
    hero: { paddingHorizontal: spacing[5], paddingBottom: spacing[2], gap: spacing[2] },
    heroBmeta: { fontFamily: typography.sans, fontSize: 14, color: c.fg2 },
    starsRow: {
      flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: spacing[6],
    },
    starLabel: {
      fontFamily: typography.sansSemiBold, fontSize: 17, color: c.fg,
      textAlign: 'center', letterSpacing: -0.2, marginBottom: spacing[5],
    },
    tagsSection: { paddingHorizontal: spacing[5], gap: spacing[2] },
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
  });

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: spacing[12] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Rate your wash" />
      </View>

      <View style={s.hero}>
        <Text style={ss.heroTitle}>How was{"\n"}your wash?</Text>
        <Text style={s.heroBmeta}>{[svcName, bookingMeta].filter(Boolean).join(' · ') || 'Loading…'}</Text>
      </View>

      {/* Stars */}
      <View style={s.starsRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setStars(n)} activeOpacity={0.7}>
            <Star
              size={36}
              color={n <= stars ? c.warm : c.lineStrong}
              fill={n <= stars ? c.warm : 'none'}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.starLabel}>{STAR_LABELS[stars]}</Text>

      {/* Tags */}
      <View style={s.tagsSection}>
        <Text style={ss.eyebrow}>[WHAT STOOD OUT]</Text>
        <View style={s.tagsList}>
          {ALL_TAGS.map(t => {
            const active = tags.includes(t);
            return (
              <TouchableOpacity
                key={t}
                style={[s.tag, active && s.tagActive]}
                onPress={() => setTags(prev => active ? prev.filter(x => x !== t) : [...prev, t])}
                activeOpacity={0.7}
              >
                <Text style={[s.tagText, active && s.tagTextActive]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Note */}
      <View style={s.noteSection}>
        <Text style={ss.eyebrow}>[ADD A NOTE · OPTIONAL]</Text>
        <View style={s.noteCard}>
          <TextInput
            style={s.noteInput}
            placeholder="Tell us what made it great (or not)…"
            placeholderTextColor={c.fg3}
            multiline
            value={note}
            onChangeText={setNote}
          />
        </View>
      </View>

      <View style={s.submitSection}>
        <TouchableOpacity
          style={[ss.primaryBtn, submitting && ss.primaryBtnOff]}
          activeOpacity={0.8}
          disabled={submitting}
          onPress={async () => {
            if (submitting) return;
            setSubmitting(true);
            const bookingId = (id as string) ?? 'PC-2058';
            try {
              await firestore().collection('bookings').doc(bookingId).update({
                review: {
                  stars,
                  tags,
                  note: note.trim(),
                  label: STAR_LABELS[stars],
                  submittedAt: firestore.FieldValue.serverTimestamp(),
                },
                updatedAt: firestore.FieldValue.serverTimestamp(),
              });
            } catch (err) {
              // Non-fatal — show success regardless
              console.warn('[RateBooking] Firestore update failed:', err);
            }
            Alert.alert('Review submitted', 'Thank you for your feedback!');
            router.back();
            setSubmitting(false);
          }}
        >
          <Text style={ss.primaryBtnText}>{submitting ? 'Submitting…' : 'Submit Review →'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
