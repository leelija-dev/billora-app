// api/invoices.js - Invoice API service (UPDATED)
import apiClient from './client';

export const invoiceAPI = {
  // Get all invoices/bills history with pagination and search
  getAll: async (page = 1, filters = {}) => {
    const params = new URLSearchParams();
    
    if (page) {
      params.append('page', page);
    }
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    if (filters.start_date) {
      params.append('start_date', filters.start_date);
    }
    
    if (filters.end_date) {
      params.append('end_date', filters.end_date);
    }
    
    if (filters.store) {
      params.append('store', filters.store);
    }
    
    if (filters.due_amount) {
      params.append('due_amount', filters.due_amount);
    }
    
    const response = await apiClient.get(`/invoice/bill-history?${params.toString()}`);
    return response;
  },

  // Get single invoice/bill with payment history filters
  getById: async (id, startDate = '', endDate = '') => {
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    let originalId = id;
    
    // Check if the ID is a string that looks like Base64
    if (typeof id === 'string' && id.length > 0 && !/^\d+$/.test(id)) {
      try {
        // Decode Base64
        const decoded = atob(id);
        // Remove secret key from end if present
        const secretKey = process.env.EXPO_PUBLIC_SECRET_ENCRYPTION_KEY || '';
        originalId = decoded.replace(secretKey, '');
        console.log('Decoded ID from Base64:', originalId);
      } catch (error) {
        console.error('Failed to decode Base64 ID, using original:', id);
        originalId = id;
      }
    } else {
      console.log('Using plain ID:', originalId);
    }
    
    // Ensure we have a valid ID
    if (!originalId || originalId === '×}') {
      console.error('Invalid invoice ID:', originalId);
      throw new Error(`Invalid invoice ID: ${originalId}`);
    }
    
    const response = await apiClient.get(`/invoice/${originalId}?${params.toString()}`);
    return response;
  },

  // Get bill generate page data
  getBillGenerateData: async (userId) => {
    if (!userId) {
      console.error('User ID is required for getBillGenerateData');
      return apiClient.get('/invoice');
    }
    console.log('Fetching bill generate data for user ID:', userId);
    const response = await apiClient.get('/invoice', {
      params: { user_id: userId },
    });
    return response;
  },

  // Get customer details by ID
  getCustomer: async (customerId) => {
    const response = await apiClient.get(`/customer/show/${customerId}`);
    return response;
  },

  // Get store details by ID
  getStore: async (storeId) => {
    const response = await apiClient.get(`/store/edit/${storeId}`);
    return response;
  },

  // Create/store new invoice/bill
  create: async (invoiceData) => {
    console.log('Creating invoice with data:', invoiceData);
    const response = await apiClient.post('/invoice/store', invoiceData);
    return response;
  },

  // Update invoice/bill
  update: async (id, invoiceData) => {
    const response = await apiClient.put(`/invoice/${id}`, invoiceData);
    return response;
  },

  // Delete invoice/bill
  delete: async (id) => {
    const response = await apiClient.delete(`/invoice/${id}`);
    return response;
  },

  // Cancel invoice — restores stock (if permitted), reverses customer due, updates GST rows and status
  updateBillStatus: async (id) => {
    const response = await apiClient.put(`/invoice/update-bill-status/${id}`, {});
    return response;
  },

  // Pay invoice-wise due (partial or full) - FIXED with proper error handling
  invoiceDuePay: async (id, payload) => {
    try {
      console.log('💳 invoiceDuePay called with:', { id, payload });
      const response = await apiClient.put(`/invoice/invoice-due-pay/${id}`, {
        paid_amount: payload.paid_amount,
        payment_method: payload.payment_method,
      });
      console.log('💳 invoiceDuePay response status:', response.status);
      console.log('💳 invoiceDuePay response data:', response.data);
      
      // Ensure we return the full response
      return response;
    } catch (error) {
      console.error('❌ invoiceDuePay error:', error);
      throw error;
    }
  },

  // Get products with stock for invoice creation
  getProductsWithStock: async (searchTerm = '') => {
    const params = new URLSearchParams();
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    const response = await apiClient.get(`/invoice/products?${params.toString()}`);
    return response;
  },
};

export default invoiceAPI;