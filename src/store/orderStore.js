import { create } from 'zustand';
import { ordersAPI } from '../api/orders';
import Toast from 'react-native-toast-message';

export const useOrderStore = create((set, get) => ({
  orders: [],
  selectedOrder: null,
  loading: false,
  filters: {
    search: '',
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
  stats: {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    revenue: 0,
  },
  currentUserId: null,

  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  fetchOrders: async (page = 1, userId) => {
    set({ loading: true });
    try {
      if (!userId) {
        throw new Error('User ID is required to fetch orders');
      }

      const response = await ordersAPI.getUserOrderHistory(userId);
      console.log('Orders API response:', response);

      const responseData = response.data || response;
      // Handle both wrapped response { status: true, data: [...] } and direct array [...]
      // The API returns { data: { data: [...], status: true, ... } }
      let ordersData = [];
      if (Array.isArray(responseData)) {
        ordersData = responseData;
      } else if (Array.isArray(responseData?.data)) {
        ordersData = responseData.data;
      } else if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        ordersData = responseData.data.data;
      }
      const totalCount = ordersData.length;

      if (ordersData.length > 0 || responseData?.status === true) {

        set({
          orders: ordersData,
          pagination: {
            page,
            limit: 20,
            total: totalCount,
            hasMore: false,
          },
          loading: false,
        });

        // Update stats
        const pendingOrders = ordersData.filter(order => order.order_status === 'pending').length;
        const processingOrders = ordersData.filter(order => order.order_status === 'processing').length;
        const completedOrders = ordersData.filter(order => order.order_status === 'completed').length;
        const totalRevenue = ordersData
          .filter(order => order.order_status === 'completed' && order.total_amount)
          .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        set({
          stats: {
            total: ordersData.length,
            pending: pendingOrders,
            processing: processingOrders,
            completed: completedOrders,
            revenue: totalRevenue,
          },
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: responseData?.message || 'Failed to fetch orders',
        });
        set({
          orders: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            hasMore: false,
          },
          loading: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch orders',
      });
      set({
        orders: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          hasMore: false,
        },
        loading: false,
      });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    set({ loading: true });
    try {
      const response = await ordersAPI.updateOrderStatus(orderId, status);

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, order_status: status } : o
        ),
        selectedOrder: state.selectedOrder?.id === orderId
          ? { ...state.selectedOrder, order_status: status }
          : state.selectedOrder,
        loading: false,
      }));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Order status updated successfully',
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update order status',
      });
      set({ loading: false });
      return { success: false };
    }
  },

  updatePaymentStatus: async (orderId, paymentStatus) => {
    set({ loading: true });
    try {
      const response = await ordersAPI.updatePaymentStatus(orderId, paymentStatus);

      set((state) => ({
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, payment_status: paymentStatus } : o
        ),
        selectedOrder: state.selectedOrder?.id === orderId
          ? { ...state.selectedOrder, payment_status: paymentStatus }
          : state.selectedOrder,
        loading: false,
      }));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Payment status updated successfully',
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update payment status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update payment status',
      });
      set({ loading: false });
      return { success: false };
    }
  },

  updateOrderPayment: async (orderId, userId, paidAmount) => {
    set({ loading: true });
    try {
      const currentOrder = get().orders.find(o => o.id === orderId);
      if (!currentOrder) {
        throw new Error('Order not found');
      }

      const currentPaid = parseFloat(currentOrder.paid_amount || 0);
      const totalAmount = parseFloat(currentOrder.total_amount || 0);
      const currentDue = totalAmount - currentPaid;
      const newPaidAmount = parseFloat(paidAmount);

      const willCompletePayment = newPaidAmount >= currentDue;

      const response = await ordersAPI.updateOrderPayment(orderId, userId, paidAmount);

      if (willCompletePayment) {
        await ordersAPI.updatePaymentStatus(orderId, 'completed');

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  paid_amount: (currentPaid + newPaidAmount).toString(),
                  payment_status: 'completed'
                }
              : o
          ),
          selectedOrder: state.selectedOrder?.id === orderId
            ? {
                ...state.selectedOrder,
                paid_amount: (currentPaid + newPaidAmount).toString(),
                payment_status: 'completed'
              }
            : state.selectedOrder,
          loading: false,
        }));

        Toast.show({
          type: 'success',
          text1: 'Payment Complete',
          text2: `Payment of ₹${paidAmount} received. Order is now fully paid!`,
        });
      } else {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  paid_amount: (currentPaid + newPaidAmount).toString()
                }
              : o
          ),
          selectedOrder: state.selectedOrder?.id === orderId
            ? {
                ...state.selectedOrder,
                paid_amount: (currentPaid + newPaidAmount).toString()
              }
            : state.selectedOrder,
          loading: false,
        }));

        const newDue = totalAmount - (currentPaid + newPaidAmount);
        Toast.show({
          type: 'success',
          text1: 'Payment Recorded',
          text2: `Payment of ₹${paidAmount} recorded. Remaining due: ₹${newDue.toFixed(2)}`,
        });
      }

      // Refresh orders to get updated data
      if (userId) {
        await get().fetchOrders(1, userId);
      }

      return { success: true, data: response.data, willCompletePayment };
    } catch (error) {
      console.error('Failed to update payment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update payment',
      });
      set({ loading: false });
      return { success: false };
    }
  },

  setOrders: (orders) => set({ orders }),
  appendOrders: (newOrders) => set((state) => ({
    orders: [...state.orders, ...newOrders],
  })),

  setSelectedOrder: (order) => set({ selectedOrder: order }),

  setFilters: (filters, userId) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
    if (userId) {
      get().fetchOrders(1, userId);
    }
  },

  clearFilters: () => set({
    filters: {
      search: '',
      status: '',
      paymentStatus: '',
      dateFrom: '',
      dateTo: '',
    },
  }),

  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination },
  })),

  resetPagination: () => set({
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: true,
    },
  }),

  setStats: (stats) => set((state) => ({
    stats: { ...state.stats, ...stats },
  })),

  updateOrder: (orderId, updates) => set((state) => ({
    orders: state.orders.map(order =>
      order.id === orderId ? { ...order, ...updates } : order
    ),
    selectedOrder: state.selectedOrder?.id === orderId
      ? { ...state.selectedOrder, ...updates }
      : state.selectedOrder,
  })),

  removeOrder: (orderId) => set((state) => ({
    orders: state.orders.filter(order => order.id !== orderId),
    selectedOrder: state.selectedOrder?.id === orderId ? null : state.selectedOrder,
  })),

  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders],
    pagination: {
      ...state.pagination,
      total: state.pagination.total + 1,
    },
  })),

  reset: () => set({
    orders: [],
    selectedOrder: null,
    loading: false,
    filters: {
      search: '',
      status: '',
      paymentStatus: '',
      dateFrom: '',
      dateTo: '',
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: true,
    },
    stats: {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      revenue: 0,
    },
    currentUserId: null,
  }),
}));
