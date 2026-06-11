// api/auth.js
import apiClient from "./client";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authAPI = {
  // Login user
  login: async (email, password) => {
    try {
      console.log('🔐 Login attempt for:', email);
      const response = await apiClient.post("/users/login", {
        email,
        password,
      });
      console.log('✅ Login response:', response.data);
      
      // Store token if present
      if (response.data?.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  // Logout user
  logout: async (userId) => {
    try {
      const response = await apiClient.post("/users/logout", { user_id: userId });
      await AsyncStorage.removeItem('auth_token');
      return response;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user profile
  getProfile: async (userId) => {
    try {
      const response = await apiClient.get(`/users/edit/${userId}`);
      return response;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Get user permissions
  getUserPermissions: async (userId, planId) => {
    try {
      console.log('📋 Fetching permissions for plan:', planId);
      const response = await apiClient.get(`/plans/${planId}`);
      console.log('✅ Permissions response:', response.data);
      return response;
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      // Return default permissions to prevent app from breaking
      return {
        data: {
          status: true,
          permissionNames: [],
          customer_sidebar_permission: ['dashboard', 'products', 'stocks', 'bills', 'reports', 'brands', 'categories'],
        },
      };
    }
  },
};