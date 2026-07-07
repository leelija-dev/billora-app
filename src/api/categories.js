// api/categories.js
import apiClient, { unwrapApiResponse } from './client';

export const categoriesAPI = {
  getAll: async (page = 1, filters = {}) => {
    try {
      const params = { page, ...filters };
      if (filters.search) params.search = filters.search;
      if (filters.per_page) params.per_page = filters.per_page;
      
      const response = await apiClient.get('/categories', { params });
      console.log('📦 Categories API getAll raw response:', response.data);
      
      // ✅ UNWRAP the response to standardize structure
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Categories API getAll unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Categories API getAll error:', error);
      throw error.response?.data || error.message;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/categories/${id}`);
      console.log('📦 Categories API getById raw:', response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Categories API getById unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Categories API getById error:', error);
      throw error.response?.data || error.message;
    }
  },

  create: async (categoryData) => {
    try {
      const payload = {
        user_id: categoryData.user_id,
        name: categoryData.name,
        is_active: categoryData.is_active,
        created_by: categoryData.created_by,
        description: categoryData.description || '',
      };
      console.log('📝 Create Category API payload:', payload);
      const response = await apiClient.post('/categories/store', payload);
      console.log('✅ Categories API create raw response:', response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Categories API create unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Create Category API error:', error.response?.data || error.message);
      throw error;
    }
  },

  update: async (id, categoryData) => {
    try {
      const payload = {
        name: categoryData.name,
        is_active: categoryData.is_active,
        description: categoryData.description || '',
      };
      if (categoryData.user_id) {
        payload.user_id = categoryData.user_id;
      }
      console.log('✏️ Update Category API payload:', payload);
      const response = await apiClient.put(`/categories/${id}`, payload);
      console.log('✅ Categories API update raw response:', response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Categories API update unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Update Category API error:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/categories/${id}`);
      console.log('✅ Categories API delete raw response:', response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Categories API delete unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Categories API delete error:', error);
      throw error.response?.data || error.message;
    }
  },
};

export default categoriesAPI;