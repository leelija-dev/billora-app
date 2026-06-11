// store/permissionStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usePermissionStore = create(
  persist(
    (set, get) => ({
      permissions: [],
      sidebarPermissions: [],
      
      setPermissions: (permissions) => {
        console.log('Setting permissions:', permissions);
        set({ permissions });
      },
      
      setSidebarPermissions: (sidebarPermissions) => {
        console.log('Setting sidebar permissions:', sidebarPermissions);
        set({ sidebarPermissions });
      },
      
      hasPermission: (permissionName) => {
        const { permissions } = get();
        return permissions.includes(permissionName);
      },
      
      hasAnyPermission: (permissionNames) => {
        const { permissions } = get();
        return permissionNames.some(p => permissions.includes(p));
      },
      
      hasAllPermissions: (permissionNames) => {
        const { permissions } = get();
        return permissionNames.every(p => permissions.includes(p));
      },
      
      canAccessSidebar: (menuName) => {
        const { sidebarPermissions } = get();
        // If no permissions loaded yet, allow basic access
        if (sidebarPermissions.length === 0) {
          const basicMenus = ['dashboard', 'products', 'stocks', 'bills', 'reports'];
          return basicMenus.includes(menuName);
        }
        return sidebarPermissions.includes(menuName);
      },
      
      clearPermissions: () => {
        console.log('Clearing permissions');
        set({ permissions: [], sidebarPermissions: [] });
      },
    }),
    {
      name: 'permission-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);