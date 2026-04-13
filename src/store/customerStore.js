import { create } from 'zustand';

export const useCustomerStore = create((set, get) => ({
  customers: [],
  selectedCustomer: null,
  filters: {
    search: '',
    status: '',
    dateRange: null,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
  stats: {
    total: 0,
    active: 0,
    new: 0,
    totalRevenue: 0,
  },
  
  setCustomers: (customers) => set({ customers }),
  appendCustomers: (newCustomers) => set((state) => ({
    customers: [...state.customers, ...newCustomers],
  })),
  
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  
  clearFilters: () => set({
    filters: {
      search: '',
      status: '',
      dateRange: null,
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
  
  updateCustomer: (customerId, updates) => set((state) => ({
    customers: state.customers.map(customer =>
      customer.id === customerId ? { ...customer, ...updates } : customer
    ),
    selectedCustomer: state.selectedCustomer?.id === customerId
      ? { ...state.selectedCustomer, ...updates }
      : state.selectedCustomer,
  })),
  
  removeCustomer: (customerId) => set((state) => ({
    customers: state.customers.filter(customer => customer.id !== customerId),
    selectedCustomer: state.selectedCustomer?.id === customerId ? null : state.selectedCustomer,
  })),
  
  addCustomer: (customer) => set((state) => ({
    customers: [customer, ...state.customers],
    pagination: {
      ...state.pagination,
      total: state.pagination.total + 1,
    },
  })),
  
  reset: () => set({
    customers: [],
    selectedCustomer: null,
    filters: {
      search: '',
      status: '',
      dateRange: null,
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: true,
    },
    stats: {
      total: 0,
      active: 0,
      new: 0,
      totalRevenue: 0,
    },
  }),
}));
