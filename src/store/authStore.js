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
        set({ isLoading: true, error: null });
        try {
          console.log('🔐 Login attempt for:', email);
          
          // Call the authAPI login
          const result = await authAPI.login(email, password);
          
          console.log('📦 Login result:', {
            success: result.success,
            hasUser: !!result.user,
            hasToken: !!result.token,
          });
          
          // Check if login was successful
          if (!result.success) {
            throw new Error(result.message || 'Login failed');
          }

          const user = result.user;
          const token = result.token;
          
          // Check if user is active
          if (user && user.is_active !== undefined && user.is_active !== 1) {
            throw new Error('Your account is inactive. Please contact support.');
          }

          // Update state
          set({
            user: user,
            isAuthenticated: true,
            isLoading: false,
            token: token,
            error: null,
          });

          // Fetch permissions after successful login
          if (user && user.plan_id) {
            try {
              const permissionStore = usePermissionStore.getState();
              await permissionStore.fetchUserPermissions(user.id, user.plan_id);
              console.log('✅ Permissions fetched successfully');
            } catch (permError) {
              console.warn('⚠️ Failed to fetch permissions:', permError);
              // Continue even if permissions fail - user can still use the app
            }
          }

          console.log('✅ Login successful for:', user?.email || user?.username || 'user');
          return { success: true, user };
        } catch (error) {
          console.error('❌ Login error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            token: null,
            error: error.message || 'Login failed',
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
        await AsyncStorage.removeItem('auth_user');
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
      
      // Get the current token
      getToken: () => {
        return get().token;
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