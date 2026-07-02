// store/brandStore.js
import { create } from "zustand";
import { brandsAPI } from "../api/brands";

const useBrandStore = create((set, get) => ({
  brands: [],
  totalBrands: 0,
  loading: false,
  error: null,
  filters: {
    search: "",
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  },

  // Fetch brands
  fetchBrands: async () => {
    const { filters } = get();
    console.log("fetchBrands called with filters:", filters);
    set({ loading: true, error: null });

    try {
      const params = {};
      if (filters.search) params.search = filters.search;

      const response = await brandsAPI.getAll(params);
      console.log("API Response in store:", response);

      // Extract brands array from response structure
      let brandsArray = [];
      let paginatedData = response?.data || response;
      
      // Handle paginated response (after API client unwrapping)
      if (paginatedData?.data && Array.isArray(paginatedData.data)) {
        brandsArray = paginatedData.data;
      } else if (Array.isArray(paginatedData)) {
        brandsArray = paginatedData;
      } else if (paginatedData && typeof paginatedData === 'object') {
        brandsArray = [paginatedData];
      }

      console.log(`📦 Extracted ${brandsArray.length} brands`);

      // Apply status filter locally if needed
      let filteredBrands = brandsArray;
      if (filters.status !== "all") {
        const isActive = filters.status === "active";
        filteredBrands = brandsArray.filter(
          (b) => (b.is_active === true || b.is_active === 1) === isActive,
        );
      }

      // Apply sorting
      const { sortBy, sortOrder } = filters;
      filteredBrands.sort((a, b) => {
        let valA, valB;
        if (sortBy === "name") {
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
        } else if (sortBy === "date") {
          valA = new Date(a.updated_at || a.created_at || 0).getTime();
          valB = new Date(b.updated_at || b.created_at || 0).getTime();
        } else if (sortBy === "status") {
          valA = a.is_active === true || b.is_active === 1 ? 1 : 0;
          valB = b.is_active === true || b.is_active === 1 ? 1 : 0;
        } else {
          valA = a.id || 0;
          valB = b.id || 0;
        }

        if (sortOrder === "asc") {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });

      set({
        brands: filteredBrands,
        totalBrands: filteredBrands.length,
        loading: false,
      });

      console.log(`✅ Brands loaded successfully: ${filteredBrands.length} brands`);
      return response;
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      set({
        brands: [],
        totalBrands: 0,
        loading: false,
        error: error.message || "Failed to fetch brands",
      });
      // Don't throw error - let the UI handle the empty state
    }
  },
  getBrand: async (id) => {
    console.log("getBrand called with:", id);
    try {
      const response = await brandsAPI.getById(id);
      console.log("✅ Brand fetched successfully:", response);
      const brandData = response?.data || response;
      return brandData;
    } catch (error) {
      console.error("Failed to fetch brand:", error);
      throw error;
    }
  },

  // Create brand
  createBrand: async (brandData) => {
    console.log("createBrand called with:", brandData);
    set({ loading: true, error: null });

    try {
      const response = await brandsAPI.create(brandData);
      console.log("✅ Brand created successfully:", response);

      const newBrand = response?.data || response;

      // Refresh the list
      await get().fetchBrands();

      set({ loading: false });
      return newBrand;
    } catch (error) {
      console.error("Failed to create brand:", error);
      set({
        error: error.message || "Failed to create brand",
        loading: false,
      });
      throw error;
    }
  },

  // Update brand
  updateBrand: async (id, brandData) => {
    console.log("updateBrand called with:", id, brandData);
    set({ loading: true, error: null });

    try {
      const response = await brandsAPI.update(id, brandData);
      console.log("✅ Brand updated successfully:", response);

      // Refresh the list
      await get().fetchBrands();

      set({ loading: false });
      return response?.data || response;
    } catch (error) {
      console.error("Failed to update brand:", error);
      set({
        error: error.message || "Failed to update brand",
        loading: false,
      });
      throw error;
    }
  },

  // Delete brand
  deleteBrand: async (id) => {
    console.log("deleteBrand called with:", id);
    set({ loading: true, error: null });

    try {
      await brandsAPI.delete(id);
      console.log("✅ Brand deleted successfully");

      // Refresh the list
      await get().fetchBrands();

      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error("Failed to delete brand:", error);
      set({
        error: error.message || "Failed to delete brand",
        loading: false,
      });
      throw error;
    }
  },

  // Set filters
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });

    // Fetch brands with new filters
    setTimeout(() => {
      get().fetchBrands();
    }, 100);
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useBrandStore;
