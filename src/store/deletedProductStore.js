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
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  },

  fetchDeletedProducts: async (userId, search = "", page = 1) => {
    console.log("🔄 fetchDeletedProducts called with page:", page, "search:", search);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.getDeleted(userId, search, page);
      console.log("📦 Raw API response:", response.data);
      
      let productsArray = [];
      let paginationData = {};
      
      // Handle different response structures
      if (response?.data?.data?.products) {
        // Structure: { data: { products: [...], current_page: 1, ... } }
        productsArray = response.data.data.products;
        paginationData = response.data.data;
      } else if (response?.data?.data?.data) {
        // Structure: { data: { data: [...], current_page: 1, ... } }
        productsArray = response.data.data.data;
        paginationData = response.data.data;
      } else if (response?.data?.products) {
        // Structure: { products: [...], current_page: 1, ... }
        productsArray = response.data.products;
        paginationData = response.data;
      } else if (response?.data?.data) {
        // Structure: { data: [...] }
        productsArray = Array.isArray(response.data.data) ? response.data.data : [];
        paginationData = response.data;
      } else if (response?.data) {
        // Structure: { ... }
        productsArray = Array.isArray(response.data) ? response.data : [];
        paginationData = {};
      }

      // Ensure productsArray is always an array
      if (!Array.isArray(productsArray)) {
        productsArray = [];
      }

      const pageData = {
        current_page: paginationData.current_page || page,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || 15,
        total: paginationData.total || productsArray.length,
      };

      console.log("✅ Products array:", productsArray.length);
      console.log("✅ Pagination:", pageData);

      set({
        deletedProducts: productsArray,
        totalDeletedProducts: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        loading: false,
        error: null,
      });

      return response;
    } catch (error) {
      console.error("❌ Failed to fetch deleted products:", error);
      set({
        deletedProducts: [],
        totalDeletedProducts: 0,
        loading: false,
        error: error.message || "Failed to fetch deleted products",
      });
    }
  },

  fetchDeletedProductsByUrl: async (url) => {
    if (!url) return;
    console.log("🔄 fetchDeletedProductsByUrl called with:", url);
    set({ loading: true, error: null });

    try {
      const response = await apiClient.get(url);
      console.log("📦 Raw URL response:", response.data);
      
      let productsArray = [];
      let paginationData = {};
      
      // Handle different response structures
      if (response?.data?.data?.products) {
        productsArray = response.data.data.products;
        paginationData = response.data.data;
      } else if (response?.data?.data?.data) {
        productsArray = response.data.data.data;
        paginationData = response.data.data;
      } else if (response?.data?.products) {
        productsArray = response.data.products;
        paginationData = response.data;
      } else if (response?.data?.data) {
        productsArray = Array.isArray(response.data.data) ? response.data.data : [];
        paginationData = response.data;
      } else if (response?.data) {
        productsArray = Array.isArray(response.data) ? response.data : [];
      }

      // Ensure productsArray is always an array
      if (!Array.isArray(productsArray)) {
        productsArray = [];
      }

      set({
        deletedProducts: productsArray,
        totalDeletedProducts: paginationData.total || productsArray.length,
        currentPage: paginationData.current_page || 1,
        lastPage: paginationData.last_page || 1,
        loading: false,
        error: null,
      });

      console.log("✅ Deleted products loaded from URL:", productsArray.length);
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
      const { fetchDeletedProducts } = state;
      await fetchDeletedProducts(state.currentUserId);
      
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
      const { fetchDeletedProducts } = state;
      await fetchDeletedProducts(state.currentUserId);
      
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
      const { fetchDeletedProducts } = state;
      await fetchDeletedProducts(state.currentUserId);
      
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

  clearError: () => set({ error: null }),
  
  // Add this to store userId for refresh operations
  setCurrentUserId: (userId) => set({ currentUserId: userId }),
}));

export default useDeletedProductStore;