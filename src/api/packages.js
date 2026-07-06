import apiClient from './client';

export const packagesAPI = {
  // Get all packages for a user with pagination
  getAll: async (userId, page = 1, perPage = 8, search = '') => {
    try {
      // Match orders API pattern - simple params object
      const payload = {
        page: page || 1,
        per_page: perPage || 8,
        search: search || '',
      };
      return await apiClient.get(`/packages-cost/${userId}`, { params: payload });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single package
  getById: (id) => {
    return apiClient.get(`/packages-cost/edit/${id}`);
  },

  // Create package
  create: (userId, packageData) => {
    const payload = {
      user_id: userId,
      package_name: packageData.package_name,
      package_price: packageData.package_price,
      package_size: packageData.package_size,
      is_active: packageData.is_active ? 1 : 0,
    };
    return apiClient.post(`/packages-cost/store/${userId}`, payload);
  },

  // Update package
  update: (id, packageData) => {
    const payload = {
      package_name: packageData.package_name,
      package_price: packageData.package_price,
      package_size: packageData.package_size,
      is_active: packageData.is_active ? 1 : 0,
    };
    if (packageData.user_id) {
      payload.user_id = packageData.user_id;
    }
    return apiClient.put(`/packages-cost/update/${id}`, payload);
  },

  // Delete package
  delete: (id) => {
    return apiClient.delete(`/packages-cost/delete/${id}`);
  },
};

export default packagesAPI;
