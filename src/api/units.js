// api/units.js
import apiClient, { unwrapApiResponse } from './client';

export const unitsAPI = {
  // Get all units with pagination
  getAll: async (page = 1, perPage = 15, filters = {}) => {
    try {
      const params = { page, per_page: perPage };
      if (filters.search) params.search = filters.search;
      if (filters.sortBy) params.sort_by = filters.sortBy;
      if (filters.sortOrder) params.sort_order = filters.sortOrder;
      
      console.log('📦 Units API getAll called with params:', params);
      const response = await apiClient.get('/units', { params });
      console.log('📦 Units API getAll raw response:', response.data);
      
      // ✅ UNWRAP the response to standardize structure
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Units API getAll unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Units API getAll error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get single unit
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/units/${id}`);
      console.log('📦 Units API getById raw:', response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Units API getById unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Units API getById error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Create unit
  create: async (unitData) => {
    try {
      console.log('📝 Units API create called with:', unitData);
      const response = await apiClient.post('/units/store', unitData);
      console.log('✅ Units API create raw response:', response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Units API create unwrapped:', unwrapped.data);
      return unwrapped;
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
      console.log('✅ Units API update raw response:', response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Units API update unwrapped:', unwrapped.data);
      return unwrapped;
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
      console.log('✅ Units API delete raw response:', response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Units API delete unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Units API delete error:', error);
      throw error.response?.data || error.message;
    }
  },
};

export default unitsAPI;