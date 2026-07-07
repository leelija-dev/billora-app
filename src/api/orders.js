// api/orders.js
import apiClient, { unwrapApiResponse } from './client';

export const ordersAPI = {
  // Get user order history with pagination
  getUserOrderHistory: async (userId, page = 1) => {
    try {
      console.log(`📦 Fetching order history for user ${userId}, page ${page}`);
      const response = await apiClient.get(`/invoice/user-order-history/${userId}`, {
        params: { page }
      });
      console.log('📦 Orders fetched successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('📦 Orders unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, orderStatus) => {
    try {
      console.log(`✏️ Updating order ${orderId} status to: ${orderStatus}`);
      const response = await apiClient.put(`/invoice/update-order-status/${orderId}`, { order_status: orderStatus });
      console.log('✅ Order status updated successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Order status updated unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to update order status ${orderId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Update payment status
  updatePaymentStatus: async (orderId, paymentStatus) => {
    try {
      console.log(`✏️ Updating order ${orderId} payment status to: ${paymentStatus}`);
      const response = await apiClient.put(`/invoice/update-payment-status/${orderId}`, { payment_status: paymentStatus });
      console.log('✅ Payment status updated successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Payment status updated unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to update payment status ${orderId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Get payment details for each order
  getOrderPaymentDetails: async (orderId, userId) => {
    try {
      console.log(`💰 Getting payment details for order ${orderId}`);
      const response = await apiClient.get(`/invoice/user-order-due/${orderId}`, { params: { user_id: userId } });
      console.log('💰 Payment details fetched successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('💰 Payment details unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to get payment details ${orderId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Update payment
  updateOrderPayment: async (orderId, userId, paidAmount) => {
    try {
      console.log(`💰 Updating payment for order ${orderId}: ${paidAmount}`);
      const response = await apiClient.put(`/invoice/update-order-payment/${orderId}`, {
        user_id: userId,
        paid_amount: paidAmount
      });
      console.log('💰 Payment updated successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('💰 Payment updated unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to update payment ${orderId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Create new order
  createOrder: async (orderData) => {
    try {
      console.log('📝 Creating new order:', orderData);
      const response = await apiClient.post('/orders/', orderData);
      console.log('✅ Order created successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Order created unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error('❌ Failed to create order:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    try {
      console.log(`🔍 Fetching order ${orderId}`);
      const response = await apiClient.get(`/orders/${orderId}`);
      console.log('✅ Order fetched successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Order fetched unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to fetch order ${orderId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Update order
  updateOrder: async (orderId, orderData) => {
    try {
      console.log(`✏️ Updating order ${orderId}:`, orderData);
      const response = await apiClient.put(`/orders/${orderId}`, orderData);
      console.log('✅ Order updated successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Order updated unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to update order ${orderId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Delete order
  deleteOrder: async (orderId) => {
    try {
      console.log(`🗑️ Deleting order ${orderId}`);
      const response = await apiClient.delete(`/orders/${orderId}`);
      console.log('✅ Order deleted successfully');
      
      // ✅ UNWRAP the response
      const unwrapped = unwrapApiResponse(response);
      console.log('✅ Order deleted unwrapped:', unwrapped.data);
      return unwrapped;
    } catch (error) {
      console.error(`❌ Failed to delete order ${orderId}:`, error);
      throw error.response?.data || error.message;
    }
  },
};

export default ordersAPI;