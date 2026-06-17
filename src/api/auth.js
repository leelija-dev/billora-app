// api/auth.js
import apiClient from "./client";

export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post("/users/login", {
        email,
        password,
      });
      // console.log("response checking login", response);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: async (userId) => {
    try {
      return await apiClient.post("/users/logout", { user_id: userId });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getProfile: async (userId) => {
    try {
      return await apiClient.get(`/users/edit/${userId}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user permissions from plan (matches desktop API)
  getUserPermissions: async (userId, planId) => {
    try {
      const response = await apiClient.get(`/plans/${planId}`);
      return response;
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      return {
        data: {
          status: true,
          permissionNames: [],
          customer_sidebar_permission: [],
        },
      };
    }
  },
};
