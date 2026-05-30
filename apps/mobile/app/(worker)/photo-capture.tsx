import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../../theme';
import { useSharedStyles } from '../../theme/sharedStyles';

const ANGLES = ['Front 3/4', 'Rear 3/4', 'Driver side', 'Passenger side'] as const;
type Angle = typeof ANGLES[number];

export default function PhotoCapture() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c  = useThemeColors();
  const ss = useSharedStyles();
  const { bookingId = 'PC-2058', phase = 'before' } = useLocalSearchParams<{ bookingId?: string; phase?: string }>();

  const [captured,  setCaptured]  = useState<Partial<Record<Angle, string>>>({});
  const [uploading, setUploading] = useState<Angle | null>(null);

  const captureCount = Object.keys(captured).length;

  async function captureAngle(angle: Angle) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to capture job photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setUploading(angle);
    try {
      const filename = `${angle.replace(/\s+/g, '-').replace(/\//g, '-').toLowerCase()}.jpg`;
      const storagePath = `jobs/${bookingId}/${phase}/${filename}`;
      const ref = storage().ref(storagePath);
      await ref.putFile(uri);
      const downloadURL = await ref.getDownloadURL();

      // Write URL into booking document
      await firestore().collection('bookings').doc(bookingId).update({
        [`photos.${phase}`]: firestore.FieldValue.arrayUnion(downloadURL),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      setCaptured(prev => ({ ...prev, [angle]: downloadURL }));
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message ?? 'Could not upload the photo. Please try again.');
    } finally {
      setUploading(null);
    }
  }

  const s = StyleSheet.create({
    root:      { flex: 1, backgroundColor: c.ink },
    titleSection: { paddingHorizontal: spacing[5], paddingTop: spacing[1] },
    subtitle:  { fontFamily: typography.sans, fontSize: 13, color: c.fg2, marginTop: 4 },
    angleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing[5], paddingTop: spacing[5] },
    angleCell: { width: '47%', height: 130, borderRadius: radii.md, overflow: 'hidden', borderWidth: 1, borderColor: c.line },
    angleCaptured:   { flex: 1, backgroundColor: c.cardHi, justifyContent: 'flex-end', padding: spacing[2] },
    angleCheck:      { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 999, backgroundColor: c.sage, alignItems: 'center', justifyContent: 'center' },
    angleLabel:      { fontFamily: typography.mono, fontSize: 9, color: '#fff', letterSpacing: 0.6, alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 3, paddingHorizontal: 7, borderRadius: 4 },
    angleEmpty:      { flex: 1, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', gap: 8 },
    angleEmptyLabel: { fontFamily: typography.mono, fontSize: 10, color: c.fg3, letterSpacing: 0.8 },
    angleUploading:  { flex: 1, backgroundColor: c.cardHi, alignItems: 'center', justifyContent: 'center', gap: 8 },
    notesSection: { paddingHorizontal: spacing[5], paddingTop: spacing[5] },
    notesBox: { marginTop: spacing[2], padding: spacing[3], backgroundColor: c.card, borderRadius: radii.sm, borderWidth: 1, borderColor: c.line, minHeight: 60, justifyContent: 'center' },
    notesText:   { fontFamily: typography.sans, fontSize: 13, color: c.fg3 },
    footerCount: { fontFamily: typography.mono, fontSize: 9.5, color: c.fg3, letterSpacing: 0.8 },
    captureBtn:  { marginLeft: 'auto', width: 64, height: 64, borderRadius: 999, backgroundColor: c.fg, borderWidth: 4, borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' },
  });

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[5], paddingVertical: spacing[3] }}>
          <TouchableOpacity style={ss.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={16} color={c.fg} strokeWidth={1.5} />
          </TouchableOpacity>
          <Text style={ss.eyebrow}>[PHOTOS] · #{bookingId.slice(0, 8).toUpperCase()} · {(phase as string).toUpperCase()}</Text>
        </View>

        <View style={s.titleSection}>
          <Text style={ss.heroTitle}>4 angles, please.</Text>
          <Text style={s.subtitle}>Front, rear, both sides — clearly framed and well-lit.</Text>
        </View>

        {/* Angle grid — tap any cell to capture */}
        <View style={s.angleGrid}>
          {ANGLES.map(angle => {
            const uri  = captured[angle];
            const busy = uploading === angle;
            return (
              <TouchableOpacity key={angle} style={s.angleCell} onPress={() => captureAngle(angle)} activeOpacity={0.8} disabled={busy}>
                {busy ? (
                  <View style={s.angleUploading}>
                    <Text style={s.angleEmptyLabel}>UPLOADING…</Text>
                  </View>
                ) : uri ? (
                  <View style={s.angleCaptured}>
                    <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    <View style={s.angleCheck}>
                      <Check size={11} color="#fff" strokeWidth={2.5} />
                    </View>
                    <Text style={s.angleLabel}>{angle.toUpperCase()}</Text>
                  </View>
                ) : (
                  <View style={s.angleEmpty}>
                    <Camera size={22} color={c.fg3} strokeWidth={1.5} />
                    <Text style={s.angleEmptyLabel}>{angle.toUpperCase()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <View style={s.notesSection}>
          <Text style={ss.eyebrow}>[CONDITION NOTES] · OPTIONAL</Text>
          <View style={s.notesBox}>
            <Text style={s.notesText}>Tap to add notes about vehicle condition…</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[
        ss.footerBar,
        {
          position: 'absolute', bottom: 0, left: 0, right: 0,
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: spacing[5], paddingTop: spacing[3],
          paddingBottom: spacing[3] + insets.bottom,
        },
      ]}>
        <Text style={s.footerCount}>{captureCount} OF {ANGLES.length} CAPTURED</Text>
        <TouchableOpacity
          style={s.captureBtn}
          onPress={() => {
            const nextAngle = ANGLES.find(a => !captured[a]);
            if (nextAngle) captureAngle(nextAngle);
          }}
          disabled={!!uploading || captureCount === ANGLES.length}
          activeOpacity={0.8}
        >
          <Camera size={22} color={c.ink} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
