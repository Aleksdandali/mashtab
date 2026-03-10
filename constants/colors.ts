// ─── МАСШТАБ Design System v2 — Neon Lime + Cosmic Dark ──────────────────────

export const Colors = {
  // Backgrounds
  bg:       '#060810',
  surface1: '#0B0F18',
  surface2: '#111622',
  surface3: '#1A1F2E',

  // Accent — Neon Lime
  primary:      '#C8FF00',
  primaryMuted: 'rgba(200, 255, 0, 0.09)',
  primaryDim:   'rgba(200, 255, 0, 0.04)',

  // Text
  text:          '#F9FAFF',
  textSecondary: '#A3AEC4',
  textTertiary:  'rgba(163, 174, 196, 0.5)',
  textDisabled:  'rgba(163, 174, 196, 0.3)',

  // Borders
  border:        'rgba(163, 174, 196, 0.12)',
  borderActive:  'rgba(163, 174, 196, 0.2)',
  borderMedium:  'rgba(163, 174, 196, 0.2)',

  // Accent variants (legacy aliases)
  primaryLight: 'rgba(200, 255, 0, 0.09)',
  primaryDark:  '#A0CC00',

  // Semantic
  success: '#4AE68C',
  error:   '#FF4D4F',
  warning: '#E6B44A',

  // Tab bar
  tabInactive: 'rgba(163, 174, 196, 0.4)',
} as const;

export const DarkColors = Colors;
export const LightColors = Colors;

export type ColorTheme = typeof Colors;
