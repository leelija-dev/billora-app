// src/api/billing.js
import apiClient from "./client";

export const billingAPI = {
  // Get all plans
  getAllPlans: async () => {
    try {
      const response = await apiClient.get("/plans");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      throw error;
    }
  },

  // Get single plan by ID
  getPlanById: async (planId) => {
    try {
      const response = await apiClient.get(`/plans/${planId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch plan details:", error);
      throw error;
    }
  },

  // Get user plan purchase history with pagination
  getPlanPurchaseHistory: async (userId, page = 1, perPage = 10, search = "") => {
    try {
      const params = { page };
      if (search) params.search = search;
      const response = await apiClient.get(`/plans-purchase-history/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch plan purchase history:", error);
      throw error;
    }
  },

  // Get recent plan data
  getRecentPlan: async (userId) => {
    try {
      const response = await apiClient.get(`/recent-plan/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch recent plan:", error);
      throw error;
    }
  },

  // Renew plan using Cashfree
  renewPlan: async (renewData) => {
    try {
      const response = await apiClient.post("/cashfree/renew-plan", renewData);
      return response.data;
    } catch (error) {
      console.error("Failed to renew plan:", error);
      throw error;
    }
  },

  // Create Cashfree order for plan purchase
  createCashfreeOrder: async (orderData) => {
    try {
      const response = await apiClient.post("/cashfree/create-order", orderData);
      return response.data;
    } catch (error) {
      console.error("Failed to create Cashfree order:", error);
      throw error;
    }
  },

  // Upgrade plan using Cashfree
  upgradePlan: async (upgradeData) => {
    try {
      const response = await apiClient.post("/cashfree/upgrade-plan", upgradeData);
      return response.data;
    } catch (error) {
      console.error("Failed to upgrade plan:", error);
      throw error;
    }
  },

  // Get business types
  getBusinessTypes: async () => {
    try {
      const response = await apiClient.get("/business-type");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch business types:", error);
      throw error;
    }
  },
};

export default billingAPI;
