// store/sellerStore.js
import { create } from "zustand";
import { sellersAPI } from "../api/sellers";
import { useAuthStore } from "./authStore";

const useSellerStore = create((set, get) => ({
  sellers: [],
  totalSellers: 0,
  currentPage: 1,
  perPage: 15,
  loading: false,
  error: null,
  filters: {
    search: "",
  },

  // Fetch sellers by user ID with pagination
  fetchSellers: async (userId, page = 1, search = "") => {
    if (!userId) {
      console.error("No user ID provided");
      return;
    }

    console.log("👥 fetchSellers called with userId:", userId, "page:", page, "search:", search);
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.getByUserId(userId, page, search);
      console.log("📦 Sellers API Response:", response);

      let sellersArray = [];
      let paginationData = {};

      // Extract sellers array from correct nested structure
      if (response?.data?.sellers?.data) {
        sellersArray = response.data.sellers.data;
        paginationData = response.data.sellers;
      } else if (response?.data?.data?.data) {
        sellersArray = response.data.data.data;
        paginationData = response.data.data;
      } else if (response?.data?.data) {
        sellersArray = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        paginationData = response.data;
      } else if (response?.data) {
        sellersArray = Array.isArray(response.data) ? response.data : [];
      }

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

      set({
        sellers: sellersArray,
        totalSellers: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        loading: false,
      });

      console.log("✅ Sellers loaded:", sellersArray.length, "Page:", pageData.current_page, "of", pageData.last_page);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch sellers:", error);
      set({
        sellers: [],
        totalSellers: 0,
        currentPage: 1,
        lastPage: 1,
        pagination: null,
        loading: false,
        error: error.message || "Failed to fetch sellers",
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
