// store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePermissionStore } from './permissionStore';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      token: null,

      setHasHydrated: (state) => set({ hasHydrated: state }),

      clearLocalAuthState: () => {
        console.log('🧹 Clearing local auth state');
        // Clear permission store as well
        usePermissionStore.getState().clearPermissions();
        set({
          user: null,
          company: null,
          isAuthenticated: false,
          isLoading: false,
          token: null,
        });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          console.log('🔐 Login attempt for:', email);
          const response = await authAPI.login(email, password);
          
          if (!response.data || !response.data.status) {
            throw new Error(response.data?.message || 'Login failed');
          }

          const data = response.data;
          const user = data.user;
          
          if (user.is_active !== 1) {
            throw new Error('Your account is inactive. Please contact support.');
          }

          // Store token
          if (data.token) {
            await AsyncStorage.setItem('auth_token', data.token);
          }

          set({
            user: user,
            isAuthenticated: true,
            isLoading: false,
            token: data.token || null,
          });

          // Fetch permissions after successful login
          if (user.plan_id) {
            const permissionStore = usePermissionStore.getState();
            await permissionStore.fetchUserPermissions(user.id, user.plan_id);
          }

          console.log('✅ Login successful for:', user.email);
          return { success: true, user };
        } catch (error) {
          console.error('❌ Login error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            token: null,
          });
          return { 
            success: false, 
            error: error.message || 'Login failed' 
          };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        const { user } = get();
        
        try {
          if (user?.id) {
            await authAPI.logout(user.id);
          }
        } catch (err) {
          console.log('Logout API failed:', err);
        }
        
        await AsyncStorage.removeItem('auth_token');
        get().clearLocalAuthState();
        set({ isLoading: false });
        return { success: true };
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      // Check if user has active plan
      hasActivePlan: () => {
        const { user, isAuthenticated } = get();
        return isAuthenticated && user && user.plan_id && user.is_active === 1;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);