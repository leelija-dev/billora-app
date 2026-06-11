// store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      token: null,
      permissions: [],
      sidebarPermissions: [],

      setHasHydrated: (state) => set({ hasHydrated: state }),

      clearLocalAuthState: () => {
        console.log('🧹 Clearing local auth state');
        set({
          user: null,
          company: null,
          isAuthenticated: false,
          isLoading: false,
          token: null,
          permissions: [],
          sidebarPermissions: [],
        });
      },

      fetchUserPermissions: async (userId, planId) => {
        console.log('📋 Fetching user permissions for user:', userId, 'plan:', planId);
        try {
          const response = await authAPI.getUserPermissions(userId, planId);
          const data = response.data;
          
          if (data.status) {
            const permissions = data.permissionNames || [];
            const sidebarPermissions = data.customer_sidebar_permission || [];
            console.log('✅ Permissions fetched:', { permissions, sidebarPermissions });
            
            // Store permissions in state
            set({ 
              permissions: permissions,
              sidebarPermissions: sidebarPermissions 
            });
            
            return { permissions, sidebarPermissions };
          }
          return { permissions: [], sidebarPermissions: [] };
        } catch (error) {
          console.error('Failed to fetch permissions:', error);
          return { permissions: [], sidebarPermissions: [] };
        }
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          console.log('🔐 Login attempt for:', email);
          const response = await authAPI.login(email, password);
          
          console.log('📦 Login response:', response.data);
          
          if (!response.data || !response.data.status) {
            throw new Error(response.data?.message || 'Login failed');
          }

          const data = response.data;
          const user = data.user;
          
          // Check if user has active plan
          if (user.is_active !== 1) {
            throw new Error('Your account is inactive. Please contact support.');
          }

          // Store token
          const token = data.token;
          if (token) {
            await AsyncStorage.setItem('auth_token', token);
          }

          // Set auth state
          set({
            user: user,
            isAuthenticated: true,
            isLoading: false,
            token: token || null,
          });

          console.log('✅ Login successful for:', user.email);
          
          // Fetch permissions after successful login
          if (user.plan_id) {
            await get().fetchUserPermissions(user.id, user.plan_id);
          }
          
          return { success: true, user };
        } catch (error) {
          console.error('❌ Login error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            token: null,
            permissions: [],
            sidebarPermissions: [],
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

      hasActivePlan: () => {
        const { user, isAuthenticated } = get();
        return isAuthenticated && user && user.plan_id && user.is_active === 1;
      },
      
      // Permission helper methods
      hasPermission: (permissionName) => {
        const { permissions } = get();
        return permissions.includes(permissionName);
      },
      
      canAccessSidebar: (menuName) => {
  const { sidebarPermissions } = get();
  console.log('🔍 Checking access for:', menuName, 'Permissions:', sidebarPermissions);
  
  // If no permissions loaded yet, allow access
  if (!sidebarPermissions || sidebarPermissions.length === 0) {
    console.log('⚠️ No permissions loaded, allowing access to:', menuName);
    return true;
  }
  
  const hasAccess = sidebarPermissions.includes(menuName);
  console.log(`📋 ${menuName}: ${hasAccess ? '✅ Access granted' : '❌ Access denied'}`);
  return hasAccess;
},
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        token: state.token,
        permissions: state.permissions,
        sidebarPermissions: state.sidebarPermissions,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);