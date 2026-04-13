import { apiClient } from './client';


export const categoriesAPI = {
  // Get all categories
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/categories', { params });
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single category
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new category
  create: async (categoryData) => {
    try {
      // Map frontend field names to API expected field names
      const payload = {
        user_id: categoryData.userId || categoryData.user_id,
        name: categoryData.name,
        is_active: categoryData.isActive ?? true,
        created_by: categoryData.createdBy || categoryData.userId || categoryData.user_id,
        description: categoryData.description || '',
      };
      
      console.log('Create API payload:', payload);
      const response = await apiClient.post('/categories/store', payload);
      return response.data;
    } catch (error) {
      console.error('Create API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update category
  update: async (id, categoryData) => {
    try {
      // Map frontend field names to API expected field names
      const payload = {
        name: categoryData.name,
        is_active: categoryData.isActive ?? categoryData.is_active,
        description: categoryData.description || '',
      };
      
      // Add user_id if provided (required for update)
      if (categoryData.user_id) {
        payload.user_id = categoryData.user_id;
      }
      
      console.log('Update API payload:', payload);
      const response = await apiClient.put(`/categories/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update API error:', error.response?.data || error.message);
      throw error;
    }
  },


  // Delete category
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search categories (using the index endpoint with search parameter)
  search: async (query, filters = {}) => {
    try {
      const response = await apiClient.get('/categories', {
        params: { search: query, ...filters }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
