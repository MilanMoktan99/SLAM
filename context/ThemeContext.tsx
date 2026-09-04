import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'slam_theme_preference';

type ThemeContextType = {
  preference: ThemePreference;
  /** The scheme actually in effect right now — resolves 'system' against the device setting. */
  scheme: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useThemePreference() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useThemePreference must be used inside <ThemeProvider>');
  return value;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const deviceScheme = useDeviceColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const scheme: 'light' | 'dark' =
    preference === 'system' ? (deviceScheme === 'dark' ? 'dark' : 'light') : preference;

  return (
    <ThemeContext.Provider value={{ preference, scheme, setPreference }}>{children}</ThemeContext.Provider>
  );
}