// store/orderStore.js
import { create } from 'zustand';
import { ordersAPI } from '../api/orders';
import { getPaginatedData, getEntityData } from '../api/client';
import Toast from 'react-native-toast-message';

export const useOrderStore = create((set, get) => ({
  orders: [],
  selectedOrder: null,
  loading: false,
  loadingMore: false,
  hasMore: true,
  currentPage: 1,
  lastPage: 1,
  totalOrders: 0,
  pagination: null,
  filters: {
    search: '',
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
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

  // ✅ FIXED: Fetch orders
  fetchOrders: async (page = 1, userId, append = false) => {
    set({ loading: true });
    try {
      if (!userId) {
        throw new Error('User ID is required to fetch orders');
      }

      console.log(`📡 Fetching orders page ${page} for user ${userId}`);
      const response = await ordersAPI.getUserOrderHistory(userId, page);
      console.log('📦 Orders API response:', response);

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log('📊 Extracted paginated data:', paginatedData);

      // Extract orders array
      let ordersData = paginatedData.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(ordersData)) {
        ordersData = [];
      }

      console.log(`✅ Fetched ${ordersData.length} orders, page ${paginatedData.current_page}/${paginatedData.last_page}`);
      console.log(`📊 Total orders: ${paginatedData.total}, Has more: ${paginatedData.current_page < paginatedData.last_page}`);

      const hasMore = paginatedData.current_page < paginatedData.last_page;

      // Update state
      set((state) => ({
        orders: append ? [...state.orders, ...ordersData] : ordersData,
        currentPage: paginatedData.current_page || page,
        lastPage: paginatedData.last_page || 1,
        totalOrders: paginatedData.total || ordersData.length,
        hasMore: hasMore,
        pagination: paginatedData,
        loading: false,
        loadingMore: false,
      }));

      // Update stats only on initial load or refresh
      if (!append) {
        const allOrders = ordersData;
        const pendingOrders = allOrders.filter(order => order.order_status === 'pending').length;
        const processingOrders = allOrders.filter(order => order.order_status === 'processing').length;
        const completedOrders = allOrders.filter(order => order.order_status === 'completed').length;
        const totalRevenue = allOrders
          .filter(order => order.order_status === 'completed' && order.total_amount)
          .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        set({
          stats: {
            total: paginatedData.total || allOrders.length,
            pending: pendingOrders,
            processing: processingOrders,
            completed: completedOrders,
            revenue: totalRevenue,
          },
        });
      }

      return { success: true, data: ordersData, pagination: paginatedData };
      
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch orders',
      });
      set({ 
        loading: false, 
        loadingMore: false,
        hasMore: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Load more orders (infinite scroll)
  loadMoreOrders: async (userId) => {
    const { hasMore, loadingMore, loading, currentPage, lastPage } = get();
    
    console.log(`🔄 Load more: hasMore=${hasMore}, loadingMore=${loadingMore}, loading=${loading}, currentPage=${currentPage}, lastPage=${lastPage}`);
    
    // Prevent loading if already loading, no more orders, or reached last page
    if (loadingMore || loading || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    set({ loadingMore: true });
    const nextPage = currentPage + 1;
    console.log(`📡 Fetching next page: ${nextPage}`);

    try {
      const response = await ordersAPI.getUserOrderHistory(userId, nextPage);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log('📊 Load more paginated:', paginatedData);

      let ordersData = paginatedData.data || [];
      
      if (!Array.isArray(ordersData)) {
        ordersData = [];
      }

      console.log(`✅ Loaded ${ordersData.length} more orders, page ${paginatedData.current_page}/${paginatedData.last_page}`);
      console.log(`📊 Total orders: ${paginatedData.total}, Has more: ${paginatedData.current_page < paginatedData.last_page}`);

      const hasMore = paginatedData.current_page < paginatedData.last_page;

      set((state) => {
        // Create a Set of existing order IDs to avoid duplicates
        const existingIds = new Set(state.orders.map(o => o.id));
        const newOrders = ordersData.filter(o => !existingIds.has(o.id));
        
        return {
          orders: [...state.orders, ...newOrders],
          currentPage: paginatedData.current_page || nextPage,
          lastPage: paginatedData.last_page || 1,
          totalOrders: paginatedData.total || state.totalOrders,
          hasMore: hasMore,
          pagination: paginatedData,
          loadingMore: false,
        };
      });

      return { success: true, data: ordersData };
      
    } catch (error) {
      console.error('❌ Failed to load more orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load more orders',
      });
      set({ loadingMore: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Update order status
  updateOrderStatus: async (orderId, status) => {
    set({ loading: true });
    try {
      const response = await ordersAPI.updateOrderStatus(orderId, status);
      console.log('✅ Order status updated:', response);

      // ✅ Use helper to extract entity data
      const updatedOrder = getEntityData(response);
      console.log('📊 Extracted updated order:', updatedOrder);

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

      return { success: true, data: updatedOrder };
      
    } catch (error) {
      console.error('❌ Failed to update order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update order status',
      });
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Update payment status
  updatePaymentStatus: async (orderId, paymentStatus) => {
    set({ loading: true });
    try {
      const response = await ordersAPI.updatePaymentStatus(orderId, paymentStatus);
      console.log('✅ Payment status updated:', response);

      // ✅ Use helper to extract entity data
      const updatedOrder = getEntityData(response);
      console.log('📊 Extracted updated order:', updatedOrder);

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

      return { success: true, data: updatedOrder };
      
    } catch (error) {
      console.error('❌ Failed to update payment status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update payment status',
      });
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Update order payment
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
      console.log('✅ Payment updated:', response);

      // ✅ Use helper to extract entity data
      const updatedPayment = getEntityData(response);
      console.log('📊 Extracted payment update:', updatedPayment);

      if (willCompletePayment) {
        // Also update payment status to completed
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
        await get().fetchOrders(1, userId, false);
      }

      return { success: true, data: updatedPayment, willCompletePayment };
      
    } catch (error) {
      console.error('❌ Failed to update payment:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update payment',
      });
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Get order by ID
  getOrderById: async (orderId) => {
    set({ loading: true });
    try {
      const response = await ordersAPI.getOrderById(orderId);
      console.log('✅ Order fetched:', response);

      // ✅ Use helper to extract entity data
      const order = getEntityData(response);
      console.log('📊 Extracted order:', order);

      set({ 
        selectedOrder: order,
        loading: false 
      });

      return { success: true, data: order };
      
    } catch (error) {
      console.error('❌ Failed to fetch order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch order',
      });
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Create order
  createOrder: async (orderData) => {
    set({ loading: true });
    try {
      const response = await ordersAPI.createOrder(orderData);
      console.log('✅ Order created:', response);

      // ✅ Use helper to extract entity data
      const newOrder = getEntityData(response);
      console.log('📊 Extracted new order:', newOrder);

      if (newOrder && newOrder.id) {
        set((state) => ({
          orders: [newOrder, ...state.orders],
          totalOrders: state.totalOrders + 1,
          loading: false,
        }));
      } else {
        set({ loading: false });
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Order created successfully',
      });

      return { success: true, data: newOrder };
      
    } catch (error) {
      console.error('❌ Failed to create order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to create order',
      });
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Update order
  updateOrder: async (orderId, orderData) => {
    set({ loading: true });
    try {
      const response = await ordersAPI.updateOrder(orderId, orderData);
      console.log('✅ Order updated:', response);

      // ✅ Use helper to extract entity data
      const updatedOrder = getEntityData(response);
      console.log('📊 Extracted updated order:', updatedOrder);

      if (updatedOrder && updatedOrder.id) {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? updatedOrder : o
          ),
          selectedOrder: state.selectedOrder?.id === orderId
            ? updatedOrder
            : state.selectedOrder,
          loading: false,
        }));
      } else {
        set({ loading: false });
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Order updated successfully',
      });

      return { success: true, data: updatedOrder };
      
    } catch (error) {
      console.error('❌ Failed to update order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update order',
      });
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Delete order
  deleteOrder: async (orderId) => {
    set({ loading: true });
    try {
      await ordersAPI.deleteOrder(orderId);
      console.log('✅ Order deleted successfully');

      set((state) => ({
        orders: state.orders.filter((o) => o.id !== orderId),
        totalOrders: Math.max(0, state.totalOrders - 1),
        selectedOrder: state.selectedOrder?.id === orderId ? null : state.selectedOrder,
        loading: false,
      }));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Order deleted successfully',
      });

      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to delete order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to delete order',
      });
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  // ✅ Set filters with auto-fetch
  setFilters: (filters, userId) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      currentPage: 1,
      hasMore: true,
    }));
    
    if (userId) {
      // Debounced fetch
      setTimeout(() => {
        get().fetchOrders(1, userId, false);
      }, 300);
    }
  },

  // ✅ Clear filters
  clearFilters: () => {
    set({
      filters: {
        search: '',
        status: '',
        paymentStatus: '',
        dateFrom: '',
        dateTo: '',
      },
      currentPage: 1,
      hasMore: true,
    });
  },

  // ✅ Reset pagination
  resetPagination: () => set({
    currentPage: 1,
    lastPage: 1,
    hasMore: true,
    totalOrders: 0,
    pagination: null,
  }),

  // ✅ Set stats
  setStats: (stats) => set((state) => ({
    stats: { ...state.stats, ...stats },
  })),

  // ✅ Update single order
  updateOrder: (orderId, updates) => set((state) => ({
    orders: state.orders.map(order =>
      order.id === orderId ? { ...order, ...updates } : order
    ),
    selectedOrder: state.selectedOrder?.id === orderId
      ? { ...state.selectedOrder, ...updates }
      : state.selectedOrder,
  })),

  // ✅ Remove order
  removeOrder: (orderId) => set((state) => ({
    orders: state.orders.filter(order => order.id !== orderId),
    totalOrders: Math.max(0, state.totalOrders - 1),
    selectedOrder: state.selectedOrder?.id === orderId ? null : state.selectedOrder,
  })),

  // ✅ Add order
  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders],
    totalOrders: state.totalOrders + 1,
  })),

  // ✅ Set selected order
  setSelectedOrder: (order) => set({ selectedOrder: order }),

  // ✅ Reset store
  reset: () => set({
    orders: [],
    selectedOrder: null,
    loading: false,
    loadingMore: false,
    hasMore: true,
    currentPage: 1,
    lastPage: 1,
    totalOrders: 0,
    pagination: null,
    filters: {
      search: '',
      status: '',
      paymentStatus: '',
      dateFrom: '',
      dateTo: '',
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