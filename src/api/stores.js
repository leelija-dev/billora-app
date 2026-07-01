// api/stores.js
import apiClient from "./client";
import * as FileSystem from 'expo-file-system';

export const storesAPI = {
  // Get store/shop by user ID with pagination and filters
  getByUserId: async (userId, page = 1, filters = {}) => {
    try {
      const params = { page, per_page: 15 };
      if (filters.search) params.search = filters.search;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.status !== undefined && filters.status !== null && filters.status !== '') params.status = filters.status;
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
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields
      Object.keys(storeData).forEach(key => {
        if (key !== 'logo' && key !== 'bank_qr') {
          formData.append(key, storeData[key]);
        }
      });
      
      // Add logo file if it's a URI
      if (storeData.logo && typeof storeData.logo === 'string') {
        const fileInfo = await FileSystem.getInfoAsync(storeData.logo);
        if (fileInfo.exists) {
          formData.append('logo', {
            uri: storeData.logo,
            type: 'image/jpeg',
            name: 'logo.jpg',
          });
        }
      }
      
      // Add bank_qr file if it's a URI
      if (storeData.bank_qr && typeof storeData.bank_qr === 'string') {
        const fileInfo = await FileSystem.getInfoAsync(storeData.bank_qr);
        if (fileInfo.exists) {
          formData.append('bank_qr', {
            uri: storeData.bank_qr,
            type: 'image/jpeg',
            name: 'bank_qr.jpg',
          });
        }
      }
      
      const response = await apiClient.post('/store/store', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields
      Object.keys(storeData).forEach(key => {
        if (key !== 'logo' && key !== 'bank_qr' && key !== 'deleted_logo' && key !== 'deleted_bank_qr') {
          formData.append(key, storeData[key]);
        }
      });
      
      // Add deleted flags if present
      if (storeData.deleted_logo) {
        formData.append('deleted_logo', 'true');
      }
      if (storeData.deleted_bank_qr) {
        formData.append('deleted_bank_qr', 'true');
      }
      
      // Add logo file if it's a URI (new upload)
      if (storeData.logo && typeof storeData.logo === 'string' && !storeData.logo.startsWith('http')) {
        const fileInfo = await FileSystem.getInfoAsync(storeData.logo);
        if (fileInfo.exists) {
          formData.append('logo', {
            uri: storeData.logo,
            type: 'image/jpeg',
            name: 'logo.jpg',
          });
        }
      }
      
      // Add bank_qr file if it's a URI (new upload)
      if (storeData.bank_qr && typeof storeData.bank_qr === 'string' && !storeData.bank_qr.startsWith('http')) {
        const fileInfo = await FileSystem.getInfoAsync(storeData.bank_qr);
        if (fileInfo.exists) {
          formData.append('bank_qr', {
            uri: storeData.bank_qr,
            type: 'image/jpeg',
            name: 'bank_qr.jpg',
          });
        }
      }
      
      const response = await apiClient.post(`/store/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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