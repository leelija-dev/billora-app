import { useThemeStore } from '../store/themeStore';
import { useColorScheme } from 'react-native';

export const useTheme = () => {
  const { isDarkMode, systemTheme, toggleDarkMode, setDarkMode, setSystemTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();

  const effectiveDarkMode = systemTheme ? systemColorScheme === 'dark' : isDarkMode;

  const theme = {
    isDark: effectiveDarkMode,
    colors: {
      background: effectiveDarkMode ? '#111827' : '#FFFFFF',
      surface: effectiveDarkMode ? '#1F2937' : '#F9FAFB',
      card: effectiveDarkMode ? '#1F2937' : '#FFFFFF',
      primary: '#667eea',
      secondary: '#764ba2',
      text: effectiveDarkMode ? '#FFFFFF' : '#1F2937',
      textSecondary: effectiveDarkMode ? '#9CA3AF' : '#4B5563',
      textTertiary: effectiveDarkMode ? '#6B7280' : '#9CA3AF',
      border: effectiveDarkMode ? '#374151' : '#E5E7EB',
      borderLight: effectiveDarkMode ? '#1F2937' : '#F3F4F6',
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
    toggleTheme: toggleDarkMode,
    setDarkMode,
    setSystemTheme,
    isSystemTheme: systemTheme,
  };

  return theme;
};