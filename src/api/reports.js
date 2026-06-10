import apiClient from './client';

export const reportsAPI = {
  // Get reports with optional date filtering and pagination
  getReports: async (startDate = '', endDate = '', page = 1) => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (page) params.page = page;
      
      console.log('📊 Reports API Request:', {
        url: '/reports',
        params
      });
      
      const response = await apiClient.get('/reports', { params });
      console.log('✅ Reports API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Reports API Error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get single report by ID
  getSingleReport: async (reportId) => {
    try {
      console.log('📊 Fetching single report:', reportId);
      const response = await apiClient.get(`/reports/single-invoice/${reportId}`);
      console.log('✅ Single Report Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Single Report API Error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get today's reports (default endpoint)
  getTodayReports: async () => {
    try {
      console.log('📊 Fetching today\'s reports');
      const response = await apiClient.get('/reports/');
      console.log('✅ Today\'s Reports Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Today\'s Reports Error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Export reports data
  exportReports: async (startDate = '', endDate = '') => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      console.log('📊 Exporting reports:', { start_date: startDate, end_date: endDate });
      const response = await apiClient.get('/reports/export', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Export Reports Error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get customer details with timeout
  getCustomer: async (customerId) => {
    try {
      console.log('👤 Fetching customer:', customerId);
      const response = await apiClient.get(`/customer/show/${customerId}`, { 
        timeout: 5000 
      });
      console.log('✅ Customer Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Customer API Error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get store details with timeout
  getStore: async (storeId) => {
    try {
      console.log('🏪 Fetching store:', storeId);
      const response = await apiClient.get(`/store/${storeId}`, { 
        timeout: 5000 
      });
      console.log('✅ Store Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Store API Error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get report summary
  getReportSummary: async (params = {}) => {
    try {
      const response = await apiClient.get('/reports/summary', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get sales reports
  getSalesReports: async (params = {}) => {
    try {
      const response = await apiClient.get('/reports/sales', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get purchase reports
  getPurchaseReports: async (params = {}) => {
    try {
      const response = await apiClient.get('/reports/purchases', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get inventory reports
  getInventoryReports: async (params = {}) => {
    try {
      const response = await apiClient.get('/reports/inventory', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get profit reports
  getProfitReports: async (params = {}) => {
    try {
      const response = await apiClient.get('/reports/profits', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default reportsAPI;