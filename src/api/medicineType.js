import apiClient from './client';

export const medicineTypeAPI = {
  // Get all medicine types for a user
  getAll: (userId) => {
    return apiClient.get(`/medicine-type/${userId}`);
  },

  // Get single medicine type
  getById: (id) => {
    return apiClient.get(`/medicine-type/edit/${id}`);
  },

  // Create medicine type
  create: (medicineTypeData) => {
    // Map frontend field names to API expected field names
    const payload = {
      user_id: medicineTypeData.user_id,
      name: medicineTypeData.name,
      is_active: medicineTypeData.is_active ? 1 : 0,
    };
    return apiClient.post('/medicine-type/store', payload);
  },

  // Update medicine type
  update: (id, medicineTypeData) => {
    const payload = {
      name: medicineTypeData.name,
      is_active: medicineTypeData.is_active ? 1 : 0,
    };
    if (medicineTypeData.user_id) {
      payload.user_id = medicineTypeData.user_id;
    }
    return apiClient.put(`/medicine-type/update/${id}`, payload);
  },

  // Delete medicine type
  delete: (id) => {
    return apiClient.delete(`/medicine-type/delete/${id}`);
  },
};

export default medicineTypeAPI;