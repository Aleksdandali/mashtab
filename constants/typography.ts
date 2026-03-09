import { TextStyle } from 'react-native';

// ─── Font families ────────────────────────────────────────────────────────────
// Display (H1–H3, numbers, quotes): Cormorant Garamond serif
// UI (everything else): Inter

export const FontFamily = {
  // Serif — display only
  serif:       'CormorantGaramond_600SemiBold',
  serifBold:   'CormorantGaramond_700Bold',
  serifItalic: 'CormorantGaramond_600SemiBold_Italic',

  // Inter — all UI
  sans:        'Inter_400Regular',
  sansMedium:  'Inter_500Medium',
  sansSemiBold:'Inter_600SemiBold',
  sansBold:    'Inter_700Bold',
} as const;

// ─── Scale tokens ─────────────────────────────────────────────────────────────

export const Typography = {
  // Display — Cormorant Garamond
  h1: {
    fontFamily: FontFamily.serifBold,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '600',
  } as TextStyle,

  h2: {
    fontFamily: FontFamily.serif,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
  } as TextStyle,

  h3: {
    fontFamily: FontFamily.serif,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  } as TextStyle,

  // UI — Inter
  body: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  } as TextStyle,

  bodyMedium: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  } as TextStyle,

  bodySemiBold: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  } as TextStyle,

  caption: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  } as TextStyle,

  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  } as TextStyle,

  button: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  } as TextStyle,

  // Legacy aliases — kept for backwards compat
  heading1: {
    fontFamily: FontFamily.serifBold,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '600',
  } as TextStyle,

  heading2: {
    fontFamily: FontFamily.serif,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
  } as TextStyle,

  heading3: {
    fontFamily: FontFamily.serif,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  } as TextStyle,
} as const;
