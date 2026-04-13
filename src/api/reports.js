import apiClient from './client';
import { isMockMode } from './index';
import { mockReports } from './mock/reports';

export const reportsAPI = {
  // Get all reports with optional date filtering
  getReports: async (params = {}) => {
    try {
      if (isMockMode()) {
        console.log('Using mock reports API');
        return await mockReports.get('/reports/', { params });
      }
      
      const response = await apiClient.get('/reports/', { params });
      console.log('Reports API Response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get report summary
  getReportSummary: async (params = {}) => {
    try {
      if (isMockMode()) {
        console.log('Using mock reports API for summary');
        return await mockReports.get('/reports/summary', { params });
      }
      
      const response = await apiClient.get('/reports/summary', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single report by ID
  getReportById: async (id) => {
    try {
      if (isMockMode()) {
        console.log('Using mock reports API for report detail');
        return await mockReports.get(`/reports/${id}`);
      }
      
      const response = await apiClient.get(`/reports/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Export reports
  exportReports: async (format = 'pdf', params = {}) => {
    try {
      if (isMockMode()) {
        console.log('Using mock reports API for export');
        return await mockReports.get(`/reports/export`, { 
          params: { format, ...params }
        });
      }
      
      const response = await apiClient.get('/reports/export', {
        params: { format, ...params }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get sales reports
  getSalesReports: async (params = {}) => {
    try {
      if (isMockMode()) {
        console.log('Using mock reports API for sales');
        return await mockReports.get('/reports/sales', { params });
      }
      
      const response = await apiClient.get('/reports/sales', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get purchase reports
  getPurchaseReports: async (params = {}) => {
    try {
      if (isMockMode()) {
        console.log('Using mock reports API for purchases');
        return await mockReports.get('/reports/purchases', { params });
      }
      
      const response = await apiClient.get('/reports/purchases', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get inventory reports
  getInventoryReports: async (params = {}) => {
    try {
      if (isMockMode()) {
        console.log('Using mock reports API for inventory');
        return await mockReports.get('/reports/inventory', { params });
      }
      
      const response = await apiClient.get('/reports/inventory', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get profit reports
  getProfitReports: async (params = {}) => {
    try {
      if (isMockMode()) {
        console.log('Using mock reports API for profits');
        return await mockReports.get('/reports/profits', { params });
      }
      
      const response = await apiClient.get('/reports/profits', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};