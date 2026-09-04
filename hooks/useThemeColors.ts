import { lightColors, darkColors, ThemeColors } from '@/constants/appTheme';
import { useThemePreference } from '@/context/ThemeContext';

/**
 * Returns the right color palette for the app's current theme. Reads from
 * ThemeContext (not the device directly) so the Appearance setting —
 * light / dark / follow device — actually takes effect everywhere.
 * Used by main-app screens only; auth screens use AuthColors directly.
 */
export function useThemeColors(): ThemeColors {
  const { scheme } = useThemePreference();
  return scheme === 'dark' ? darkColors : lightColors;
}