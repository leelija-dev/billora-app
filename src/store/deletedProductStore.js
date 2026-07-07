// store/deletedProductStore.js - UPDATED for new client response
import { create } from "zustand";
import { productsAPI } from "../api/products";
import apiClient from "../api/client";

const useDeletedProductStore = create((set, get) => ({
  deletedProducts: [],
  totalDeletedProducts: 0,
  currentPage: 1,
  lastPage: 1,
  pageSize: 15,
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  currentUserId: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  },

  // Helper to extract data from response (since interceptor no longer unwraps)
  _extractDataFromResponse: (response) => {
    const responseData = response?.data || response;
    
    // If response has status and data structure
    if (responseData?.status === true && responseData?.data) {
      return responseData.data;
    }
    
    // If response has data property
    if (responseData?.data) {
      return responseData.data;
    }
    
    // If response is the data itself
    return responseData;
  },

  // Helper to extract array from response
  _extractArrayFromResponse: (response) => {
    const data = get()._extractDataFromResponse(response);
    
    // If data is an array
    if (Array.isArray(data)) {
      return data;
    }
    
    // If data has a data property that's an array (paginated)
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    // If data has a products property that's an array
    if (data?.products && Array.isArray(data.products)) {
      return data.products;
    }
    
    // If data is an object with array values
    if (data && typeof data === 'object') {
      for (const key in data) {
        if (Array.isArray(data[key])) {
          return data[key];
        }
      }
    }
    
    return [];
  },

  // Helper to extract pagination from response
  _extractPaginationFromResponse: (response, defaultPage = 1) => {
    const data = get()._extractDataFromResponse(response);
    
    return {
      current_page: data?.current_page || defaultPage,
      last_page: data?.last_page || 1,
      per_page: data?.per_page || 15,
      total: data?.total || 0,
      next_page_url: data?.next_page_url || null,
      prev_page_url: data?.prev_page_url || null,
      first_page_url: data?.first_page_url || null,
      last_page_url: data?.last_page_url || null,
      path: data?.path || null,
      from: data?.from || null,
      to: data?.to || null,
    };
  },

  fetchDeletedProducts: async (userId, search = "", page = 1, append = false) => {
    console.log("🔄 fetchDeletedProducts called with page:", page, "search:", search, "append:", append);
    
    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await productsAPI.getDeleted(userId, search, page);
      console.log("📦 Raw API response:", response.data);
      
      // ✅ Extract products array from response
      const productsArray = get()._extractArrayFromResponse(response);
      const paginationData = get()._extractPaginationFromResponse(response, page);

      console.log(`✅ Extracted ${productsArray.length} deleted products`);
      console.log("✅ Pagination:", paginationData);

      // If append is true and page > 1, append to existing products
      const { deletedProducts: existingProducts } = get();
      const finalProducts = append && page > 1 
        ? [...existingProducts, ...productsArray]
        : productsArray;

      const hasMoreData = paginationData.current_page < paginationData.last_page;

      set({
        deletedProducts: finalProducts,
        totalDeletedProducts: paginationData.total,
        currentPage: paginationData.current_page,
        lastPage: paginationData.last_page,
        pageSize: paginationData.per_page || 15,
        pagination: paginationData,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
        error: null,
        currentUserId: userId,
      });

      console.log(`✅ Deleted products loaded: ${finalProducts.length}, page ${paginationData.current_page}/${paginationData.last_page}, hasMore: ${hasMoreData}`);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch deleted products:", error);
      set({
        deletedProducts: [],
        totalDeletedProducts: 0,
        loading: false,
        loadingMore: false,
        error: error.message || "Failed to fetch deleted products",
      });
    }
  },

  // Load more deleted products (for infinite scroll)
  loadMoreDeletedProducts: async (userId, search = "") => {
    const { currentPage, lastPage, hasMore, loading, loadingMore } = get();
    
    if (loading || loadingMore || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    console.log(`📜 loadMoreDeletedProducts - currentPage: ${currentPage}, lastPage: ${lastPage}`);
    set({ loadingMore: true });

    try {
      const nextPage = currentPage + 1;
      await get().fetchDeletedProducts(userId, search, nextPage, true);
    } catch (error) {
      console.error('❌ Failed to load more deleted products:', error);
      set({ loadingMore: false });
    }
  },

  fetchDeletedProductsByUrl: async (url) => {
    if (!url) return;
    console.log("🔄 fetchDeletedProductsByUrl called with:", url);
    set({ loading: true, error: null });

    try {
      const response = await apiClient.get(url);
      console.log("📦 Raw URL response:", response.data);
      
      // ✅ Extract products array from response
      const productsArray = get()._extractArrayFromResponse(response);
      const paginationData = get()._extractPaginationFromResponse(response, 1);

      const hasMoreData = paginationData.current_page < paginationData.last_page;

      set({
        deletedProducts: productsArray,
        totalDeletedProducts: paginationData.total,
        currentPage: paginationData.current_page,
        lastPage: paginationData.last_page,
        pageSize: paginationData.per_page || 15,
        pagination: paginationData,
        hasMore: hasMoreData,
        loading: false,
        error: null,
      });

      console.log(`✅ Deleted products loaded from URL: ${productsArray.length}`);
    } catch (error) {
      console.error("❌ Failed to fetch deleted products by URL:", error);
      set({ loading: false, error: error.message });
    }
  },

  restoreProduct: async (id) => {
    console.log("🔄 restoreProduct called with:", id);
    set({ loading: true, error: null });

    try {
      await productsAPI.restore(id);
      console.log("✅ Product restored successfully");

      const state = get();
      await state.fetchDeletedProducts(state.currentUserId);
      
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to restore product:", error);
      set({
        error: error.message || "Failed to restore product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  forceDeleteProduct: async (id) => {
    console.log("💀 forceDeleteProduct called with:", id);
    set({ loading: true, error: null });

    try {
      await productsAPI.forceDelete(id);
      console.log("✅ Product permanently deleted");

      const state = get();
      await state.fetchDeletedProducts(state.currentUserId);
      
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to permanently delete product:", error);
      set({
        error: error.message || "Failed to permanently delete product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  bulkForceDeleteProducts: async (ids) => {
    console.log("💀 bulkForceDeleteProducts called with:", ids);
    set({ loading: true, error: null });

    try {
      await productsAPI.bulkForceDelete(ids);
      console.log("✅ Products bulk permanently deleted");

      const state = get();
      await state.fetchDeletedProducts(state.currentUserId);
      
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to bulk permanently delete products:", error);
      set({
        error: error.message || "Failed to bulk permanently delete products",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Set current user ID
  setCurrentUserId: (userId) => set({ currentUserId: userId }),

  // Reset to page 1
  resetToPageOne: async (userId, search = "") => {
    await get().fetchDeletedProducts(userId, search, 1, false);
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => {
    set({
      deletedProducts: [],
      totalDeletedProducts: 0,
      currentPage: 1,
      lastPage: 1,
      pageSize: 15,
      loading: false,
      loadingMore: false,
      hasMore: true,
      error: null,
      currentUserId: null,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
      },
    });
  },
}));

export default useDeletedProductStore;