// api/stocks.js
import apiClient from './client';

export const stocksAPI = {
  // Get all stocks with search and pagination
  getAll: async (search = '', page = 1, perPage = 15) => {
    try {
      const params = { page, per_page: perPage };
      if (search) params.search = search;
      console.log('📦 Stocks API getAll called with params:', params);
      const response = await apiClient.get('/stocks', { params });
      console.log('✅ Stocks API getAll response status:', response.status);
      return response;
    } catch (error) {
      console.error('❌ Stocks API getAll error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get single stock
  getById: async (id) => {
    try {
      console.log('📦 Stocks API getById called with id:', id);
      const response = await apiClient.get(`/stocks/${id}`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create stock
  create: async (stockData) => {
    try {
      console.log('📦 Stocks API create called with:', stockData);
      const response = await apiClient.post('/stocks/store', stockData);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update stock
  update: async (id, stockData) => {
    try {
      console.log('📦 Stocks API update called with id:', id, stockData);
      const response = await apiClient.put(`/stocks/${id}`, stockData);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete stock
  delete: async (id, userId) => {
    try {
      console.log('📦 Stocks API delete called with id:', id);
      const response = await apiClient.delete(`/stocks/${id}`, { 
        data: { user_id: userId }
      });
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add stock quantity
  addStock: async (id, userId, quantity) => {
    try {
      console.log('📦 Stocks API addStock called with id:', id, 'quantity:', quantity);
      const response = await apiClient.post(`/stocks/add-stock/${id}`, { 
        user_id: userId, 
        quantity: quantity 
      });
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default stocksAPI;