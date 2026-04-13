import { create } from 'zustand';

export const useProductStore = create((set, get) => ({
  products: [],
  categories: [],
  selectedProduct: null,
  filters: {
    search: '',
    category: '',
    minPrice: null,
    maxPrice: null,
    inStock: null,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
  
  setProducts: (products) => set({ products }),
  appendProducts: (newProducts) => set((state) => ({
    products: [...state.products, ...newProducts],
  })),
  
  addProduct: (product) => set((state) => ({
    products: [product, ...state.products],
  })),
  
  setCategories: (categories) => set({ categories }),
  
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  
  clearFilters: () => set({
    filters: {
      search: '',
      category: '',
      minPrice: null,
      maxPrice: null,
      inStock: null,
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
  
  updateProduct: (productId, updates) => set((state) => ({
    products: state.products.map(product =>
      product.id === productId ? { ...product, ...updates } : product
    ),
    selectedProduct: state.selectedProduct?.id === productId
      ? { ...state.selectedProduct, ...updates }
      : state.selectedProduct,
  })),
  
  removeProduct: (productId) => set((state) => ({
    products: state.products.filter(product => product.id !== productId),
    selectedProduct: state.selectedProduct?.id === productId ? null : state.selectedProduct,
  })),
  
  reset: () => set({
    products: [],
    categories: [],
    selectedProduct: null,
    filters: {
      search: '',
      category: '',
      minPrice: null,
      maxPrice: null,
      inStock: null,
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      hasMore: true,
    },
  }),
}));
