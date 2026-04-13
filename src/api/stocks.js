import { apiClient } from './client';

export const stocksAPI = {
  // Get all stocks
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/stocks/', { params });
      console.log('Stocks API Response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single stock
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/stocks/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new stock
  create: async (stockData) => {
    try {
      // Map frontend field names to API expected field names
      const payload = {
        user_id: stockData.userId || stockData.user_id,
        product_id: stockData.productId,
        quantity: parseInt(stockData.quantity) || 0,
        selling_price: parseFloat(stockData.sellingPrice) || 0,
        product_package_id: stockData.productPackageId || null,
        purchase_price: parseFloat(stockData.purchasePrice) || null,
        unit_id: stockData.unitId || null,
        created_by: stockData.createdBy || stockData.userId || stockData.user_id,
      };
      
      console.log('Create Stock API payload:', payload);
      const response = await apiClient.post('/stocks/store', payload);
      return response.data;
    } catch (error) {
      console.error('Create Stock API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update stock
  update: async (id, stockData) => {
    try {
      // Map frontend field names to API expected field names
      const payload = {
        quantity: parseInt(stockData.quantity) || 0,
        selling_price: parseFloat(stockData.sellingPrice) || 0,
        product_package_id: stockData.productPackageId || null,
        purchase_price: parseFloat(stockData.purchasePrice) || null,
        unit_id: stockData.unitId || null,
      };
      
      console.log('Update Stock API payload:', payload);
      const response = await apiClient.put(`/stocks/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update Stock API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete stock
  delete: async (id, userId) => {
    try {
      const response = await apiClient.post(`/stocks/${id}`, {
        _method: 'DELETE',
        user_id: userId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add stock (increment quantity)
  addStock: async (id, stockData) => {
    try {
      const response = await apiClient.post(`/stocks/add-stock/${id}`, {
        quantity: parseInt(stockData.quantity) || 0,
        user_id: stockData.userId || stockData.user_id,
      });
      return response.data;
    } catch (error) {
      console.error('Add Stock API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Search stocks
  search: async (query, filters = {}) => {
    try {
      const response = await apiClient.get('/stocks/', {
        params: { search: query, ...filters }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get stocks by product
  getByProduct: async (productId) => {
    try {
      const response = await apiClient.get(`/stocks/product/${productId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};