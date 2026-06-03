import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'repetia_theme_v3';

// ══════════════════════════════════════════
// 🌿 THÈME SOFT — Inspiré du design référence
// ══════════════════════════════════════════
export const themes = {

  // Thème principal : Soft Neumorphic Light
  sombre: {
    dark: false,
    colors: {
      // Fonds
      background:      '#ECEEF3',
      surface:         '#FFFFFF',
      card:            '#F5F6FA',

      // Couleur principale : Vert sauge doux
      primary:         '#7BA89A',
      primaryDark:     '#5A8A7A',
      primaryLight:    '#A8C5BB',

      // Secondaire : Sauge profond
      secondary:       '#5A8A7A',
      secondaryDark:   '#4A7A6A',

      // Accent : Navy
      accent:          '#2B3A4A',

      // Textes
      text:            '#2B3A4A',
      textSecondary:   '#4A5E70',
      textMuted:       '#8A9AAA',

      // Bordures
      border:          '#DDE1E8',
      borderLight:     '#E8ECF2',

      // États
      error:           '#E55C5C',
      success:         '#6BAE98',
      warning:         '#D4924A',
      info:            '#5A8AAA',

      // Neumorphic shadows (utilisé dans les composants)
      shadowDark:      '#C8CCD6',
      shadowLight:     '#FFFFFF',
    },
  },

  // Thème alternatif : légèrement plus contrasté
  clair: {
    dark: false,
    colors: {
      background:      '#F0F2F7',
      surface:         '#FFFFFF',
      card:            '#FAFBFD',
      primary:         '#6B9E90',
      primaryDark:     '#4A7A6A',
      primaryLight:    '#96C0B5',
      secondary:       '#4A7A6A',
      secondaryDark:   '#3A6A5A',
      accent:          '#2B3A4A',
      text:            '#1E2D3D',
      textSecondary:   '#3A5060',
      textMuted:       '#7A8A9A',
      border:          '#D4D8E2',
      borderLight:     '#E2E6EE',
      error:           '#D44444',
      success:         '#5A9E88',
      warning:         '#C47A3A',
      info:            '#4A7A9A',
      shadowDark:      '#BAC0CC',
      shadowLight:     '#FFFFFF',
    },
  },
};

type ThemeType = 'clair' | 'sombre';
export type Colors = typeof themes.sombre.colors;

interface ThemeContextType {
  theme:       ThemeType;
  colors:      Colors;
  setTheme:    (t: ThemeType) => void;
  toggleTheme: () => void;
  isDark:      boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('sombre');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(v => {
      if (v === 'clair' || v === 'sombre') setThemeState(v);
    });
  }, []);

  const setTheme = (t: ThemeType) => {
    setThemeState(t);
    AsyncStorage.setItem(THEME_KEY, t);
  };

  const toggleTheme = () => setTheme(theme === 'clair' ? 'sombre' : 'clair');

  return (
    <ThemeContext.Provider value={{
      theme,
      colors: themes[theme].colors,
      setTheme,
      toggleTheme,
      isDark: false,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
