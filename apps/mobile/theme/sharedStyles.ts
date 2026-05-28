import { useMemo } from 'react';
import { typography, spacing, radii } from '@pc/tokens';
import { useThemeColors } from './index';

/**
 * Returns commonly-repeated style fragments keyed by semantic name.
 * Memoised on the colors reference — only recomputes on theme toggle.
 *
 * Usage: `const ss = useSharedStyles();`  then `style={ss.backBtn}`.
 */
export function useSharedStyles() {
  const c = useThemeColors();

  return useMemo(() => ({
    /** `flex: 1` screen root with themed background */
    screen: { flex: 1, backgroundColor: c.ink },

    /** Mono uppercase eyebrow label */
    eyebrow: {
      fontFamily: typography.mono,
      fontSize: 9.5,
      color: c.fg3,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },

    /** 32px serif page heading (used below ScreenHeader) */
    pageTitle: {
      fontFamily: typography.serif,
      fontSize: 32,
      color: c.fg,
      letterSpacing: -0.3,
    },

    /** 36px serif hero / emotional heading */
    heroTitle: {
      fontFamily: typography.serif,
      fontSize: 36,
      color: c.fg,
      letterSpacing: -0.4,
      lineHeight: 40,
    },

    /** Horizontal screen padding + bottom gap, used under ScreenHeader */
    titleSection: {
      paddingHorizontal: spacing[5],
      paddingBottom: spacing[2],
    },

    /** 36×36 pill-shaped back/close icon button */
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: radii.pill,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },

    /** Warm-fill pill primary CTA */
    primaryBtn: {
      backgroundColor: c.warm,
      borderRadius: radii.pill,
      paddingVertical: 14,
      alignItems: 'center' as const,
    },

    /** Text inside primaryBtn */
    primaryBtnText: {
      fontFamily: typography.sansSemiBold,
      fontSize: 13,
      color: c.ink,
      letterSpacing: 0.6,
    },

    /** Outlined ghost / secondary button */
    ghostBtn: {
      borderRadius: radii.pill,
      paddingVertical: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: c.lineStrong,
    },

    /** Text inside ghostBtn */
    ghostBtnText: {
      fontFamily: typography.sansMedium,
      fontSize: 13,
      color: c.fg,
      letterSpacing: 0.6,
    },

    /** Background + top-border for sticky footer / bottom overlay bars */
    footerBar: {
      backgroundColor: c.inkOverlay,
      borderTopWidth: 1,
      borderTopColor: c.line,
    },
  }), [c]);
}
