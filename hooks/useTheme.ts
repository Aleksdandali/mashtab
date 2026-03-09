import { Colors, ColorTheme } from '@/constants/colors';

// Dark-only design system — always returns the single Colors object.
export function useTheme(): ColorTheme {
  return Colors;
}
