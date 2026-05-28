import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
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

  return useMemo(() => StyleSheet.create({
    /** `flex: 1` screen root with themed background */
    screen: { flex: 1, backgroundColor: c.ink },

    /** Mono uppercase eyebrow / step label */
    eyebrow: {
      fontFamily: typography.mono,
      fontSize: 9.5,
      color: c.fg3,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },

    /** Same as eyebrow — used as field label above inputs */
    fieldLabel: {
      fontFamily: typography.mono,
      fontSize: 9.5,
      color: c.fg3,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },

    /** Onboarding step counter, e.g. "[STEP 01 OF 03]" */
    onboardingStep: {
      fontFamily: typography.mono,
      fontSize: 9.5,
      color: c.fg3,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
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

    /** Onboarding title — large serif with tight leading */
    onboardingTitle: {
      fontFamily: typography.serif,
      fontSize: (typography as any)['3xl'] ?? 36,
      color: c.fg,
      letterSpacing: -0.5,
      lineHeight: 44,
    },

    /** Subtitle / description copy under headings */
    subtitle: {
      fontFamily: typography.sans,
      fontSize: (typography as any).sm ?? 14,
      color: c.fg2,
    },

    /** Standard 52px text input */
    formInput: {
      height: 52,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.lineStrong,
      borderRadius: radii.sm,
      paddingHorizontal: spacing[4],
      fontFamily: typography.sans,
      fontSize: (typography as any).base ?? 16,
      color: c.fg,
    },

    /** fieldArea gap wrapper — label + input/picker */
    fieldArea: { gap: spacing[2] },

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
      alignItems: 'center',
      justifyContent: 'center',
    },

    /** Warm-fill pill primary CTA */
    primaryBtn: {
      backgroundColor: c.warm,
      borderRadius: radii.pill,
      paddingVertical: spacing[4],
      alignItems: 'center',
    },

    /** Disabled state for primaryBtn — just reduce opacity */
    primaryBtnOff: { opacity: 0.3 },

    /** Text inside primaryBtn */
    primaryBtnText: {
      fontFamily: typography.sansSemiBold,
      fontSize: (typography as any).base ?? 13,
      color: c.ink,
      letterSpacing: 0.6,
    },

    /** Outlined ghost / secondary button */
    ghostBtn: {
      borderRadius: radii.pill,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.lineStrong,
    },

    /** Text inside ghostBtn */
    ghostBtnText: {
      fontFamily: typography.sansMedium,
      fontSize: (typography as any).base ?? 13,
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
