import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // Loading states
  loading: {
    global: false,
    products: false,
    orders: false,
    customers: false,
    inventory: false,
    dashboard: false,
  },
  
  // Error states
  errors: {
    global: null,
    products: null,
    orders: null,
    customers: null,
    inventory: null,
    dashboard: null,
  },
  
  // UI states
  sidebarOpen: false,
  searchOpen: false,
  filtersOpen: false,
  
  // Notifications
  notifications: [],
  
  // Loading actions
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value },
  })),
  
  setGlobalLoading: (value) => set((state) => ({
    loading: { ...state.loading, global: value },
  })),
  
  // Error actions
  setError: (key, error) => set((state) => ({
    errors: { ...state.errors, [key]: error },
  })),
  
  clearError: (key) => set((state) => ({
    errors: { ...state.errors, [key]: null },
  })),
  
  clearAllErrors: () => set({
    errors: {
      global: null,
      products: null,
      orders: null,
      customers: null,
      inventory: null,
      dashboard: null,
    },
  }),
  
  // UI state actions
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  
  setFiltersOpen: (open) => set({ filtersOpen: open }),
  toggleFilters: () => set((state) => ({ filtersOpen: !state.filtersOpen })),
  
  // Notification actions
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        id: Date.now().toString(),
        timestamp: new Date(),
        ...notification,
      },
      ...state.notifications,
    ].slice(0, 10), // Keep only last 10 notifications
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  // Convenience methods
  showSuccess: (message, title = 'Success') => set((state) => ({
    notifications: [
      {
        id: Date.now().toString(),
        type: 'success',
        title,
        message,
        timestamp: new Date(),
      },
      ...state.notifications,
    ].slice(0, 10),
  })),
  
  showError: (message, title = 'Error') => set((state) => ({
    notifications: [
      {
        id: Date.now().toString(),
        type: 'error',
        title,
        message,
        timestamp: new Date(),
      },
      ...state.notifications,
    ].slice(0, 10),
  })),
  
  showWarning: (message, title = 'Warning') => set((state) => ({
    notifications: [
      {
        id: Date.now().toString(),
        type: 'warning',
        title,
        message,
        timestamp: new Date(),
      },
      ...state.notifications,
    ].slice(0, 10),
  })),
  
  showInfo: (message, title = 'Info') => set((state) => ({
    notifications: [
      {
        id: Date.now().toString(),
        type: 'info',
        title,
        message,
        timestamp: new Date(),
      },
      ...state.notifications,
    ].slice(0, 10),
  })),
  
  // Reset
  reset: () => set({
    loading: {
      global: false,
      products: false,
      orders: false,
      customers: false,
      inventory: false,
      dashboard: false,
    },
    errors: {
      global: null,
      products: null,
      orders: null,
      customers: null,
      inventory: null,
      dashboard: null,
    },
    sidebarOpen: false,
    searchOpen: false,
    filtersOpen: false,
    notifications: [],
  }),
}));
