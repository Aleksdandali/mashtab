import { TextStyle } from 'react-native';

// ─── Font families — Inter only ──────────────────────────────────────────────

export const FontFamily = {
  sans:         'Inter_400Regular',
  sansMedium:   'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold:     'Inter_700Bold',
  sansExtraBold:'Inter_800ExtraBold',

  // Legacy aliases — all point to Inter now
  serif:       'Inter_700Bold',
  serifBold:   'Inter_800ExtraBold',
  serifItalic: 'Inter_500Medium',
} as const;

// ─── Scale tokens ─────────────────────────────────────────────────────────────

export const Typography = {
  h1: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
  } as TextStyle,

  h2: {
    fontFamily: FontFamily.sansBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
  } as TextStyle,

  h3: {
    fontFamily: FontFamily.sansBold,
    fontSize: 20,
    lineHeight: 26,
  } as TextStyle,

  body: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,

  bodyMedium: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,

  bodySemiBold: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,

  caption: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  } as TextStyle,

  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.88,
  } as TextStyle,

  button: {
    fontFamily: FontFamily.sansBold,
    fontSize: 16,
    lineHeight: 20,
  } as TextStyle,

  // Legacy aliases
  heading1: {
    fontFamily: FontFamily.sansExtraBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
  } as TextStyle,

  heading2: {
    fontFamily: FontFamily.sansBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
  } as TextStyle,

  heading3: {
    fontFamily: FontFamily.sansBold,
    fontSize: 20,
    lineHeight: 26,
  } as TextStyle,
} as const;
