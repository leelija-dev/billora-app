// api/medicineType.js
import apiClient, { unwrapApiResponse } from './client';

export const medicineTypeAPI = {
  // Get all medicine types for a user
  getAll: async (userId, page = 1, search = '') => {
    try {
      const params = { page, per_page: 15 };
      if (search) params.search = search;
      
      console.log('💊 Fetching medicine types for user:', userId, 'params:', params);
      const response = await apiClient.get(`/medicine-type/${userId}`, { params });
      console.log('💊 Medicine types fetched successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('💊 Medicine types unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Failed to fetch medicine types:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get single medicine type
  getById: async (id) => {
    try {
      console.log(`💊 Fetching medicine type with ID: ${id}`);
      const response = await apiClient.get(`/medicine-type/edit/${id}`);
      console.log('💊 Medicine type fetched successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('💊 Medicine type unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to fetch medicine type ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Create medicine type
  create: async (medicineTypeData) => {
    try {
      // Map frontend field names to API expected field names
      const payload = {
        user_id: medicineTypeData.user_id,
        name: medicineTypeData.name,
        is_active: medicineTypeData.is_active ? 1 : 0,
      };
      
      console.log('📝 Create medicine type payload:', payload);
      const response = await apiClient.post('/medicine-type/store', payload);
      console.log('✅ Medicine type created successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Medicine type created unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Failed to create medicine type:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update medicine type
  update: async (id, medicineTypeData) => {
    try {
      const payload = {
        name: medicineTypeData.name,
        is_active: medicineTypeData.is_active ? 1 : 0,
      };
      if (medicineTypeData.user_id) {
        payload.user_id = medicineTypeData.user_id;
      }
      
      console.log(`✏️ Update medicine type ${id} payload:`, payload);
      const response = await apiClient.put(`/medicine-type/update/${id}`, payload);
      console.log('✅ Medicine type updated successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Medicine type updated unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to update medicine type ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Delete medicine type
  delete: async (id) => {
    try {
      console.log(`🗑️ Deleting medicine type with ID: ${id}`);
      const response = await apiClient.delete(`/medicine-type/delete/${id}`);
      console.log('✅ Medicine type deleted successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Medicine type deleted unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to delete medicine type ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },
};

export default medicineTypeAPI;