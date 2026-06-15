// api/stores.js
import apiClient from "./client";

export const storesAPI = {
  // Get store/shop by user ID
  getByUserId: async (userId, search = '') => {
    try {
      const params = search ? { search } : {};
      console.log('🏪 Fetching stores for user:', userId, 'params:', params);
      const response = await apiClient.get(`/store/${userId}`, { params });
      console.log('🏪 Stores fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch stores:', error);
      throw error.response?.data || error.message;
    }
  },

  // Register/save store/shop
  create: async (storeData) => {
    try {
      console.log('🏪 Creating store with data:', storeData);
      const response = await apiClient.post('/store/store', storeData);
      console.log('🏪 Store created successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to create store:', error);
      throw error.response?.data || error.message;
    }
  },

  // Edit/show shop (GET method)
  getEditData: async (userId) => {
    try {
      console.log('🏪 Fetching edit data for user:', userId);
      const response = await apiClient.get(`/store/edit/${userId}`);
      console.log('🏪 Edit data fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch edit data:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update shop
  update: async (id, storeData) => {
    try {
      console.log(`🏪 Updating store ${id} with data:`, storeData);
      const response = await apiClient.put(`/store/${id}`, storeData);
      console.log('🏪 Store updated successfully');
      return response;
    } catch (error) {
      console.error(`❌ Failed to update store ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Delete shop
  delete: async (id) => {
    try {
      console.log(`🏪 Deleting store with ID: ${id}`);
      const response = await apiClient.delete(`/store/${id}`);
      console.log('🏪 Store deleted successfully');
      return response;
    } catch (error) {
      console.error(`❌ Failed to delete store ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },
};

export default storesAPI;