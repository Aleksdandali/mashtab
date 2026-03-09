import { useColorScheme } from 'react-native';
import { DarkColors, LightColors, ColorTheme } from '@/constants/colors';

export function useTheme(): ColorTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : LightColors;
}
