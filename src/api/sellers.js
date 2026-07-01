// api/sellers.js
import apiClient from "./client";

export const sellersAPI = {
  // Get sellers by user ID with pagination and search
  getByUserId: async (userId, page = 1, search = "") => {
    try {
      const params = { page };
      if (search) params.search = search;
      console.log('👥 Fetching sellers for user:', userId, 'params:', params);
      const response = await apiClient.get(`/seller/${userId}`, { params });
      console.log('👥 Sellers fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch sellers:', error);
      throw error.response?.data || error.message;
    }
  },

  // Create seller
  create: async (sellerData) => {
    try {
      console.log('👥 Creating seller with data:', sellerData);
      const response = await apiClient.post('/seller/store', sellerData);
      console.log('👥 Seller created successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to create seller:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get seller details for editing
  getEditData: async (sellerId) => {
    try {
      console.log('👥 Fetching edit data for seller:', sellerId);
      const response = await apiClient.get(`/seller/edit/${sellerId}`);
      console.log('👥 Edit data fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch edit data:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update seller
  update: async (sellerId, sellerData) => {
    try {
      console.log(`👥 Updating seller ${sellerId} with data:`, sellerData);
      const response = await apiClient.put(`/seller/update/${sellerId}`, sellerData);
      console.log('👥 Seller updated successfully');
      return response;
    } catch (error) {
      console.error(`❌ Failed to update seller ${sellerId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Delete seller
  delete: async (sellerId) => {
    try {
      console.log(`👥 Deleting seller with ID: ${sellerId}`);
      const response = await apiClient.delete(`/seller/delete/${sellerId}`);
      console.log('👥 Seller deleted successfully');
      return response;
    } catch (error) {
      console.error(`❌ Failed to delete seller ${sellerId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Get single seller details with products
  getSingleSeller: async (sellerId) => {
    try {
      console.log(`👥 Fetching single seller details for ID: ${sellerId}`);
      const response = await apiClient.get(`/seller/${sellerId}`);
      console.log('👥 Single seller details fetched successfully');
      return response;
    } catch (error) {
      console.error(`❌ Failed to fetch seller details ${sellerId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Make due payment
  makeDuePayment: async (sellerId, paymentData) => {
    try {
      console.log(`💳 Making due payment for seller ${sellerId}:`, paymentData);
      const response = await apiClient.post(`/seller/due-payment/${sellerId}`, paymentData);
      console.log('💳 Due payment successful');
      return response;
    } catch (error) {
      console.error(`❌ Failed to make due payment for seller ${sellerId}:`, error);
      throw error.response?.data || error.message;
    }
  },
};

export default sellersAPI;
