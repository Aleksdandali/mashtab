import { TextStyle } from 'react-native';

export const FontFamily = {
  serif: 'CormorantGaramond_600SemiBold',
  serifBold: 'CormorantGaramond_700Bold',
  serifItalic: 'CormorantGaramond_600SemiBold_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const Typography: Record<string, TextStyle> = {
  heading1: {
    fontFamily: FontFamily.serifBold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.3,
  },
  heading2: {
    fontFamily: FontFamily.serif,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  heading3: {
    fontFamily: FontFamily.serif,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  number: {
    fontFamily: FontFamily.serifBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  quote: {
    fontFamily: FontFamily.serifItalic,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  body: {
    fontFamily: FontFamily.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};
