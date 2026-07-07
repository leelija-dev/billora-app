// api/customers.js
import apiClient, { unwrapApiResponse } from "./client";

export const customersAPI = {
  // Get all customers for a user
  getAll: async (userId, page = 1, perPage = 15, search = "") => {
    try {
      const params = { page, per_page: perPage };
      if (search) params.search = search;
      console.log("👥 Fetching customers for user:", userId, "params:", params);
      const response = await apiClient.get(`/customer/${userId}`, { params });
      console.log("👥 Customers fetched successfully");
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("👥 Customers unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error("❌ Failed to fetch customers:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get due customers (like web version)
  getDueCustomers: async (userId, search = "", page = 1) => {
    try {
      console.log("💰 Fetching due customers for user:", userId);
      const response = await apiClient.get(`/customer/${userId}`, {
        params: {
          dueCustomer: 1,
          search: search || undefined,
          page: page,
          per_page: 15,
        },
      });
      console.log("💰 Due customers fetched:", response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("💰 Due customers unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error("❌ Failed to fetch due customers:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get customers by city (customers who have city information)
  getCustomersByCity: async (userId, search = "", page = 1) => {
    try {
      console.log("🏙️ Fetching customers with city information");
      const response = await apiClient.get(`/customer/${userId}`, {
        params: {
          city: 1,
          search: search || undefined,
          page: page,
          per_page: 15,
        },
      });
      console.log("🏙️ Customers with city fetched:", response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("🏙️ Customers with city unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error("❌ Failed to fetch customers with city:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get unique cities (non-null cities from customers)
  getUniqueCities: async (userId) => {
    try {
      console.log("🏙️ Fetching unique cities for user:", userId);
      const response = await apiClient.get(`/customer/${userId}/cities`);
      console.log("🏙️ Unique cities fetched:", response.data);
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("🏙️ Unique cities unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error("❌ Failed to fetch unique cities:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get single customer
  getById: async (id) => {
    try {
      console.log(`👥 Fetching customer with ID: ${id}`);
      const response = await apiClient.get(`/customer/show/${id}`);
      console.log("👥 Customer fetched successfully");
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("👥 Customer unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to fetch customer ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Create customer
  create: async (customerData) => {
    try {
      console.log("👥 Creating customer with data:", customerData);
      const response = await apiClient.post("/customer/store", customerData);
      console.log("👥 Customer created successfully");
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("👥 Customer created unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error("❌ Failed to create customer:", error);
      throw error.response?.data || error.message;
    }
  },

  // Update customer
  update: async (id, customerData) => {
    try {
      console.log(`👥 Updating customer ${id} with data:`, customerData);
      const response = await apiClient.put(`/customer/${id}`, customerData);
      console.log("👥 Customer updated successfully");
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("👥 Customer updated unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to update customer ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Delete customer (soft delete)
  delete: async (id, userId) => {
    try {
      console.log(`👥 Soft deleting customer with ID: ${id}`);
      const response = await apiClient.delete(`/customer/${id}`, {
        data: { user_id: userId },
      });
      console.log("👥 Customer deleted successfully");
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("👥 Customer deleted unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to delete customer ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Get trashed customers
  getTrashed: async (userId, page = 1) => {
    try {
      console.log("👥 Fetching trashed customers, page:", page);
      const params = { page, per_page: 15 };
      const response = await apiClient.get(`/customer/trashed/${userId}`, {
        params,
      });
      console.log("👥 Trashed customers fetched");
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("👥 Trashed customers unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error("❌ Failed to fetch trashed customers:", error);
      throw error.response?.data || error.message;
    }
  },

  // Restore customer
  restore: async (id, userId) => {
    try {
      console.log(`👥 Restoring customer with ID: ${id}`);
      const response = await apiClient.patch(`/customer/${id}/restore`, {
        user_id: userId,
      });
      console.log("👥 Customer restored successfully");
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("👥 Customer restored unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to restore customer ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Permanently delete customer
  forceDelete: async (id, userId) => {
    try {
      console.log(`👥 Permanently deleting customer with ID: ${id}`);
      const response = await apiClient.delete(`/customer/${id}/force`, {
        data: { user_id: userId },
      });
      console.log("👥 Customer permanently deleted");
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("👥 Customer permanently deleted unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to permanently delete customer ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Add due payment
  addDuePayment: async (id, userId, amount) => {
    try {
      console.log(`💳 Adding due payment for customer ${id}:`, amount);
      const response = await apiClient.put(`/customer/due-payment/${id}`, {
        user_id: userId,
        due_payment: amount,
      });
      console.log("💳 Due payment added successfully");
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("💳 Due payment added unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to add due payment:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Get customer payment history
  getPaymentHistory: async (id, startDate = "", endDate = "") => {
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      console.log(`💳 Fetching payment history for customer ${id}`);
      const response = await apiClient.get(`/customer/payment-history/${id}`, {
        params,
      });
      console.log("💳 Payment history fetched");
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log("💳 Payment history unwrapped:", unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to fetch payment history:`, error);
      throw error.response?.data || error.message;
    }
  },
};

export default customersAPI;