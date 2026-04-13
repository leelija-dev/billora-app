import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { isDarkMode, systemTheme, setDarkMode } = useThemeStore();
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    if (systemTheme) {
      setDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, systemTheme]);

  const theme = {
    isDark: isDarkMode,
    colors: {
      background: isDarkMode ? '#111827' : '#FFFFFF',
      surface: isDarkMode ? '#1F2937' : '#F9FAFB',
      card: isDarkMode ? '#1F2937' : '#FFFFFF',
      primary: '#667eea',
      secondary: '#764ba2',
      text: isDarkMode ? '#FFFFFF' : '#1F2937',
      textSecondary: isDarkMode ? '#9CA3AF' : '#4B5563',
      textTertiary: isDarkMode ? '#6B7280' : '#9CA3AF',
      border: isDarkMode ? '#374151' : '#E5E7EB',
      borderLight: isDarkMode ? '#1F2937' : '#F3F4F6',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    typography: {
      h1: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
      },
      h2: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
      },
      h3: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
      },
      body1: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
      },
      body2: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
      },
      caption: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
      },
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};