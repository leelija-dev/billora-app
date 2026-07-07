// api/sellers.js
import apiClient, { unwrapApiResponse } from "./client";

export const sellersAPI = {
  // Get sellers by user ID with pagination and search
  getByUserId: async (userId, page = 1, search = "") => {
    try {
      const params = { page };
      if (search) params.search = search;
      console.log('👥 Fetching sellers for user:', userId, 'params:', params);
      const response = await apiClient.get(`/seller/${userId}`, { params });
      console.log('👥 Sellers fetched successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('👥 Sellers unwrapped:', unwrapped.data);
      return unwrapped;
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
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('👥 Seller created unwrapped:', unwrapped.data);
      return unwrapped;
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
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('👥 Edit data unwrapped:', unwrapped.data);
      return unwrapped;
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
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('👥 Seller updated unwrapped:', unwrapped.data);
      return unwrapped;
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
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('👥 Seller deleted unwrapped:', unwrapped.data);
      return unwrapped;
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
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('👥 Single seller details unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to fetch seller details ${sellerId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Get seller products
  getSellerProducts: async (sellerId, page = 1, search = "") => {
    try {
      const params = { page };
      if (search) params.search = search;
      console.log(`📦 Fetching seller products for seller ${sellerId}:`, params);
      const response = await apiClient.get(`/seller-products/${sellerId}`, { params });
      console.log('📦 Seller products fetched successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Seller products unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to fetch seller products ${sellerId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Make due payment
  makeDuePayment: async (sellerId, paymentData) => {
    try {
      console.log(`💳 Making due payment for seller ${sellerId}:`, paymentData);
      const response = await apiClient.post(`/seller/due-payment/${sellerId}`, paymentData);
      console.log('💳 Due payment successful');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('💳 Due payment unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to make due payment for seller ${sellerId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Get payment history
  getPaymentHistory: async (sellerId, page = 1) => {
    try {
      console.log(`📊 Fetching payment history for seller ${sellerId}:`, { page });
      const response = await apiClient.get(`/seller/payment-history/${sellerId}`, { params: { page } });
      console.log('📊 Payment history fetched successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📊 Payment history unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to fetch payment history ${sellerId}:`, error);
      throw error.response?.data || error.message;
    }
  },
};

export default sellersAPI;