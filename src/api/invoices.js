import { apiClient } from './client';


export const invoicesAPI = {
  // Get all invoices/bill history
  getAll: async (params = {}) => {
    try {
      return await apiClient.get('/invoice/bill-history', { params });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single invoice
  getById: async (id) => {
    try {
      const api = apiClient;
      return await api.get(`/invoice/${id}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new invoice/bill
  create: async (invoiceData) => {
    try {
      const api = apiClient;
      return await api.post('/invoice/store', {
        user_id: invoiceData.userId,
        customer_id: invoiceData.customerId,
        store_id: invoiceData.storeId,
        paid_amount: invoiceData.paidAmount,
        created_by: invoiceData.createdBy,
        items: invoiceData.items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          item_count: item.quantity,
          unit_id: item.unitId,
          price: item.price,
          gst: item.gst || 0,
          discount: item.discount || 0,
          total_price: item.totalPrice,
          status: 'completed',
        })),
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update invoice
  update: async (id, invoiceData) => {
    try {
      const api = apiClient;
      return await api.put(`/invoice/${id}`, {
        customer_id: invoiceData.customerId,
        store_id: invoiceData.storeId,
        paid_amount: invoiceData.paidAmount,
        items: invoiceData.items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          item_count: item.quantity,
          unit_id: item.unitId,
          price: item.price,
          gst: item.gst || 0,
          discount: item.discount || 0,
          total_price: item.totalPrice,
          status: item.status || 'completed',
        })),
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete invoice
  delete: async (id) => {
    try {
      const api = apiClient;
      return await api.delete(`/invoice/${id}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get invoice by customer
  getByCustomer: async (customerId, params = {}) => {
    try {
      const api = apiClient;
      return await api.get(`/invoice/customer/${customerId}`, { params });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get invoice by store
  getByStore: async (storeId, params = {}) => {
    try {
      const api = apiClient;
      return await api.get(`/invoice/store/${storeId}`, { params });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get invoice statistics
  getStats: async (filters = {}) => {
    try {
      const api = apiClient;
      return await api.get('/invoice/stats', { params: filters });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Generate invoice PDF
  generatePDF: async (id) => {
    try {
      const api = apiClient;
      return await api.get(`/invoice/${id}/pdf`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Send invoice via email
  sendEmail: async (id, emailData) => {
    try {
      const api = apiClient;
      return await api.post(`/invoice/${id}/send-email`, emailData);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get invoice payments
  getPayments: async (invoiceId) => {
    try {
      const api = apiClient;
      return await api.get(`/invoice/${invoiceId}/payments`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add payment to invoice
  addPayment: async (invoiceId, paymentData) => {
    try {
      const api = apiClient;
      return await api.post(`/invoice/${invoiceId}/payment`, {
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        payment_date: paymentData.paymentDate,
        notes: paymentData.notes,
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
