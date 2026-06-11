// api/categories.js
import apiClient from './client';

export const categoriesAPI = {
  getAll: async (page = 1, filters = {}) => {
    try {
      const params = { page, ...filters };
      if (filters.search) params.search = filters.search;
      const response = await apiClient.get('/categories', { params });
      console.log('Categories API Response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
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
      console.log('Create Category API payload:', payload);
      const response = await apiClient.post('/categories/store', payload);
      return response.data;
    } catch (error) {
      console.error('Create Category API error:', error.response?.data || error.message);
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
      console.log('Update Category API payload:', payload);
      const response = await apiClient.put(`/categories/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update Category API error:', error.response?.data || error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default categoriesAPI;