import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react-native';
import { typography, spacing, radii, layout } from '@pc/tokens';
import { useThemeColors } from '../theme';
import PCMonogram from './PCMonogram';

interface Props {
  /** Show the location pill next to the monogram. Defaults to false. */
  showLocation?: boolean;
  /** Optional right-side slot (e.g. a bell button or settings button). */
  right?: ReactNode;
  /** Extra top padding added on top of insets.top + 12. Defaults to 0. */
  extraTop?: number;
}

/**
 * Shared top-bar for all four customer tab screens.
 * Renders: [monogram (+ optional location pill)] ... [optional right slot]
 */
export default function TabTopBar({ showLocation = false, right, extraTop = 0 }: Props) {
  const c = useThemeColors();

  return (
    <View style={[styles.bar, { paddingTop: 12 + extraTop }]}>
      <View style={styles.left}>
        <View style={[styles.monogram, { backgroundColor: c.sage }]}>
          <PCMonogram size={18} color={c.warm} />
        </View>
        {showLocation && (
          <TouchableOpacity style={[styles.locationPill, { backgroundColor: c.card, borderColor: c.line }]}>
            <MapPin size={12} color={c.fg3} strokeWidth={1.5} />
            <Text style={[styles.locationText, { color: c.fg3 }]}>Ghaziabad, NCR</Text>
          </TouchableOpacity>
        )}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monogram: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  locationText: {
    fontFamily: typography.sans,
    fontSize: 11,
  },
});
