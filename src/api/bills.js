import { apiClient } from './client';

export const billsAPI = {
  // Get all bills history
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/invoice/bill-history', { params });
      console.log('Bills API Response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search bills
  search: async (query, params = {}) => {
    try {
      const response = await apiClient.get('/invoice/bill-history', {
        params: { search: query, ...params }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single bill
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/invoice/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get bills by date range
  getByDateRange: async (startDate, endDate, params = {}) => {
    try {
      const response = await apiClient.get('/invoice/bill-history', {
        params: { start_date: startDate, end_date: endDate, ...params }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new bill
  create: async (billData) => {
    try {
      console.log("here is the bill data:", billData);
      
      // Check if data is already in snake_case (from your form) or needs mapping
      // If billData already has customer_id, use it directly
      if (billData.customer_id !== undefined) {
        // Data is already in the correct format, send it directly
        console.log('Using direct snake_case payload');
        const response = await apiClient.post('/invoice/store', billData);
        return response.data;
      }
      
      // Otherwise, map from camelCase to snake_case
      const payload = {
        user_id: billData.userId || billData.user_id,
        customer_id: billData.customerId || billData.customer_id,
        store_id: billData.storeId || billData.store_id,
        paid_amount: parseFloat(billData.paidAmount || billData.paid_amount) || 0,
        created_by: billData.createdBy || billData.created_by || billData.userId || billData.user_id,
        items: (billData.items || []).map(item => ({
          product_id: item.productId || item.product_id,
          quantity: parseInt(item.quantity || item.quantity),
          item_count: parseInt(item.quantity || item.item_count || item.quantity),
          unit_id: item.unitId || item.unit_id,
          price: parseFloat(item.price || item.price),
          gst: parseFloat(item.gst || item.gst) || 0,
          discount: parseFloat(item.discount || item.discount) || 0,
          total_price: parseFloat(item.totalPrice || item.total_price),
          stock_id: item.stockId || item.stock_id, // Add this if needed
          status: item.status || 'completed'
        }))
      };
      
      console.log('Create Bill API mapped payload:', payload);
      const response = await apiClient.post('/invoice/store', payload);
      return response.data;
    } catch (error) {
      console.error('Create Bill API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update bill
  update: async (id, billData) => {
    try {
      const payload = {
        customer_id: billData.customerId,
        store_id: billData.storeId,
        paid_amount: parseFloat(billData.paidAmount) || 0,
        items: billData.items.map(item => ({
          product_id: item.productId,
          quantity: parseInt(item.quantity),
          item_count: parseInt(item.quantity),
          unit_id: item.unitId,
          price: parseFloat(item.price),
          gst: parseFloat(item.gst) || 0,
          discount: parseFloat(item.discount) || 0,
          total_price: parseFloat(item.totalPrice),
          status: 'completed'
        }))
      };
      
      console.log('Update Bill API payload:', payload);
      const response = await apiClient.put(`/invoice/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Update Bill API error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete bill
  deleteBill: async (id) => {
    try {
      const response = await apiClient.delete(`/invoice/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Print bill (get formatted bill data)
  printBill: async (id, format = 'a4') => {
    try {
      const response = await apiClient.get(`/invoice/print/${id}`, {
        params: { format }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get customer list for dropdown
  getCustomers: async () => {
    try {
      const response = await apiClient.get('/customer/1'); // Use admin_id = 1 for now
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new customer
  createCustomer: async (customerData) => {
    try {
      const response = await apiClient.post('/bill-customer/store', customerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};