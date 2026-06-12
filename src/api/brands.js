import  apiClient  from './client';

export const brandsAPI = {
  // Get all brands
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/brands', { params });
      console.log('Brands API Response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single brand
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/brands/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new brand
  create: async (brandData) => {
    try {
      // Map frontend field names to API expected field names
      const payload = {
        user_id: brandData.userId || brandData.user_id,
        name: brandData.name,
        is_active: brandData.isActive ?? true,
        created_by: brandData.createdBy || brandData.userId || brandData.user_id,
        description: brandData.description || '',
      };
      
      console.log('Create brand API payload:', payload);
      const response = await apiClient.post('/brands/store', payload);
      return response.data;
    } catch (error) {
      console.error('Create brand API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update brand
  update: async (id, brandData) => {
    try {
      // Map frontend field names to API expected field names
      const payload = {
        name: brandData.name,
        is_active: brandData.isActive ?? brandData.is_active,
        description: brandData.description || '',
      };
      
      // Add user_id if provided (required for update)
      if (brandData.user_id) {
        payload.user_id = brandData.user_id;
      }
      
      console.log('Update brand API payload:', payload);
      const response = await apiClient.post(`/brands/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update brand API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete brand
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/brands/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search brands (using the index endpoint with search parameter)
  search: async (query, filters = {}) => {
    try {
      const response = await apiClient.get('/brands', {
        params: { search: query, ...filters }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};