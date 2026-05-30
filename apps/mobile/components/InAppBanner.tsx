import { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from '../theme';

interface Props {
  title:     string;
  body:      string;
  onDismiss: () => void;
}

const SLIDE_OUT_MS  = 250;
const AUTO_DISMISS_MS = 4000;

export default function InAppBanner({ title, body, onDismiss }: Props) {
  const insets     = useSafeAreaInsets();
  const c          = useThemeColors();
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    // Slide in from above
    Animated.spring(translateY, {
      toValue:         0,
      useNativeDriver: true,
      tension:         80,
      friction:        10,
    }).start();

    // Auto-dismiss
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    Animated.timing(translateY, {
      toValue:         -120,
      duration:        SLIDE_OUT_MS,
      useNativeDriver: true,
    }).start(() => onDismiss());
  }

  return (
    <Animated.View
      style={[
        s.container,
        {
          top:             insets.top + 8,
          backgroundColor: c.card,
          borderColor:     c.lineStrong,
          transform:       [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity onPress={dismiss} activeOpacity={0.9} style={s.inner}>
        <View style={[s.iconWrap, { backgroundColor: c.sage }]}>
          <Bell size={14} color="#fff" strokeWidth={1.5} />
        </View>
        <View style={s.textBlock}>
          <Text style={[s.title, { color: c.fg }]}  numberOfLines={1}>{title}</Text>
          <Text style={[s.body,  { color: c.fg2 }]} numberOfLines={2}>{body}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position:      'absolute',
    left:          12,
    right:         12,
    zIndex:        9999,
    borderRadius:  radii.md,
    borderWidth:   1,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius:  12,
    elevation:     8,
  },
  inner: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    padding:       spacing[4],
  },
  iconWrap: {
    width:           36,
    height:          36,
    borderRadius:    radii.sm,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  textBlock: { flex: 1, gap: 2 },
  title: { fontFamily: typography.sansSemiBold, fontSize: 14, letterSpacing: -0.1 },
  body:  { fontFamily: typography.sans,         fontSize: 12, lineHeight: 17 },
});
