export const DarkColors = {
  // Backgrounds
  bg: '#0F0D0B',
  surface1: '#1A1714',
  surface2: '#1E1B17',
  surface3: '#252220',

  // Text
  text: '#F5E6D3',
  textSecondary: 'rgba(245, 230, 211, 0.60)',
  textTertiary: 'rgba(245, 230, 211, 0.38)',

  // Primary (gold)
  primary: '#D4A574',
  primaryDark: '#C49564',
  primaryLight: 'rgba(212, 165, 116, 0.15)',

  // Semantic
  success: '#7CB392',
  successDark: '#5A9E72',
  info: '#7BB8C9',
  infoDark: '#5089A0',
  warning: '#E8976B',
  warningDark: '#C47A4A',
  error: '#E07B6B',

  // Borders
  border: 'rgba(245, 230, 211, 0.08)',
  borderMedium: 'rgba(245, 230, 211, 0.15)',

  // Overlay
  overlay: 'rgba(15, 13, 11, 0.85)',

  // Tab bar
  tabActive: '#D4A574',
  tabInactive: 'rgba(245, 230, 211, 0.38)',
} as const;

export const LightColors = {
  // Backgrounds
  bg: '#FAF7F2',
  surface1: '#F3EFE8',
  surface2: '#FFFFFF',
  surface3: '#F8F5EF',

  // Text
  text: '#2C2520',
  textSecondary: 'rgba(44, 37, 32, 0.55)',
  textTertiary: 'rgba(44, 37, 32, 0.35)',

  // Primary (gold)
  primary: '#B8895E',
  primaryDark: '#A07848',
  primaryLight: 'rgba(184, 137, 94, 0.12)',

  // Semantic
  success: '#5A9E72',
  successDark: '#4A8A60',
  info: '#5089A0',
  infoDark: '#3D7088',
  warning: '#C47A4A',
  warningDark: '#A86038',
  error: '#C45A4A',

  // Borders
  border: 'rgba(44, 37, 32, 0.08)',
  borderMedium: 'rgba(44, 37, 32, 0.15)',

  // Overlay
  overlay: 'rgba(250, 247, 242, 0.85)',

  // Tab bar
  tabActive: '#B8895E',
  tabInactive: 'rgba(44, 37, 32, 0.35)',
} as const;

export type ColorTheme = typeof DarkColors | typeof LightColors;
