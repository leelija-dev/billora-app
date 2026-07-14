// api/gst.js - GST API service
import apiClient from './client';

export const gstAPI = {
  // Get GST collection data for a user
  getGstCollection: async (userId, params = {}) => {
    try {
      console.log('📊 Fetching GST collection for user:', userId, params);
      const response = await apiClient.get(`/gst-collection/${userId}`, { params });
      console.log('📊 GST collection fetched successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch GST collection:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update GST payment status
  updateGstPaymentStatus: async (collectionId, statusData) => {
    try {
      console.log('💰 Updating GST payment status for collection:', collectionId);
      const response = await apiClient.put(`/gst-collection/update-status/${collectionId}`, statusData);
      console.log('💰 GST payment status updated successfully');
      return response;
    } catch (error) {
      console.error('❌ Failed to update GST payment status:', error);
      throw error.response?.data || error.message;
    }
  },
};

export default gstAPI;