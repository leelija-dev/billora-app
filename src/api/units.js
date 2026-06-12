// api/units.js
import apiClient from './client';

export const unitsAPI = {
  // Get all units with pagination
  getAll: async (page = 1, perPage = 15, filters = {}) => {
    try {
      const params = { page, per_page: perPage };
      if (filters.search) params.search = filters.search;
      console.log('📦 Units API getAll called with params:', params);
      const response = await apiClient.get('/units', { params });
      console.log('📦 Units API getAll response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Units API getAll error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get single unit
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/units/${id}`);
      return response;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create unit
  create: async (unitData) => {
    try {
      console.log('📝 Units API create called with:', unitData);
      const response = await apiClient.post('/units/store', unitData);
      console.log('✅ Units API create response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Units API create error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update unit
  update: async (id, unitData) => {
    try {
      console.log('✏️ Units API update called with:', id, unitData);
      const response = await apiClient.put(`/units/${id}`, unitData);
      console.log('✅ Units API update response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Units API update error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Delete unit
  delete: async (id) => {
    try {
      console.log('🗑️ Units API delete called with:', id);
      const response = await apiClient.delete(`/units/${id}`);
      console.log('✅ Units API delete response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Units API delete error:', error);
      throw error.response?.data || error.message;
    }
  },
};

export default unitsAPI;