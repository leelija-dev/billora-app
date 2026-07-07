// store/brandStore.js
import { create } from "zustand";
import { brandsAPI } from "../api/brands";
import { getEntityData, getPaginatedData } from "../api/client";

const useBrandStore = create((set, get) => ({
  brands: [],
  totalBrands: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 8,
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  pagination: null,
  filters: {
    search: "",
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  },

  // ✅ Fetch brands with pagination
  fetchBrands: async (page = 1, append = false) => {
    const { filters, perPage, brands: existingBrands } = get();
    console.log("🔄 fetchBrands called:", { page, append, filters });

    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const params = { page, per_page: perPage };
      if (filters.search) params.search = filters.search;
      if (filters.status !== "all") {
        params.status = filters.status;
      }

      const response = await brandsAPI.getAll(params);
      console.log("📦 API Response in store:", response);

      const paginatedData = getPaginatedData(response);
      console.log("📊 Extracted paginated data:", paginatedData);

      let brandsArray = paginatedData.data || [];
      
      if (!Array.isArray(brandsArray)) {
        brandsArray = [];
      }

      console.log(`📦 Extracted ${brandsArray.length} brands`);

      // ✅ Apply sorting
      const { sortBy, sortOrder } = filters;
      const sortedBrands = [...brandsArray].sort((a, b) => {
        let valA, valB;
        if (sortBy === "name") {
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
        } else if (sortBy === "date") {
          valA = new Date(a.updated_at || a.created_at || 0).getTime();
          valB = new Date(b.updated_at || b.created_at || 0).getTime();
        } else if (sortBy === "status") {
          valA = a.is_active === true || a.is_active === 1 ? 1 : 0;
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

      const currentPageFromResponse = paginatedData.current_page || page;
      const lastPageFromResponse = paginatedData.last_page || 1;
      const totalFromResponse = paginatedData.total || sortedBrands.length;

      // ✅ Handle append mode
      let finalBrands;
      if (append && page > 1) {
        const existingIds = new Set(existingBrands.map(b => b.id));
        const uniqueNewBrands = sortedBrands.filter(b => !existingIds.has(b.id));
        finalBrands = [...existingBrands, ...uniqueNewBrands];
        console.log(`📦 Appended ${uniqueNewBrands.length} new brands, total: ${finalBrands.length}`);
      } else {
        finalBrands = sortedBrands;
      }

      const hasMoreData = finalBrands.length < totalFromResponse;

      set({
        brands: finalBrands,
        totalBrands: totalFromResponse,
        currentPage: currentPageFromResponse,
        lastPage: lastPageFromResponse,
        perPage: paginatedData.per_page || perPage,
        pagination: paginatedData,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Brands loaded: ${finalBrands.length}, page ${currentPageFromResponse}/${lastPageFromResponse}, hasMore: ${hasMoreData}`);
      return { success: true, data: finalBrands, pagination: paginatedData };
      
    } catch (error) {
      console.error("❌ Failed to fetch brands:", error);
      set({
        brands: append ? get().brands : [],
        totalBrands: append ? get().totalBrands : 0,
        currentPage: 1,
        lastPage: 1,
        pagination: null,
        hasMore: false,
        loading: false,
        loadingMore: false,
        error: error.message || "Failed to fetch brands",
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Load more brands
  loadMoreBrands: async () => {
    const { 
      hasMore, 
      loadingMore, 
      loading, 
      currentPage, 
      lastPage, 
      filters,
      brands,
      totalBrands
    } = get();
    
    console.log(`🔄 Load more: hasMore=${hasMore}, loadingMore=${loadingMore}, loading=${loading}, currentPage=${currentPage}, lastPage=${lastPage}, brands.length=${brands.length}, totalBrands=${totalBrands}`);
    
    const hasMoreData = brands.length < totalBrands;
    
    if (loadingMore || loading || !hasMoreData || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    set({ loadingMore: true });
    const nextPage = currentPage + 1;
    console.log(`📡 Fetching next page: ${nextPage}`);

    try {
      const params = { page: nextPage, per_page: get().perPage };
      if (filters.search) params.search = filters.search;
      if (filters.status !== "all") {
        params.status = filters.status;
      }

      const response = await brandsAPI.getAll(params);
      
      const paginatedData = getPaginatedData(response);
      console.log("📊 Load more paginated:", paginatedData);

      let brandsArray = paginatedData.data || [];
      
      if (!Array.isArray(brandsArray)) {
        brandsArray = [];
      }

      const { sortBy, sortOrder } = filters;
      const sortedBrands = [...brandsArray].sort((a, b) => {
        let valA, valB;
        if (sortBy === "name") {
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
        } else if (sortBy === "date") {
          valA = new Date(a.updated_at || a.created_at || 0).getTime();
          valB = new Date(b.updated_at || b.created_at || 0).getTime();
        } else if (sortBy === "status") {
          valA = a.is_active === true || a.is_active === 1 ? 1 : 0;
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

      const { brands: existingBrands, totalBrands: existingTotal } = get();
      
      const existingIds = new Set(existingBrands.map(b => b.id));
      const uniqueNewBrands = sortedBrands.filter(b => !existingIds.has(b.id));
      
      const newTotal = paginatedData.total || existingTotal;
      const newBrands = [...existingBrands, ...uniqueNewBrands];
      const hasMoreData = newBrands.length < newTotal;

      console.log(`📊 uniqueNewBrands: ${uniqueNewBrands.length}, newBrands.length: ${newBrands.length}, newTotal: ${newTotal}, hasMoreData: ${hasMoreData}`);

      const responseCurrentPage = paginatedData.current_page || nextPage;
      const responseLastPage = paginatedData.last_page || Math.ceil(newTotal / (paginatedData.per_page || get().perPage));

      set({
        brands: newBrands,
        totalBrands: newTotal,
        currentPage: responseCurrentPage,
        lastPage: responseLastPage,
        perPage: paginatedData.per_page || get().perPage,
        pagination: paginatedData,
        hasMore: hasMoreData,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Load more completed: ${uniqueNewBrands.length} new brands, total: ${get().brands.length}, hasMore: ${hasMoreData}`);
      return { success: true, data: uniqueNewBrands };
      
    } catch (error) {
      console.error("❌ Failed to load more brands:", error);
      set({ 
        loadingMore: false, 
        error: error.message || "Failed to load more brands" 
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Get single brand
  getBrand: async (id) => {
    console.log("🔍 getBrand called with:", id);
    try {
      const response = await brandsAPI.getById(id);
      console.log("📦 getBrand response:", response);
      
      const brand = getEntityData(response);
      console.log("📊 Extracted brand:", brand);
      
      return { success: true, data: brand };
    } catch (error) {
      console.error("❌ Failed to fetch brand:", error);
      return { success: false, error: error.message };
    }
  },

  // ✅ Create brand
  createBrand: async (brandData) => {
    console.log("📝 createBrand called with:", brandData);
    set({ loading: true, error: null });

    try {
      const response = await brandsAPI.create(brandData);
      console.log("✅ Brand created successfully:", response);

      const newBrand = getEntityData(response);
      console.log("📊 Extracted new brand:", newBrand);

      if (newBrand && newBrand.id) {
        const { brands, totalBrands } = get();
        set({
          brands: [newBrand, ...brands],
          totalBrands: totalBrands + 1,
          loading: false,
          error: null,
        });
      }

      set({ loading: false });
      return { success: true, data: newBrand };
      
    } catch (error) {
      console.error("❌ Failed to create brand:", error);
      set({
        error: error.message || "Failed to create brand",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Update brand
  updateBrand: async (id, brandData) => {
    console.log("✏️ updateBrand called:", { id, brandData });
    set({ loading: true, error: null });

    try {
      const response = await brandsAPI.update(id, brandData);
      console.log("✅ Brand updated successfully:", response);

      const updatedBrand = getEntityData(response);
      console.log("📊 Extracted updated brand:", updatedBrand);

      if (updatedBrand && updatedBrand.id) {
        const { brands } = get();
        set({
          brands: brands.map(brand => brand.id === id ? updatedBrand : brand),
          loading: false,
          error: null,
        });
      }

      set({ loading: false });
      return { success: true, data: updatedBrand };
      
    } catch (error) {
      console.error("❌ Failed to update brand:", error);
      set({
        error: error.message || "Failed to update brand",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Delete brand
  deleteBrand: async (id) => {
    console.log("🗑️ deleteBrand called with:", id);
    set({ loading: true, error: null });

    try {
      await brandsAPI.delete(id);
      console.log("✅ Brand deleted successfully");

      const { brands, totalBrands } = get();
      set({
        brands: brands.filter(brand => brand.id !== id),
        totalBrands: Math.max(0, totalBrands - 1),
        loading: false,
        error: null,
      });

      return { success: true };
      
    } catch (error) {
      console.error("❌ Failed to delete brand:", error);
      set({
        error: error.message || "Failed to delete brand",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Set filters with auto-fetch (reset to page 1)
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ 
      filters: updatedFilters,
      currentPage: 1,
      hasMore: true,
      brands: [],
      totalBrands: 0,
    });

    setTimeout(() => {
      get().fetchBrands(1, false);
    }, 300);
  },

  // ✅ Reset state
  resetBrands: () => {
    set({
      brands: [],
      totalBrands: 0,
      currentPage: 1,
      lastPage: 1,
      perPage: 8,
      loading: false,
      loadingMore: false,
      hasMore: true,
      error: null,
      pagination: null,
      filters: {
        search: "",
        status: "all",
        sortBy: "name",
        sortOrder: "asc",
      },
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useBrandStore;