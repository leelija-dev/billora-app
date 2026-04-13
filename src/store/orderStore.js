import { create } from 'zustand';

export const useOrderStore = create((set, get) => ({
  orders: [],
  selectedOrder: null,
  filters: {
    search: '',
    status: '',
    dateRange: null,
    customer: '',
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
    completed: 0,
    cancelled: 0,
    revenue: 0,
  },
  
  setOrders: (orders) => set({ orders }),
  appendOrders: (newOrders) => set((state) => ({
    orders: [...state.orders, ...newOrders],
  })),
  
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  
  clearFilters: () => set({
    filters: {
      search: '',
      status: '',
      dateRange: null,
      customer: '',
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
    filters: {
      search: '',
      status: '',
      dateRange: null,
      customer: '',
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
      completed: 0,
      cancelled: 0,
      revenue: 0,
    },
  }),
}));
