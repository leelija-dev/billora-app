// store/storeStore.js
import { create } from "zustand";
import { storesAPI } from "../api/stores";
import { useAuthStore } from "./authStore";
import { getPaginatedData, getEntityData } from "../api/client";

const useStoreStore = create((set, get) => ({
  stores: [],
  totalStores: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 8,
  loading: false,
  error: null,
  pagination: null,
  filters: {
    search: "",
  },

  // ✅ Fetch stores with proper data extraction
  fetchStores: async (userId, page = 1, filters = {}, append = false) => {
    if (!userId) {
      console.error("❌ No user ID provided");
      return;
    }

    console.log("🏪 fetchStores called:", { userId, page, filters, append });
    set({ loading: true, error: null });

    try {
      const response = await storesAPI.getByUserId(userId, page, filters);
      console.log("📦 Raw API Response:", JSON.stringify(response, null, 2));

      const paginatedData = getPaginatedData(response);
      console.log("📊 Extracted paginated data:", paginatedData);

      const storesArray = paginatedData.data || [];
      const finalStores = Array.isArray(storesArray) ? storesArray : [];

      const pageData = {
        current_page: paginatedData.current_page || page,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || get().perPage,
        total: paginatedData.total || finalStores.length,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };

      const { stores: existingStores } = get();
      const finalStoresList = append && page > 1 
        ? [...existingStores, ...finalStores]
        : finalStores;

      set({
        stores: finalStoresList,
        totalStores: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        loading: false,
        error: null,
      });

      console.log(`✅ Loaded ${finalStoresList.length} stores (Page ${pageData.current_page}/${pageData.last_page})`);
      return { success: true, data: finalStoresList, pagination: pageData };
      
    } catch (error) {
      console.error("❌ Failed to fetch stores:", error);
      set({
        stores: append ? get().stores : [],
        totalStores: 0,
        currentPage: 1,
        lastPage: 1,
        pagination: null,
        loading: false,
        error: error.message || "Failed to fetch stores",
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Create store with proper data extraction
  createStore: async (storeData) => {
    console.log("📝 createStore called with:", storeData);
    set({ loading: true, error: null });

    try {
      const response = await storesAPI.create(storeData);
      console.log("📦 Raw create response:", JSON.stringify(response, null, 2));

      const newStore = getEntityData(response);
      console.log("📊 Extracted store:", newStore);

      if (!newStore) {
        throw new Error("No store data returned from API");
      }

      const { stores } = get();
      set({
        stores: [newStore, ...stores],
        totalStores: (stores?.length || 0) + 1,
        loading: false,
        error: null,
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

  // ✅ Update store with proper data extraction
  updateStore: async (id, storeData) => {
    console.log("✏️ updateStore called:", { id, storeData });
    set({ loading: true, error: null });

    try {
      const response = await storesAPI.update(id, storeData);
      console.log("📦 Raw update response:", JSON.stringify(response, null, 2));

      const updatedStore = getEntityData(response);
      console.log("📊 Extracted updated store:", updatedStore);

      if (!updatedStore) {
        throw new Error("No store data returned from API");
      }

      const { stores } = get();
      set({
        stores: stores.map(store => store.id === id ? updatedStore : store),
        loading: false,
        error: null,
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

  // ✅ Delete store
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
        error: null,
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

  // ✅ Get edit data
  getEditData: async (userId) => {
    console.log("🔍 getEditData called with userId:", userId);
    set({ loading: true, error: null });

    try {
      const response = await storesAPI.getEditData(userId);
      console.log("📦 Raw edit data response:", JSON.stringify(response, null, 2));

      const editData = getEntityData(response);
      console.log("📊 Extracted edit data:", editData);

      set({ loading: false, error: null });
      return { success: true, data: editData };
    } catch (error) {
      console.error("❌ Failed to fetch edit data:", error);
      set({
        error: error.message || "Failed to fetch edit data",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Set filters (with auto-fetch)
  setFilters: (filters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...filters };
    set({ filters: updatedFilters });
    
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      get().fetchStores(userId, 1, updatedFilters, false);
    }
  },

  // Set page (with auto-fetch)
  setPage: (page) => {
    set({ currentPage: page });
    const userId = useAuthStore.getState().user?.id;
    const { filters } = get();
    if (userId) {
      get().fetchStores(userId, page, filters, false);
    }
  },

  // Load next page (append for infinite scroll)
  loadNextPage: async () => {
    const { currentPage, lastPage, loading } = get();
    if (loading || currentPage >= lastPage) return;
    
    const userId = useAuthStore.getState().user?.id;
    const { filters } = get();
    if (userId) {
      await get().fetchStores(userId, currentPage + 1, filters, true);
    }
  },

  // Reset store state
  resetStores: () => {
    set({
      stores: [],
      totalStores: 0,
      currentPage: 1,
      lastPage: 1,
      pagination: null,
      loading: false,
      error: null,
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useStoreStore;