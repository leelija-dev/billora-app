// api/stocks.js
import apiClient, { unwrapApiResponse } from './client';

export const stocksAPI = {
  // Get all stocks with search and pagination
  getAll: async (search = '', page = 1, perPage = 15) => {
    try {
      const params = { page, per_page: perPage };
      if (search) params.search = search;
      console.log('📦 Stocks API getAll called with params:', params);
      const response = await apiClient.get('/stocks', { params });
      console.log('✅ Stocks API getAll response status:', response.status);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Stocks API getAll unwrapped:', unwrapped.data);
      return unwrapped;
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
      console.log('✅ Stocks API getById response status:', response.status);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Stocks API getById unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Stocks API getById error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Create stock
  create: async (stockData) => {
    try {
      console.log('📦 Stocks API create called with:', stockData);
      const response = await apiClient.post('/stocks/store', stockData);
      console.log('✅ Stocks API create response status:', response.status);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Stocks API create unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Stocks API create error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update stock
  update: async (id, stockData) => {
    try {
      console.log('📦 Stocks API update called with id:', id, stockData);
      const response = await apiClient.put(`/stocks/${id}`, stockData);
      console.log('✅ Stocks API update response status:', response.status);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Stocks API update unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Stocks API update error:', error);
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
      console.log('✅ Stocks API delete response status:', response.status);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Stocks API delete unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Stocks API delete error:', error);
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
      console.log('✅ Stocks API addStock response status:', response.status);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Stocks API addStock unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Stocks API addStock error:', error);
      throw error.response?.data || error.message;
    }
  },
};

export default stocksAPI;