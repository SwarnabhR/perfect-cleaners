// Design tokens derived from design-system/colors_and_type.css
// Use these in React Native (StyleSheet) and Next.js (CSS-in-JS / inline styles).

export const colors = {
  // Surfaces
  ink:        '#0E0D0B',
  inkRaised:  '#141412',
  card:       '#1C1B19',
  cardHi:     '#232220',

  // Borders
  line:       'rgba(255,255,255,0.08)',
  lineStrong: 'rgba(255,255,255,0.14)',
  lineFaint:  'rgba(255,255,255,0.04)',

  // Foreground
  fg:  '#FFFFFF',
  fg2: '#AAAAAA',
  fg3: '#666660',
  fg4: '#3A3A36',

  // Brand accents
  sage:    '#4A5E44',
  sageHi:  '#5B6F52',
  sageLo:  '#3A4D36',
  sageInk: '#E8EDE3',
  warm:    '#F0EDE8',
  warm2:   '#E4DFD6',
  gold:    '#C9A961',

  // Semantic
  success: '#6FAE6A',
  warning: '#D9A441',
  danger:  '#C9554E',
  info:    '#6A8EAE',

  // Booking pipeline status
  statusAssigned:   '#6A8EAE',
  statusEnroute:    '#D9A441',
  statusInProgress: '#5B6F52',
  statusDone:       '#6FAE6A',
} as const;

export const spacing = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,  // default screen padding
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const radii = {
  xs:   4,
  sm:   8,
  md:   14,  // standard card
  lg:   20,  // featured/hero card
  xl:   28,
  pill: 999,
} as const;

export const typography = {
  serif: 'Instrument Serif',  // swap for PP Editorial New in production
  sans:  'Inter Tight',       // swap for Satoshi/General Sans in production
  mono:  'JetBrains Mono',

  // Named weight variants — required on Android; iOS also benefits from explicit names.
  // Match the keys registered in useFonts() in apps/mobile/app/_layout.tsx.
  sansMedium:   'Inter Tight Medium',
  sansSemiBold: 'Inter Tight SemiBold',
  sansBold:     'Inter Tight Bold',
  monoMedium:   'JetBrains Mono Medium',

  // Size scale (px / dp)
  xs:   11,
  sm:   13,
  base: 15,
  lg:   18,
  xl:   22,
  '2xl': 28,
  '3xl': 38,
  hero:  52,
  mega:  88,

  // Weights
  light:   300,
  regular: 400,
  medium:  500,
  semi:    600,
  bold:    700,

  // Letter spacing (em)
  trackTight:  -0.02,
  trackSnug:   -0.01,
  trackNormal:  0,
  trackWide:    0.06,
  trackMono:    0.08,

  // Line height
  lhTight: 1.05,
  lhSnug:  1.15,
  lhBody:  1.45,
  lhLoose: 1.6,
} as const;

export const motion = {
  ease:   'cubic-bezier(0.22, 1, 0.36, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  fast:   140,  // ms
  base:   240,
  slow:   480,
} as const;

export const layout = {
  screenPad:    20,
  screenPadLg:  32,
  tapMin:       44,   // minimum tap target (pt)
  maxwContent:  1280,
  topBar:       60,   // mobile top bar height (pt)
  bottomTab:    84,   // mobile bottom tab bar height including safe area (pt)
} as const;
