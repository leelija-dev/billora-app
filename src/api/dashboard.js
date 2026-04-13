import apiClient from './client';


export const dashboardAPI = {
  getOverview: async (userId) => {
    try {
      const response = await apiClient.get(`/dashboard/overview/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRevenueStats: async (params = {}) => {
    try {
      const response = await apiClient.get('/dashboard/revenue', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSalesStats: async (params = {}) => {
    try {
      const response = await apiClient.get('/dashboard/sales', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getTopProducts: async (params = {}) => {
    try {
      const response = await apiClient.get('/dashboard/top-products', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getTopCustomers: async (params = {}) => {
    try {
      const response = await apiClient.get('/dashboard/top-customers', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRecentOrders: async (params = {}) => {
    try {
      const response = await apiClient.get('/dashboard/recent-orders', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getInventoryAlerts: async () => {
    try {
      const response = await apiClient.get('/dashboard/inventory-alerts');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getOrderStats: async (params = {}) => {
    try {
      const response = await apiClient.get('/dashboard/order-stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getCustomerGrowth: async (params = {}) => {
    try {
      const response = await apiClient.get('/dashboard/customer-growth', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
