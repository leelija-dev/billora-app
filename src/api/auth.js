// api/auth.js - Complete updated file
import apiClient from "./client";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to get default permissions
function getDefaultPermissions() {
  return [
    { slug: 'dashboard', name: 'Dashboard', status: 1 },
    { slug: 'products', name: 'Products', status: 1 },
    { slug: 'categories', name: 'Categories', status: 1 },
    { slug: 'brands', name: 'Brands', status: 1 },
    { slug: 'units', name: 'Units', status: 1 },
    { slug: 'stores', name: 'Stores', status: 1 },
    { slug: 'seller', name: 'Sellers', status: 1 },
    { slug: 'stock', name: 'Stock', status: 1 },
    { slug: 'orders', name: 'Orders', status: 1 },
    { slug: 'customers', name: 'Customers', status: 1 },
    { slug: 'invoices', name: 'Invoices', status: 1 },
    { slug: 'reports', name: 'Reports', status: 1 },
    { slug: 'gst', name: 'GST', status: 1 },
    { slug: 'plans', name: 'Plans', status: 1 },
    { slug: 'settings', name: 'Settings', status: 1 },
  ];
}

export const authAPI = {
  login: async (email, password) => {
    try {
      console.log('🔐 Login attempt for:', email);
      
      const response = await apiClient.post("/users/login", {
        email,
        password,
      });
      
      console.log('✅ Login API Response:', {
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        hasData: !!response.data,
      });

      let responseData = response.data;
      
      if (!responseData) {
        throw new Error('No response data received');
      }

      let actualData = responseData;
      
      // Check for wrapped data structure
      if (responseData.data && typeof responseData.data === 'object' && 'status' in responseData.data) {
        console.log('📦 Found wrapped data structure');
        actualData = responseData.data;
      }
      
      // Check for direct structure
      if ('status' in responseData && 'token' in responseData) {
        console.log('📦 Found direct data structure');
        actualData = responseData;
      }

      if (actualData.status !== true) {
        throw new Error(actualData.message || 'Login failed');
      }

      const token = actualData.token;
      const user = actualData.user;
      
      if (!token) {
        console.error('❌ No token found in response:', Object.keys(actualData));
        throw new Error('No authentication token received');
      }

      console.log('✅ Login successful, token received');
      
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      
      return {
        success: true,
        user: user,
        token: token,
        data: actualData,
        status: true,
      };
    } catch (error) {
      console.error('❌ Login API error:', {
        message: error.message,
        status: error.status,
        responseData: error.response?.data,
      });
      
      throw {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
        status: error.response?.status || 500,
        data: error.response?.data || null,
      };
    }
  },

  logout: async (userId) => {
    try {
      const response = await apiClient.post("/users/logout", { user_id: userId });
      
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      
      return response;
    } catch (error) {
      console.error('❌ Logout error:', error);
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      throw error.response?.data || error.message;
    }
  },

  getProfile: async (userId) => {
    try {
      const response = await apiClient.get(`/users/edit/${userId}`);
      return response;
    } catch (error) {
      console.error('❌ Get profile error:', error);
      throw error.response?.data || error.message;
    }
  },

  getUserPermissions: async (userId, planId) => {
    try {
      console.log(`🔐 Fetching permissions for plan ${planId}`);
      const response = await apiClient.get(`/plans/${planId}`);
      
      console.log('📦 Plan response keys:', Object.keys(response.data || {}));
      
      let data = response.data;
      
      // Handle different response structures
      if (data && data.data && typeof data.data === 'object') {
        data = data.data;
      }
      
      // If the response has the custom wrapper with status
      if (data && data.status !== undefined) {
        if (data.status === true) {
          const planData = data.data || data;
          
          // Try to get permissions from various possible locations
          let permissions = [];
          let sidebarPermissions = [];
          
          // Check for permissionNames
          if (planData.permissionNames) {
            permissions = planData.permissionNames;
          } else if (planData.permissions) {
            permissions = planData.permissions;
          }
          
          // Check for sidebar permissions
          if (planData.customer_sidebar_permission) {
            sidebarPermissions = planData.customer_sidebar_permission;
          } else if (planData.sidebar_permissions) {
            sidebarPermissions = planData.sidebar_permissions;
          }
          
          // If we have permissions but no sidebar, convert permissions to sidebar format
          if (sidebarPermissions.length === 0 && permissions.length > 0) {
            sidebarPermissions = permissions.map(name => ({
              slug: name,
              name: name.charAt(0).toUpperCase() + name.slice(1),
              status: 1,
            }));
          }
          
          // If still no permissions, use defaults
          if (permissions.length === 0) {
            const defaults = getDefaultPermissions();
            permissions = defaults.map(p => p.slug);
            sidebarPermissions = defaults;
          }
          
          console.log('📋 Extracted permissions:', {
            permissionCount: permissions.length,
            sidebarCount: sidebarPermissions.length,
          });
          
          return {
            data: {
              status: true,
              permissionNames: permissions,
              customer_sidebar_permission: sidebarPermissions,
              plan: planData,
            },
          };
        } else {
          throw new Error(data.message || 'Failed to fetch permissions');
        }
      }
      
      // If response is a direct plan object
      if (data && typeof data === 'object') {
        const permissions = data.permissionNames || data.permissions || [];
        let sidebarPermissions = data.customer_sidebar_permission || data.sidebar_permissions || [];
        
        if (sidebarPermissions.length === 0 && permissions.length > 0) {
          sidebarPermissions = permissions.map(name => ({
            slug: name,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            status: 1,
          }));
        }
        
        if (permissions.length === 0) {
          const defaults = getDefaultPermissions();
          return {
            data: {
              status: true,
              permissionNames: defaults.map(p => p.slug),
              customer_sidebar_permission: defaults,
              plan: data,
            },
          };
        }
        
        return {
          data: {
            status: true,
            permissionNames: permissions,
            customer_sidebar_permission: sidebarPermissions,
            plan: data,
          },
        };
      }
      
      // Fallback: return default permissions
      console.warn('⚠️ Unexpected plan response, using defaults');
      const defaults = getDefaultPermissions();
      
      return {
        data: {
          status: true,
          permissionNames: defaults.map(p => p.slug),
          customer_sidebar_permission: defaults,
          plan: null,
        },
      };
    } catch (error) {
      console.error("❌ Failed to fetch permissions:", error);
      const defaults = getDefaultPermissions();
      return {
        data: {
          status: true,
          permissionNames: defaults.map(p => p.slug),
          customer_sidebar_permission: defaults,
          plan: null,
        },
      };
    }
  },
  
  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return { success: false, user: null };
      }
      
      const userStr = await AsyncStorage.getItem('auth_user');
      let user = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.warn('Failed to parse user data:', e);
        }
      }
      
      return { success: true, user: user, token: token };
    } catch (error) {
      console.error('❌ Check auth error:', error);
      return { success: false, user: null };
    }
  },
};