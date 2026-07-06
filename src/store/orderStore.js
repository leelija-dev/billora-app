import { create } from 'zustand';
import { ordersAPI } from '../api/orders';
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
  filters: {
    search: '',
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
  },
  pagination: {
    page: 1,
    limit: 8,
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

  fetchOrders: async (page = 1, userId, append = false) => {
    set({ loading: true });
    try {
      if (!userId) {
        throw new Error('User ID is required to fetch orders');
      }

      console.log(`📡 Fetching orders page ${page} for user ${userId}`);
      const response = await ordersAPI.getUserOrderHistory(userId, page);
      console.log('📦 Orders API response:', response);

      const responseData = response.data || response;
      
      // Parse the paginated response - handle the nested structure
      let ordersData = [];
      let paginationInfo = {
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 8,
        nextPageUrl: null,
      };

      // The API returns: { data: { status: true, data: { current_page, data: [...], last_page, ... } } }
      // OR directly: { data: { current_page, data: [...], last_page, ... } }
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        // Nested structure: response.data.data.data
        ordersData = responseData.data.data;
        paginationInfo = {
          currentPage: responseData.data.current_page || 1,
          lastPage: responseData.data.last_page || 1,
          total: responseData.data.total || 0,
          perPage: responseData.data.per_page || 8,
          nextPageUrl: responseData.data.next_page_url || null,
        };
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        // response.data.data is the array
        ordersData = responseData.data;
        // Check if there's pagination info at the root level
        paginationInfo = {
          currentPage: responseData.current_page || 1,
          lastPage: responseData.last_page || 1,
          total: responseData.total || ordersData.length,
          perPage: responseData.per_page || 8,
          nextPageUrl: responseData.next_page_url || null,
        };
      } else if (Array.isArray(responseData)) {
        ordersData = responseData;
      }

      console.log(`✅ Fetched ${ordersData.length} orders, page ${paginationInfo.currentPage}/${paginationInfo.lastPage}`);
      console.log(`📊 Total orders: ${paginationInfo.total}, Has more: ${paginationInfo.currentPage < paginationInfo.lastPage}`);

      const hasMore = paginationInfo.currentPage < paginationInfo.lastPage;

      // Update state
      set((state) => ({
        orders: append ? [...state.orders, ...ordersData] : ordersData,
        currentPage: paginationInfo.currentPage,
        lastPage: paginationInfo.lastPage,
        totalOrders: paginationInfo.total,
        hasMore: hasMore,
        pagination: {
          page: paginationInfo.currentPage,
          limit: paginationInfo.perPage || 8,
          total: paginationInfo.total,
          hasMore: hasMore,
        },
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
            total: paginationInfo.total || allOrders.length,
            pending: pendingOrders,
            processing: processingOrders,
            completed: completedOrders,
            revenue: totalRevenue,
          },
        });
      }

      return { success: true, data: ordersData, pagination: paginationInfo };
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
      return { success: false };
    }
  },

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
      
      const responseData = response.data || response;
      let ordersData = [];
      let paginationInfo = {
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 8,
        nextPageUrl: null,
      };

      // Parse the paginated response - handle the nested structure
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        ordersData = responseData.data.data;
        paginationInfo = {
          currentPage: responseData.data.current_page || 1,
          lastPage: responseData.data.last_page || 1,
          total: responseData.data.total || 0,
          perPage: responseData.data.per_page || 8,
          nextPageUrl: responseData.data.next_page_url || null,
        };
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        ordersData = responseData.data;
        paginationInfo = {
          currentPage: responseData.current_page || 1,
          lastPage: responseData.last_page || 1,
          total: responseData.total || ordersData.length,
          perPage: responseData.per_page || 8,
          nextPageUrl: responseData.next_page_url || null,
        };
      } else if (Array.isArray(responseData)) {
        ordersData = responseData;
      }

      console.log(`✅ Loaded ${ordersData.length} more orders, page ${paginationInfo.currentPage}/${paginationInfo.lastPage}`);
      console.log(`📊 Total orders: ${paginationInfo.total}, Has more: ${paginationInfo.currentPage < paginationInfo.lastPage}`);

      const hasMore = paginationInfo.currentPage < paginationInfo.lastPage;

      set((state) => {
        // Create a Set of existing order IDs to avoid duplicates
        const existingIds = new Set(state.orders.map(o => o.id));
        const newOrders = ordersData.filter(o => !existingIds.has(o.id));
        
        return {
          orders: [...state.orders, ...newOrders],
          currentPage: paginationInfo.currentPage,
          lastPage: paginationInfo.lastPage,
          totalOrders: paginationInfo.total,
          hasMore: hasMore,
          pagination: {
            page: paginationInfo.currentPage,
            limit: paginationInfo.per_page || 8,
            total: paginationInfo.total,
            hasMore: hasMore,
          },
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
      return { success: false };
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
        await get().fetchOrders(1, userId, false);
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
      get().fetchOrders(1, userId, false);
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
    currentPage: 1,
    lastPage: 1,
    hasMore: true,
    totalOrders: 0,
    pagination: {
      page: 1,
      limit: 8,
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
    loadingMore: false,
    hasMore: true,
    currentPage: 1,
    lastPage: 1,
    totalOrders: 0,
    filters: {
      search: '',
      status: '',
      paymentStatus: '',
      dateFrom: '',
      dateTo: '',
    },
    pagination: {
      page: 1,
      limit: 8,
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