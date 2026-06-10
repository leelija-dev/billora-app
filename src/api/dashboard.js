// api/dashboard.js
import apiClient from './client';

export const dashboardAPI = {
  // Get dashboard overview by user ID with time range filter
  getOverview: async (userId, timeRange = '7d') => {
    try {
      let daysToFetch = 7; // default
      
      // Convert timeRange to number of days
      switch(timeRange) {
        case '7d':
          daysToFetch = 7;
          break;
        case '30d':
          daysToFetch = 30;
          break;
        case '90d':
          daysToFetch = 90;
          break;
        case '12m':
          daysToFetch = 365; // 12 months
          break;
        default:
          daysToFetch = 7;
      }
      
      console.log(`📊 Fetching dashboard overview for user: ${userId} with range: ${daysToFetch} days`);
      const response = await apiClient.get(`/dashboard/overview/${userId}`, {
        params: { search: daysToFetch }
      });
      console.log("📊 Dashboard overview fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch dashboard overview for user ${userId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Get revenue statistics with optional date filtering
  getRevenueStats: async (params = {}) => {
    try {
      console.log("📊 Fetching revenue stats with params:", params);
      const response = await apiClient.get('/dashboard/revenue', { params });
      console.log("✅ Revenue stats fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch revenue stats:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get sales statistics with optional date filtering
  getSalesStats: async (params = {}) => {
    try {
      console.log("📊 Fetching sales stats with params:", params);
      const response = await apiClient.get('/dashboard/sales', { params });
      console.log("✅ Sales stats fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch sales stats:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get top products with optional date filtering
  getTopProducts: async (params = {}) => {
    try {
      console.log("📊 Fetching top products with params:", params);
      const response = await apiClient.get('/dashboard/top-products', { params });
      console.log("✅ Top products fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch top products:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get top customers with optional date filtering
  getTopCustomers: async (params = {}) => {
    try {
      console.log("👥 Fetching top customers with params:", params);
      const response = await apiClient.get('/dashboard/top-customers', { params });
      console.log("✅ Top customers fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch top customers:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get recent orders with optional date filtering
  getRecentOrders: async (params = {}) => {
    try {
      console.log("📦 Fetching recent orders with params:", params);
      const response = await apiClient.get('/dashboard/recent-orders', { params });
      console.log("✅ Recent orders fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch recent orders:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get inventory alerts (low stock items)
  getInventoryAlerts: async () => {
    try {
      console.log("⚠️ Fetching inventory alerts");
      const response = await apiClient.get('/dashboard/inventory-alerts');
      console.log("✅ Inventory alerts fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch inventory alerts:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get order statistics (completed, pending, cancelled)
  getOrderStats: async (params = {}) => {
    try {
      console.log("📊 Fetching order stats with params:", params);
      const response = await apiClient.get('/dashboard/order-stats', { params });
      console.log("✅ Order stats fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch order stats:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get customer growth over time
  getCustomerGrowth: async (params = {}) => {
    try {
      console.log("📈 Fetching customer growth with params:", params);
      const response = await apiClient.get('/dashboard/customer-growth', { params });
      console.log("✅ Customer growth fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch customer growth:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get complete dashboard data in one call (for performance)
  getDashboardData: async (userId, timeRange = '7d') => {
    try {
      console.log(`📊 Fetching complete dashboard data for user: ${userId} with range: ${timeRange}`);
      
      // Convert timeRange to number of days
      let daysToFetch = 7;
      switch(timeRange) {
        case '7d':
          daysToFetch = 7;
          break;
        case '30d':
          daysToFetch = 30;
          break;
        case '90d':
          daysToFetch = 90;
          break;
        case '12m':
          daysToFetch = 365;
          break;
        default:
          daysToFetch = 7;
      }
      
      // Fetch all dashboard data in parallel
      const [
        overview,
        revenueStats,
        salesStats,
        topProducts,
        recentOrders,
        inventoryAlerts,
        orderStats
      ] = await Promise.all([
        dashboardAPI.getOverview(userId, timeRange),
        dashboardAPI.getRevenueStats({ search: daysToFetch }),
        dashboardAPI.getSalesStats({ search: daysToFetch }),
        dashboardAPI.getTopProducts({ search: daysToFetch }),
        dashboardAPI.getRecentOrders({ search: daysToFetch }),
        dashboardAPI.getInventoryAlerts(),
        dashboardAPI.getOrderStats({ search: daysToFetch })
      ]);
      
      console.log("✅ Complete dashboard data fetched successfully");
      
      return {
        overview,
        revenueStats,
        salesStats,
        topProducts,
        recentOrders,
        inventoryAlerts,
        orderStats,
        timeRange,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Failed to fetch complete dashboard data:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get dashboard summary (quick stats for dashboard cards)
  getDashboardSummary: async (userId, timeRange = '7d') => {
    try {
      console.log(`📊 Fetching dashboard summary for user: ${userId} with range: ${timeRange}`);
      
      let daysToFetch = 7;
      switch(timeRange) {
        case '7d':
          daysToFetch = 7;
          break;
        case '30d':
          daysToFetch = 30;
          break;
        case '90d':
          daysToFetch = 90;
          break;
        case '12m':
          daysToFetch = 365;
          break;
        default:
          daysToFetch = 7;
      }
      
      const response = await apiClient.get(`/dashboard/summary/${userId}`, {
        params: { search: daysToFetch }
      });
      console.log("✅ Dashboard summary fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch dashboard summary:", error);
      throw error.response?.data || error.message;
    }
  }
};

export default dashboardAPI;