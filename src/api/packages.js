// api/packages.js
import apiClient, { unwrapApiResponse } from './client';

export const packagesAPI = {
  // Get all packages for a user with pagination
  getAll: async (userId, page = 1, perPage = 8, search = '') => {
    try {
      const payload = {
        page: page || 1,
        per_page: perPage || 8,
        search: search || '',
      };
      console.log(`📦 Fetching packages for user ${userId}, page ${page}`);
      const response = await apiClient.get(`/packages-cost/${userId}`, { params: payload });
      console.log('📦 Packages fetched successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Packages unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Failed to fetch packages:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get single package
  getById: async (id) => {
    try {
      console.log(`🔍 Fetching package with ID: ${id}`);
      const response = await apiClient.get(`/packages-cost/edit/${id}`);
      console.log('✅ Package fetched successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Package unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to fetch package ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Create package
  create: async (userId, packageData) => {
    try {
      const payload = {
        user_id: userId,
        package_name: packageData.package_name,
        package_price: packageData.package_price,
        package_size: packageData.package_size,
        is_active: packageData.is_active ? 1 : 0,
      };
      console.log('📝 Create package payload:', payload);
      const response = await apiClient.post(`/packages-cost/store/${userId}`, payload);
      console.log('✅ Package created successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Package created unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Failed to create package:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update package
  update: async (id, packageData) => {
    try {
      const payload = {
        package_name: packageData.package_name,
        package_price: packageData.package_price,
        package_size: packageData.package_size,
        is_active: packageData.is_active ? 1 : 0,
      };
      if (packageData.user_id) {
        payload.user_id = packageData.user_id;
      }
      console.log(`✏️ Update package ${id} payload:`, payload);
      const response = await apiClient.put(`/packages-cost/update/${id}`, payload);
      console.log('✅ Package updated successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Package updated unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to update package ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Delete package
  delete: async (id) => {
    try {
      console.log(`🗑️ Deleting package with ID: ${id}`);
      const response = await apiClient.delete(`/packages-cost/delete/${id}`);
      console.log('✅ Package deleted successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Package deleted unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to delete package ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },
};

export default packagesAPI;