// hooks/usePermission.js
import { useAuthStore } from '../store/authStore';

export const usePermission = () => {
  const { permissions, sidebarPermissions, hasPermission, canAccessSidebar } = useAuthStore();

  // Check if user can access specific feature
  const can = (permissionName) => {
    return hasPermission(permissionName);
  };

  // Check if user can access sidebar menu
  const canAccess = (menuName) => {
    return canAccessSidebar(menuName);
  };

  // Check multiple permissions (AND condition)
  const canAll = (permissionNames) => {
    return permissionNames.every(p => hasPermission(p));
  };

  // Check any permission (OR condition)
  const canAny = (permissionNames) => {
    return permissionNames.some(p => hasPermission(p));
  };

  return {
    permissions,
    sidebarPermissions,
    can,
    canAccess,
    canAll,
    canAny,
  };
};