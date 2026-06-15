// store/storeStore.js
import { create } from "zustand";
import { storesAPI } from "../api/stores";
import { useAuthStore } from "./authStore";

const useStoreStore = create((set, get) => ({
  stores: [],
  totalStores: 0,
  currentPage: 1,
  perPage: 15,
  loading: false,
  error: null,
  filters: {
    search: "",
  },

  // Fetch stores by user ID
  fetchStores: async (userId, page = 1, filters = {}) => {
    if (!userId) {
      console.error("No user ID provided");
      return;
    }

    console.log("🏪 fetchStores called with userId:", userId, "page:", page);
    set({ loading: true, error: null });

    try {
      const response = await storesAPI.getByUserId(userId, filters.search);
      console.log("📦 Stores API Response:", response);

      let storesArray = [];
      let paginationData = {};

      // Extract stores array from correct nested structure
      if (response?.data?.data?.data) {
        storesArray = response.data.data.data;
        paginationData = response.data.data;
      } else if (response?.data?.data) {
        storesArray = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        paginationData = response.data;
      } else if (response?.data) {
        storesArray = Array.isArray(response.data) ? response.data : [];
      }

      if (!Array.isArray(storesArray)) {
        storesArray = [];
      }

      const pageData = {
        current_page: paginationData.current_page || page,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || get().perPage,
        total: paginationData.total || storesArray.length,
      };

      set({
        stores: storesArray,
        totalStores: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        loading: false,
      });

      console.log("✅ Stores loaded:", storesArray.length);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch stores:", error);
      set({
        stores: [],
        totalStores: 0,
        loading: false,
        error: error.message || "Failed to fetch stores",
      });
    }
  },

  // Create store
  createStore: async (storeData) => {
    console.log("📝 createStore called with:", storeData);
    set({ loading: true, error: null });

    try {
      const response = await storesAPI.create(storeData);
      console.log("✅ Store created successfully", response.data);

      let newStore = null;
      if (response?.data?.data) {
        newStore = response.data.data;
      } else if (response?.data) {
        newStore = response.data;
      } else {
        newStore = response;
      }

      const { stores } = get();
      set({
        stores: [newStore, ...stores],
        totalStores: (stores?.length || 0) + 1,
        loading: false,
      });

      return { success: true, data: newStore };
    } catch (error) {
      console.error("❌ Failed to create store:", error);
      set({
        error: error.message || "Failed to create store",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Update store
  updateStore: async (id, storeData) => {
    console.log("✏️ updateStore called with:", id, storeData);
    set({ loading: true, error: null });

    try {
      const response = await storesAPI.update(id, storeData);
      console.log("✅ Store updated successfully", response.data);

      let updatedStore = null;
      if (response?.data?.data) {
        updatedStore = response.data.data;
      } else if (response?.data) {
        updatedStore = response.data;
      } else {
        updatedStore = response;
      }

      const { stores } = get();
      set({
        stores: stores.map(store => store.id === id ? updatedStore : store),
        loading: false,
      });

      return { success: true, data: updatedStore };
    } catch (error) {
      console.error("❌ Failed to update store:", error);
      set({
        error: error.message || "Failed to update store",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Delete store
  deleteStore: async (id) => {
    console.log("🗑️ deleteStore called with:", id);
    set({ loading: true, error: null });

    try {
      await storesAPI.delete(id);
      console.log("✅ Store deleted successfully");

      const { stores } = get();
      set({
        stores: stores.filter(store => store.id !== id),
        totalStores: Math.max(0, (stores?.length || 0) - 1),
        loading: false,
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Failed to delete store:", error);
      set({
        error: error.message || "Failed to delete store",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Get edit data
  getEditData: async (userId) => {
    console.log("🔍 getEditData called with userId:", userId);
    set({ loading: true, error: null });

    try {
      const response = await storesAPI.getEditData(userId);
      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch edit data:", error);
      set({
        error: error.message || "Failed to fetch edit data",
        loading: false,
      });
      throw error;
    }
  },

  // Set filters
  setFilters: (filters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...filters };
    set({ filters: updatedFilters });
  },

  // Set page
  setPage: (page) => {
    set({ currentPage: page });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useStoreStore;