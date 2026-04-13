import { apiClient } from './client';

export const storesAPI = {
  // Get all stores for a user
  getAll: async (userId, params = {}) => {
    try {
      const response = await apiClient.get(`/store/${userId}`, { params });
      console.log('Stores API Response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search stores
  search: async (userId, query, params = {}) => {
    try {
      const api = apiClient;
      const response = await api.get(`/store/${userId}`, {
        params: { search: query, ...params }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single store
  getById: async (id) => {
    try {
      const api = apiClient;
      const response = await api.get(`/store/edit/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Store API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create new store
  create: async (storeData) => {
    try {
      const api = apiClient;
      
      // Map frontend field names to API expected field names
      const payload = {
        user_id: storeData.userId || storeData.user_id,
        name: storeData.name,
        gst: storeData.gst || '',
        email: storeData.email,
        logo: storeData.logo || null,
        mobile: storeData.mobile || '',
        address: storeData.address,
        city: storeData.city,
        status: storeData.status ? 1 : 0,
        created_by: storeData.createdBy || storeData.userId || storeData.user_id,
      };
      
      console.log('Create Store API payload:', payload);
      const response = await api.post('/store/store', payload);
      return response.data;
    } catch (error) {
      console.error('Create Store API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update store
  update: async (id, storeData) => {
    try {
      const api = apiClient;
      
      // Map frontend field names to API expected field names
      const payload = {
        name: storeData.name,
        gst: storeData.gst || '',
        email: storeData.email,
        logo: storeData.logo || null,
        mobile: storeData.mobile || '',
        address: storeData.address,
        city: storeData.city,
        status: storeData.status ? 1 : 0,
      };
      
      console.log('Update Store API payload:', payload);
      const response = await api.put(`/store/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update Store API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete store
  delete: async (id) => {
    try {
      const api = apiClient;
      const response = await api.delete(`/store/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};