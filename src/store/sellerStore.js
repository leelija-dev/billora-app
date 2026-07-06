// store/sellerStore.js
import { create } from "zustand";
import { sellersAPI } from "../api/sellers";
import { useAuthStore } from "./authStore";

const useSellerStore = create((set, get) => ({
  sellers: [],
  totalSellers: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 8,
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  filters: {
    search: "",
  },

  // Fetch sellers by user ID with pagination
  fetchSellers: async (userId, page = 1, search = "", append = false) => {
    if (!userId) {
      console.error("No user ID provided");
      return;
    }

    console.log("👥 fetchSellers called with userId:", userId, "page:", page, "search:", search, "append:", append);
    
    // If not appending, set loading; if appending, use loadingMore
    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await sellersAPI.getByUserId(userId, page, search);
      console.log("📦 Sellers API Response:", response);

      let sellersArray = [];
      let paginationData = {};

      // Extract sellers array from correct nested structure
      // The API returns: { status: true, data: { message, sellers: { current_page, data: [...] } } }
      // After interceptor unwrapping: { message, sellers: { current_page, data: [...] } }
      if (response?.data?.sellers?.data) {
        sellersArray = response.data.sellers.data;
        paginationData = response.data.sellers;
        console.log("✅ Extracted from response.data.sellers");
      } else if (response?.sellers?.data) {
        sellersArray = response.sellers.data;
        paginationData = response.sellers;
        console.log("✅ Extracted from response.sellers");
      } else if (response?.data?.data?.data) {
        sellersArray = response.data.data.data;
        paginationData = response.data.data;
        console.log("✅ Extracted from response.data.data");
      } else if (response?.data?.data) {
        sellersArray = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        paginationData = response.data;
        console.log("✅ Extracted from response.data (array)");
      } else if (response?.data) {
        sellersArray = Array.isArray(response.data) ? response.data : [];
        paginationData = response;
        console.log("✅ Extracted from response (array)");
      } else if (Array.isArray(response)) {
        sellersArray = response;
        console.log("✅ Extracted from response (direct array)");
      }

      console.log("🔍 Sellers array length:", sellersArray.length);
      console.log("🔍 Pagination data:", paginationData);

      if (!Array.isArray(sellersArray)) {
        sellersArray = [];
      }

      const pageData = {
        current_page: paginationData.current_page || page,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || get().perPage,
        total: paginationData.total || sellersArray.length,
        next_page_url: paginationData.next_page_url || null,
        prev_page_url: paginationData.prev_page_url || null,
        first_page_url: paginationData.first_page_url || null,
        last_page_url: paginationData.last_page_url || null,
      };

      const hasMoreData = pageData.current_page < pageData.last_page;

      // If append is true and page > 1, append to existing sellers (with duplicate prevention)
      const { sellers: existingSellers } = get();
      let finalSellers;
      if (append && page > 1) {
        const existingIds = new Set(existingSellers.map(s => s.id));
        const uniqueNewSellers = sellersArray.filter(s => !existingIds.has(s.id));
        finalSellers = [...existingSellers, ...uniqueNewSellers];
        console.log(`📦 Appended ${uniqueNewSellers.length} new sellers, total: ${finalSellers.length}`);
      } else {
        finalSellers = sellersArray;
      }

      set({
        sellers: finalSellers,
        totalSellers: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
      });

      console.log("✅ Sellers loaded:", finalSellers.length, "Page:", pageData.current_page, "of", pageData.last_page, "hasMore:", hasMoreData);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch sellers:", error);
      set({
        sellers: append ? get().sellers : [],
        totalSellers: append ? get().totalSellers : 0,
        currentPage: 1,
        lastPage: 1,
        pagination: null,
        hasMore: false,
        loading: false,
        loadingMore: false,
        error: error.message || "Failed to fetch sellers",
      });
    }
  },

  // Load more sellers for pagination
  loadMoreSellers: async (userId) => {
    const { currentPage, lastPage, hasMore, loading, loadingMore, filters, sellers: existingSellers } = get();

    // Prevent loading if already loading or no more data
    if (loading || loadingMore || !hasMore) {
      console.log('⏭️ Skipping load more - already loading or no more data');
      return;
    }

    if (currentPage >= lastPage) {
      console.log('⏭️ Skipping - reached last page');
      return;
    }

    console.log(`🔄 loadMoreSellers called with userId: ${userId}, currentPage: ${currentPage}`);
    set({ loadingMore: true, error: null });

    try {
      const nextPage = currentPage + 1;
      const response = await sellersAPI.getByUserId(userId, nextPage, filters.search);
      console.log("📦 Sellers API Response received for page:", nextPage);

      let sellersArray = [];
      let paginationData = {};

      // Extract sellers array from correct nested structure
      if (response?.data?.sellers?.data) {
        sellersArray = response.data.sellers.data;
        paginationData = response.data.sellers;
        console.log("✅ Extracted from response.data.sellers (loadMore)");
      } else if (response?.sellers?.data) {
        sellersArray = response.sellers.data;
        paginationData = response.sellers;
        console.log("✅ Extracted from response.sellers (loadMore)");
      } else if (response?.data?.data?.data) {
        sellersArray = response.data.data.data;
        paginationData = response.data.data;
        console.log("✅ Extracted from response.data.data (loadMore)");
      } else if (response?.data?.data) {
        sellersArray = Array.isArray(response.data.data) ? response.data.data : [];
        paginationData = response.data;
        console.log("✅ Extracted from response.data (array) (loadMore)");
      } else if (response?.data) {
        sellersArray = Array.isArray(response.data) ? response.data : [];
        paginationData = response;
        console.log("✅ Extracted from response (array) (loadMore)");
      } else if (Array.isArray(response)) {
        sellersArray = response;
        console.log("✅ Extracted from response (direct array) (loadMore)");
      }

      console.log("🔍 Load more sellers array length:", sellersArray.length);

      if (!Array.isArray(sellersArray)) {
        sellersArray = [];
      }

      const pageData = {
        current_page: paginationData.current_page || nextPage,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || get().perPage,
        total: paginationData.total || 0,
        next_page_url: paginationData.next_page_url || null,
        prev_page_url: paginationData.prev_page_url || null,
        first_page_url: paginationData.first_page_url || null,
        last_page_url: paginationData.last_page_url || null,
      };

      const hasMoreData = pageData.current_page < pageData.last_page;

      // Create a Set of existing seller IDs to avoid duplicates
      const existingIds = new Set(existingSellers.map(s => s.id));
      const uniqueNewSellers = sellersArray.filter(s => !existingIds.has(s.id));

      set({
        sellers: [...existingSellers, ...uniqueNewSellers],
        totalSellers: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        hasMore: hasMoreData,
        loadingMore: false,
      });

      console.log(`✅ Load more completed: ${uniqueNewSellers.length} new sellers, total: ${existingSellers.length + uniqueNewSellers.length}, hasMore: ${hasMoreData}`);
    } catch (error) {
      console.error("❌ Failed to load more sellers:", error);
      set({
        loadingMore: false,
        error: error.message || "Failed to load more sellers",
      });
    }
  },

  // Create seller
  createSeller: async (sellerData) => {
    console.log("📝 createSeller called with:", sellerData);
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.create(sellerData);
      console.log("✅ Seller created successfully", response.data);

      let newSeller = null;
      if (response?.data?.seller) {
        newSeller = response.data.seller;
      } else if (response?.data?.data) {
        newSeller = response.data.data;
      } else if (response?.data) {
        newSeller = response.data;
      } else {
        newSeller = response;
      }

      const { sellers } = get();
      set({
        sellers: [newSeller, ...sellers],
        totalSellers: (sellers?.length || 0) + 1,
        loading: false,
      });

      return { success: true, data: newSeller };
    } catch (error) {
      console.error("❌ Failed to create seller:", error);
      set({
        error: error.message || "Failed to create seller",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Update seller
  updateSeller: async (id, sellerData) => {
    console.log("✏️ updateSeller called with:", id, sellerData);
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.update(id, sellerData);
      console.log("✅ Seller updated successfully", response.data);

      let updatedSeller = null;
      if (response?.data?.seller) {
        updatedSeller = response.data.seller;
      } else if (response?.data?.data) {
        updatedSeller = response.data.data;
      } else if (response?.data) {
        updatedSeller = response.data;
      } else {
        updatedSeller = response;
      }

      const { sellers } = get();
      set({
        sellers: sellers.map(seller => seller.id === id ? updatedSeller : seller),
        loading: false,
      });

      return { success: true, data: updatedSeller };
    } catch (error) {
      console.error("❌ Failed to update seller:", error);
      set({
        error: error.message || "Failed to update seller",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Delete seller
  deleteSeller: async (id) => {
    console.log("🗑️ deleteSeller called with:", id);
    set({ loading: true, error: null });

    try {
      await sellersAPI.delete(id);
      console.log("✅ Seller deleted successfully");

      const { sellers } = get();
      set({
        sellers: sellers.filter(seller => seller.id !== id),
        totalSellers: Math.max(0, (sellers?.length || 0) - 1),
        loading: false,
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Failed to delete seller:", error);
      set({
        error: error.message || "Failed to delete seller",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Get edit data
  getEditData: async (sellerId) => {
    console.log("🔍 getEditData called with sellerId:", sellerId);
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.getEditData(sellerId);
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

  // Get single seller details
  getSingleSeller: async (sellerId) => {
    console.log("🔍 getSingleSeller called with sellerId:", sellerId);
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.getSingleSeller(sellerId);
      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch seller details:", error);
      set({
        error: error.message || "Failed to fetch seller details",
        loading: false,
      });
      throw error;
    }
  },

  // Make due payment
  makeDuePayment: async (sellerId, paymentData) => {
    console.log("💳 makeDuePayment called with sellerId:", sellerId, "data:", paymentData);
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.makeDuePayment(sellerId, paymentData);
      console.log("✅ Due payment successful", response.data);

      // Refresh seller data after payment
      const sellerResponse = await sellersAPI.getSingleSeller(sellerId);
      let updatedSeller = null;
      if (sellerResponse?.data?.seller) {
        updatedSeller = sellerResponse.data.seller;
      } else if (sellerResponse?.data?.data) {
        updatedSeller = sellerResponse.data.data;
      }

      const { sellers } = get();
      if (updatedSeller) {
        set({
          sellers: sellers.map(seller => seller.id === sellerId ? updatedSeller : seller),
          loading: false,
        });
      } else {
        set({ loading: false });
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Failed to make due payment:", error);
      set({
        error: error.message || "Failed to make due payment",
        loading: false,
      });
      return { success: false, error: error.message };
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

export default useSellerStore;
