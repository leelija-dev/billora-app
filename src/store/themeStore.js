import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      isDarkMode: false,
      systemTheme: false,
      
      toggleDarkMode: () => set((state) => ({ 
        isDarkMode: !state.isDarkMode,
        systemTheme: false 
      })),
      
      setDarkMode: (value) => set({ 
        isDarkMode: value,
        systemTheme: false 
      }),
      
      setSystemTheme: (enabled) => set({ systemTheme: enabled }),
      
      resetTheme: () => set({ 
        isDarkMode: false, 
        systemTheme: false 
      }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);