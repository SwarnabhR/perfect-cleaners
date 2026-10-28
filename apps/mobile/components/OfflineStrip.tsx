import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../theme';
import { useConnectivity } from '../lib/connectivity';

/**
 * Thin status line shown only when the device is offline or actions are waiting
 * to sync. Hidden entirely when online with an empty queue.
 */
export default function OfflineStrip() {
  const c = useThemeColors();
  const { isOnline, pending, syncing } = useConnectivity();

  if (isOnline && pending === 0 && !syncing) return null;

  const label = !isOnline
    ? `OFFLINE${pending > 0 ? ` · ${pending} QUEUED` : ''}`
    : syncing
      ? 'SYNCING…'
      : `${pending} QUEUED`;

  const dotColor = !isOnline ? c.warning : c.info;

  return (
    <View style={[s.strip, { backgroundColor: c.lineFaint, borderColor: c.line }]}>
      <View style={[s.dot, { backgroundColor: dotColor }]} />
      <Text style={[s.text, { color: c.fg2 }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  strip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing[5], marginBottom: spacing[2],
    paddingVertical: 8, paddingHorizontal: spacing[3],
    borderRadius: radii.sm, borderWidth: 1,
  },
  dot:  { width: 7, height: 7, borderRadius: 999 },
  text: { fontFamily: typography.mono, fontSize: 10, letterSpacing: 0.8 },
});
