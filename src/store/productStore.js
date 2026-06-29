// store/productStore.js - COMPLETE FIXED VERSION
import { create } from "zustand";
import { productsAPI } from "../api/products";

const useProductStore = create((set, get) => ({
  products: [],
  totalProducts: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 15,
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    next_page_url: null,
    prev_page_url: null,
    first_page_url: null,
    last_page_url: null,
  },
  filters: {
    search: "",
    category_id: null,
    brand_id: null,
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  },

  getProductTotalStock: (product) => {
    if (!product || !product.stocks || !Array.isArray(product.stocks)) return 0;
    return product.stocks.reduce((total, stock) => {
      const quantity = parseFloat(stock.quantity) || 0;
      return total + quantity;
    }, 0);
  },

  getProductStocks: (product) => {
    if (!product || !product.stocks || !Array.isArray(product.stocks))
      return [];
    return product.stocks;
  },

  fetchProducts: async (page = 1, forceRefresh = false) => {
    const { filters, perPage } = get();

    console.log('🔄 fetchProducts called with page:', page);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.getAll(
        filters.search,
        page,
        perPage
      );
      console.log('📦 Products API Response received');
      console.log('📦 Full response structure:', JSON.stringify(response.data, null, 2));

      // FIXED: Correctly extract products from the response
      const responseData = response.data;
      const paginationData = responseData.data || {};
      const products = paginationData.data || [];

      console.log('📦 responseData:', responseData);
      console.log('📦 paginationData:', paginationData);
      console.log('📦 Extracted products count:', products.length);

      const pagination = {
        current_page: paginationData.current_page || page,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || perPage,
        total: paginationData.total || products.length,
        next_page_url: paginationData.next_page_url || null,
        prev_page_url: paginationData.prev_page_url || null,
        first_page_url: paginationData.first_page_url || null,
        last_page_url: paginationData.last_page_url || null,
      };

      set({
        products: products,
        totalProducts: pagination.total,
        currentPage: pagination.current_page,
        lastPage: pagination.last_page,
        pagination: pagination,
        loading: false,
        error: null,
      });

      console.log('✅ Products loaded successfully, count:', products.length);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
      set({
        products: [],
        totalProducts: 0,
        currentPage: 1,
        lastPage: 1,
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: get().perPage,
          total: 0,
          next_page_url: null,
          prev_page_url: null,
          first_page_url: null,
          last_page_url: null,
        },
        loading: false,
        error: error.message || "Failed to fetch products",
      });
    }
  },

  fetchProductsByUrl: async (url) => {
    if (!url) {
      console.warn('fetchProductsByUrl called with null URL');
      return;
    }

    console.log('🔄 fetchProductsByUrl called with URL:', url);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.getByUrl(url);
      console.log('📦 Products by URL Response received');
      console.log('📦 Full response structure:', JSON.stringify(response.data, null, 2));

      const responseData = response.data;
      const paginationData = responseData.data || {};
      const products = paginationData.data || [];

      console.log('📦 responseData:', responseData);
      console.log('📦 paginationData:', paginationData);
      console.log(`✅ Products by URL extracted: ${products.length} products`);

      const pagination = {
        current_page: paginationData.current_page || 1,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || get().perPage,
        total: paginationData.total || products.length,
        next_page_url: paginationData.next_page_url || null,
        prev_page_url: paginationData.prev_page_url || null,
        first_page_url: paginationData.first_page_url || null,
        last_page_url: paginationData.last_page_url || null,
      };

      console.log('📊 Pagination data:', pagination);

      set({
        products: products,
        totalProducts: pagination.total,
        currentPage: pagination.current_page,
        lastPage: pagination.last_page,
        pagination: pagination,
        loading: false,
        error: null,
      });

      console.log(`✅ Products by URL loaded: ${products.length} products`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch products by URL:', error);
      set({
        loading: false,
        error: error.message || "Failed to fetch products",
      });
    }
  },

  getProduct: async (id) => {
    console.log('🔍 getProduct called with:', id);
    try {
      const response = await productsAPI.getById(id);
      let productData = null;

      if (response?.data?.data?.data) {
        productData = response.data.data.data;
      } else if (response?.data?.data) {
        productData = response.data.data;
      } else if (response?.data) {
        productData = response.data;
      } else {
        productData = response;
      }

      return productData;
    } catch (error) {
      console.error('❌ Failed to fetch product:', error);
      throw error;
    }
  },

  createProduct: async (productData) => {
    console.log('📝 createProduct called');
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.create(productData);
      console.log('✅ Product created successfully');

      let newProduct = null;
      if (response?.data?.data?.data) {
        newProduct = response.data.data.data;
      } else if (response?.data?.data) {
        newProduct = response.data.data;
      } else if (response?.data) {
        newProduct = response.data;
      } else {
        newProduct = response;
      }

      await get().fetchProducts(1, true);

      set({ loading: false });
      return { success: true, data: newProduct };
    } catch (error) {
      console.error('❌ Failed to create product:', error);
      set({
        error: error.message || "Failed to create product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  updateProduct: async (id, productData) => {
    console.log('✏️ updateProduct called');
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.update(id, productData);
      console.log('✅ Product updated successfully');

      let updatedProduct = null;
      if (response?.data?.data?.data) {
        updatedProduct = response.data.data.data;
      } else if (response?.data?.data) {
        updatedProduct = response.data.data;
      } else if (response?.data) {
        updatedProduct = response.data;
      } else {
        updatedProduct = response;
      }

      await get().fetchProducts(get().currentPage, true);

      set({ loading: false });
      return { success: true, data: updatedProduct };
    } catch (error) {
      console.error('❌ Failed to update product:', error);
      set({
        error: error.message || "Failed to update product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  deleteProduct: async (id) => {
    console.log('🗑️ deleteProduct called');
    set({ loading: true, error: null });

    try {
      await productsAPI.delete(id);
      console.log('✅ Product deleted successfully');

      await get().fetchProducts(get().currentPage, true);

      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete product:', error);
      set({
        error: error.message || "Failed to delete product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  bulkDeleteProducts: async (ids) => {
    console.log('📦 Bulk delete called');
    set({ loading: true, error: null });

    try {
      await productsAPI.bulkDelete(ids);
      console.log('✅ Products bulk deleted successfully');

      await get().fetchProducts(get().currentPage, true);

      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to bulk delete products:', error);
      set({
        error: error.message || "Failed to bulk delete products",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({
      filters: updatedFilters,
      currentPage: 1,
    });

    setTimeout(() => {
      get().fetchProducts(1, true);
    }, 300);
  },

  setPage: (page) => {
    const { lastPage, currentPage, pagination } = get();

    console.log('📄 setPage called with:', page, 'current:', currentPage, 'last:', lastPage);

    if (page < 1) page = 1;
    if (page > lastPage) page = lastPage;

    if (page !== currentPage) {
      console.log('📄 Changing page to:', page);
      
      set({ currentPage: page });

      let pageUrl = null;
      if (pagination) {
        if (page === 1 && pagination.first_page_url) {
          pageUrl = pagination.first_page_url;
        } else if (page === pagination.last_page && pagination.last_page_url) {
          pageUrl = pagination.last_page_url;
        } else if (pagination.first_page_url) {
          const baseUrl = pagination.first_page_url.split('?')[0];
          const searchParams = new URLSearchParams(
            pagination.first_page_url.split('?')[1] || ""
          );
          searchParams.set('page', page);
          pageUrl = `${baseUrl}?${searchParams.toString()}`;
        }
      }

      if (pageUrl) {
        get().fetchProductsByUrl(pageUrl);
      } else {
        get().fetchProducts(page, true);
      }
    }
  },

  clearError: () => set({ error: null }),
}));

// FIXED: Make sure this is a default export
export { useProductStore };
export default useProductStore;