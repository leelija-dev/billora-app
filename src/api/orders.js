import apiClient from './client';

export const ordersAPI = {
  // Get user order history
  getUserOrderHistory: async (userId) => {
    try {
      return await apiClient.get(`/invoice/user-order-history/${userId}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, orderStatus) => {
    try {
      return await apiClient.put(`/invoice/update-order-status/${orderId}`, { order_status: orderStatus });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update payment status
  updatePaymentStatus: async (orderId, paymentStatus) => {
    try {
      return await apiClient.put(`/invoice/update-payment-status/${orderId}`, { payment_status: paymentStatus });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get payment details for each order
  getOrderPaymentDetails: async (orderId, userId) => {
    try {
      return await apiClient.get(`/invoice/user-order-due/${orderId}`, { params: { user_id: userId } });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update payment
  updateOrderPayment: async (orderId, userId, paidAmount) => {
    try {
      return await apiClient.put(`/invoice/update-order-payment/${orderId}`, {
        user_id: userId,
        paid_amount: paidAmount
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new order
  createOrder: async (orderData) => {
    try {
      return await apiClient.post('/orders/', orderData);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    try {
      return await apiClient.get(`/orders/${orderId}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update order
  updateOrder: async (orderId, orderData) => {
    try {
      return await apiClient.put(`/orders/${orderId}`, orderData);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete order
  deleteOrder: async (orderId) => {
    try {
      return await apiClient.delete(`/orders/${orderId}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default ordersAPI;
