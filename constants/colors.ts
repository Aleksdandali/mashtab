// ─── МАСШТАБ Design System — Dark Only ───────────────────────────────────────

export const Colors = {
  // Backgrounds
  bg:       '#050608',
  surface1: '#0C0E12',
  surface2: '#121418',
  surface3: '#1A1C22',

  // Accent — Lime
  primary:      '#C8E64A',
  primaryMuted: 'rgba(200, 230, 74, 0.12)',
  primaryDim:   'rgba(200, 230, 74, 0.06)',

  // Text
  text:          '#F2F0EB',
  textSecondary: 'rgba(242, 240, 235, 0.55)',
  textTertiary:  'rgba(242, 240, 235, 0.30)',
  textDisabled:  'rgba(242, 240, 235, 0.15)',

  // Borders
  border:        'rgba(242, 240, 235, 0.06)',
  borderActive:  'rgba(242, 240, 235, 0.12)',
  borderMedium:  'rgba(242, 240, 235, 0.12)', // alias for borderActive

  // Accent variants (legacy aliases)
  primaryLight: 'rgba(200, 230, 74, 0.12)',   // alias for primaryMuted
  primaryDark:  '#A8C230',                     // slightly darker lime

  // Semantic
  success: '#4AE68C',
  error:   '#E64A5E',
  warning: '#E6B44A',

  // Tab bar
  tabInactive: 'rgba(242, 240, 235, 0.30)',
} as const;

// Keep legacy aliases so existing useTheme() calls keep working
export const DarkColors = Colors;
export const LightColors = Colors;

export type ColorTheme = typeof Colors;
