import { apiClient } from './client';

export const customersAPI = {
  // Get all customers for a user
  getAll: async (userId, params = {}) => {
    try {
      const response = await apiClient.get(`/customer/${userId}`, { params });
      console.log('Customers API Response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search customers
  search: async (userId, query, params = {}) => {
    try {
      const response = await apiClient.get(`/customer/${userId}`, {
        params: { search: query, ...params }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single customer
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/customer/show/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Customer API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get customer payment history with date filter
  getPaymentHistory: async (id, startDate, endDate) => {
    try {
      const response = await apiClient.get(`/customer/show/${id}`, {
        params: { 
          start_date: startDate,
          end_date: endDate 
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new customer
  create: async (customerData) => {
    try {
      // Map frontend field names to API expected field names
      const payload = {
        admin_id: customerData.adminId || customerData.admin_id,
        name: customerData.name,
        email: customerData.email || '',
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city || '',
        created_by: customerData.createdBy || customerData.adminId || customerData.admin_id,
      };
      
      console.log('Create Customer API payload:', payload);
      const response = await apiClient.post('/customer/store', payload);
      return response.data;
    } catch (error) {
      console.error('Create Customer API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update customer
  update: async (id, customerData) => {
    try {
      // Map frontend field names to API expected field names
      const payload = {
        user_id: customerData.userId || customerData.user_id || customerData.adminId || customerData.admin_id,
        name: customerData.name,
        email: customerData.email || '',
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city || '',
      };
      
      console.log('Update Customer API payload:', payload);
      const response = await apiClient.put(`/customer/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update Customer API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Add due payment
  addDuePayment: async (id, paymentData) => {
    try {
      const response = await apiClient.put(`/customer/due-payment/${id}`, {
        due_payment: paymentData.duePayment || paymentData.due_payment
      });
      return response.data;
    } catch (error) {
      console.error('Due Payment API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete customer (soft delete)
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/customer/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get trashed (soft deleted) customers
  getTrashed: async () => {
    try {
      const response = await apiClient.get('/customer/trashed');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Restore soft deleted customer
  restore: async (id) => {
    try {
      const response = await apiClient.patch(`/customer/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Permanently delete customer
  forceDelete: async (id) => {
    try {
      const response = await apiClient.delete(`/customer/${id}/force`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};