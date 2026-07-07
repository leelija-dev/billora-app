// store/sellerStore.js
import { create } from "zustand";
import { sellersAPI } from "../api/sellers";
import { getPaginatedData, getEntityData } from "../api/client";
import Toast from "react-native-toast-message";

const useSellerStore = create((set, get) => ({
  // State
  sellers: [],
  totalSellers: 0,
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
  },

  // Seller products state
  sellerProducts: [],
  sellerProductsTotal: 0,
  sellerProductsCurrentPage: 1,
  sellerProductsLastPage: 1,
  sellerProductsPageSize: 8,
  sellerProductsLoading: false,
  sellerProductsLoadingMore: false,
  sellerProductsHasMore: true,
  sellerProductsError: null,
  sellerProductsSearch: "",
  currentSellerId: null,
  sellerProductsPagination: null,

  // Payment history state
  paymentHistory: [],
  paymentHistoryPagination: null,
  paymentHistoryLoading: false,

  // Payment state
  paymentProcessing: false,
  paymentError: null,

  // ✅ FIXED: Fetch sellers by user ID with pagination
  fetchSellers: async (userId, page = 1, search = "", append = false) => {
    if (!userId) {
      console.error("❌ No user ID provided");
      return { success: false, error: "User ID required" };
    }

    console.log("👥 fetchSellers called:", { userId, page, search, append });

    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await sellersAPI.getByUserId(userId, page, search);
      console.log("📦 Sellers API Response:", response);

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("📊 Extracted paginated data:", paginatedData);

      // Extract sellers array
      let sellersArray = paginatedData.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(sellersArray)) {
        sellersArray = [];
      }

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

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
        totalSellers: paginatedData.total || finalSellers.length,
        currentPage: paginatedData.current_page || page,
        lastPage: paginatedData.last_page || 1,
        perPage: paginatedData.per_page || 8,
        pagination: paginatedData,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Sellers loaded: ${finalSellers.length} sellers, page ${paginatedData.current_page}/${paginatedData.last_page}`);
      return { success: true, data: finalSellers, pagination: paginatedData };
      
    } catch (error) {
      console.error("❌ Failed to fetch sellers:", error);
      const errorMessage = error.message || "Failed to fetch sellers";
      set({
        sellers: append ? get().sellers : [],
        totalSellers: append ? get().totalSellers : 0,
        loading: false,
        loadingMore: false,
        error: errorMessage,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Load more sellers for pagination
  loadMoreSellers: async (userId) => {
    const { currentPage, lastPage, hasMore, loading, loadingMore, filters } = get();

    if (loading || loadingMore || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    console.log(`📜 loadMoreSellers - currentPage: ${currentPage}, lastPage: ${lastPage}`);
    set({ loadingMore: true, error: null });

    try {
      const nextPage = currentPage + 1;
      const response = await sellersAPI.getByUserId(userId, nextPage, filters.search);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("📊 Load more paginated:", paginatedData);

      let sellersArray = paginatedData.data || [];
      
      if (!Array.isArray(sellersArray)) {
        sellersArray = [];
      }

      const { sellers: existingSellers } = get();
      const existingIds = new Set(existingSellers.map(s => s.id));
      const uniqueNewSellers = sellersArray.filter(s => !existingIds.has(s.id));

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

      set({
        sellers: [...existingSellers, ...uniqueNewSellers],
        totalSellers: paginatedData.total || get().totalSellers,
        currentPage: paginatedData.current_page || nextPage,
        lastPage: paginatedData.last_page || 1,
        perPage: paginatedData.per_page || 8,
        pagination: paginatedData,
        hasMore: hasMoreData,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Load more completed: ${uniqueNewSellers.length} new sellers, total: ${get().sellers.length}, hasMore: ${hasMoreData}`);
      return { success: true, data: uniqueNewSellers };
      
    } catch (error) {
      console.error("❌ Failed to load more sellers:", error);
      const errorMessage = error.message || "Failed to load more sellers";
      set({
        loadingMore: false,
        error: errorMessage,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Get seller by ID
  getSellerById: async (sellerId) => {
    console.log("🔍 getSellerById called with sellerId:", sellerId);
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.getEditData(sellerId);
      console.log("📦 getSellerById response:", response);
      
      // ✅ Use helper to extract entity data
      const sellerData = getEntityData(response);
      console.log("📊 Extracted seller:", sellerData);

      if (!sellerData || !sellerData.id) {
        throw new Error("Seller not found");
      }

      set({ loading: false, error: null });
      return { success: true, data: sellerData };
      
    } catch (error) {
      console.error("❌ Failed to fetch seller:", error);
      const errorMessage = error.message || "Failed to fetch seller";
      set({
        error: errorMessage,
        loading: false,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Fetch seller products
  fetchSellerProducts: async (sellerId, page = 1, search = "", append = false) => {
    if (!sellerId) {
      console.error("❌ No seller ID provided");
      return { success: false, error: "Seller ID required" };
    }

    console.log("📦 fetchSellerProducts called:", { sellerId, page, search, append });

    if (append && page > 1) {
      set({ sellerProductsLoadingMore: true, sellerProductsError: null });
    } else {
      set({ sellerProductsLoading: true, sellerProductsError: null });
    }

    try {
      const response = await sellersAPI.getSellerProducts(sellerId, page, search);
      console.log("📦 Seller products response:", response);

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("📊 Extracted seller products paginated:", paginatedData);

      // Extract products array
      let productsArray = paginatedData.data || [];
      
      if (!Array.isArray(productsArray)) {
        productsArray = [];
      }

      // Extract payment history if present
      const fullData = getEntityData(response);
      let paymentHistoryArray = [];
      if (fullData?.sellerPaymentHistory?.data && Array.isArray(fullData.sellerPaymentHistory.data)) {
        paymentHistoryArray = fullData.sellerPaymentHistory.data;
        console.log(`✅ Extracted ${paymentHistoryArray.length} payment history records`);
      }

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

      const { sellerProducts: existingProducts } = get();
      let finalProducts;
      if (append && page > 1) {
        const existingIds = new Set(existingProducts.map(p => p.id));
        const uniqueNewProducts = productsArray.filter(p => !existingIds.has(p.id));
        finalProducts = [...existingProducts, ...uniqueNewProducts];
        console.log(`📦 Appended ${uniqueNewProducts.length} new products, total: ${finalProducts.length}`);
      } else {
        finalProducts = productsArray;
      }

      set({
        sellerProducts: finalProducts,
        sellerProductsTotal: paginatedData.total || finalProducts.length,
        sellerProductsCurrentPage: paginatedData.current_page || page,
        sellerProductsLastPage: paginatedData.last_page || 1,
        sellerProductsPageSize: paginatedData.per_page || 8,
        sellerProductsHasMore: hasMoreData,
        sellerProductsPagination: paginatedData,
        sellerProductsLoading: false,
        sellerProductsLoadingMore: false,
        sellerProductsError: null,
        sellerProductsSearch: search,
        currentSellerId: sellerId,
        paymentHistory: paymentHistoryArray,
      });

      console.log(`✅ Products loaded: ${finalProducts.length} products, page ${paginatedData.current_page}/${paginatedData.last_page}, hasMore: ${hasMoreData}`);
      return { success: true, data: finalProducts, pagination: paginatedData };
      
    } catch (error) {
      console.error("❌ Failed to fetch seller products:", error);
      const errorMessage = error.message || "Failed to fetch seller products";
      set({
        sellerProducts: append ? get().sellerProducts : [],
        sellerProductsTotal: append ? get().sellerProductsTotal : 0,
        sellerProductsLoading: false,
        sellerProductsLoadingMore: false,
        sellerProductsError: errorMessage,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Load more seller products
  loadMoreSellerProducts: async (sellerId) => {
    const { 
      sellerProductsCurrentPage, 
      sellerProductsLastPage, 
      sellerProductsHasMore, 
      sellerProductsLoading, 
      sellerProductsLoadingMore, 
      sellerProductsSearch 
    } = get();

    if (sellerProductsLoading || sellerProductsLoadingMore || !sellerProductsHasMore || sellerProductsCurrentPage >= sellerProductsLastPage) {
      return;
    }

    set({ sellerProductsLoadingMore: true, sellerProductsError: null });

    try {
      const nextPage = sellerProductsCurrentPage + 1;
      const response = await sellersAPI.getSellerProducts(sellerId, nextPage, sellerProductsSearch);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("📊 Load more seller products paginated:", paginatedData);

      let productsArray = paginatedData.data || [];
      
      if (!Array.isArray(productsArray)) {
        productsArray = [];
      }

      const { sellerProducts: existingProducts } = get();
      const existingIds = new Set(existingProducts.map(p => p.id));
      const uniqueNewProducts = productsArray.filter(p => !existingIds.has(p.id));

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

      set({
        sellerProducts: [...existingProducts, ...uniqueNewProducts],
        sellerProductsTotal: paginatedData.total || get().sellerProductsTotal,
        sellerProductsCurrentPage: paginatedData.current_page || nextPage,
        sellerProductsLastPage: paginatedData.last_page || 1,
        sellerProductsPageSize: paginatedData.per_page || 8,
        sellerProductsHasMore: hasMoreData,
        sellerProductsPagination: paginatedData,
        sellerProductsLoadingMore: false,
        sellerProductsError: null,
      });

      console.log(`✅ Load more completed: ${uniqueNewProducts.length} new products, total: ${get().sellerProducts.length}, hasMore: ${hasMoreData}`);
      return { success: true, data: uniqueNewProducts };
      
    } catch (error) {
      console.error("❌ Failed to load more seller products:", error);
      const errorMessage = error.message || "Failed to load more seller products";
      set({
        sellerProductsLoadingMore: false,
        sellerProductsError: errorMessage,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Create seller
  createSeller: async (sellerData) => {
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.create(sellerData);
      console.log("✅ Seller created:", response);

      // ✅ Use helper to extract entity data
      const newSeller = getEntityData(response);
      console.log("📊 Extracted new seller:", newSeller);

      // Optimistic update
      if (newSeller && newSeller.id) {
        const { sellers } = get();
        set({
          sellers: [newSeller, ...sellers],
          totalSellers: sellers.length + 1,
          loading: false,
          error: null,
        });
      } else {
        set({ loading: false, error: null });
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Seller created successfully',
      });

      return { success: true, data: newSeller };
      
    } catch (error) {
      console.error("❌ Failed to create seller:", error);
      const errorMessage = error.message || "Failed to create seller";
      set({
        error: errorMessage,
        loading: false,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Update seller
  updateSeller: async (id, sellerData) => {
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.update(id, sellerData);
      console.log("✅ Seller updated:", response);

      // ✅ Use helper to extract entity data
      const updatedSeller = getEntityData(response);
      console.log("📊 Extracted updated seller:", updatedSeller);

      // Optimistic update
      if (updatedSeller && updatedSeller.id) {
        const { sellers } = get();
        set({
          sellers: sellers.map(seller => seller.id === id ? updatedSeller : seller),
          loading: false,
          error: null,
        });
      } else {
        set({ loading: false, error: null });
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Seller updated successfully',
      });

      return { success: true, data: updatedSeller };
      
    } catch (error) {
      console.error("❌ Failed to update seller:", error);
      const errorMessage = error.message || "Failed to update seller";
      set({
        error: errorMessage,
        loading: false,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Delete seller
  deleteSeller: async (id) => {
    set({ loading: true, error: null });

    try {
      await sellersAPI.delete(id);
      console.log("✅ Seller deleted successfully");

      // Remove from local state
      const { sellers } = get();
      set({
        sellers: sellers.filter(seller => seller.id !== id),
        totalSellers: Math.max(0, sellers.length - 1),
        loading: false,
        error: null,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Seller deleted successfully',
      });

      return { success: true };
      
    } catch (error) {
      console.error("❌ Failed to delete seller:", error);
      const errorMessage = error.message || "Failed to delete seller";
      set({
        error: errorMessage,
        loading: false,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Process due payment
  processDuePayment: async (sellerId, paymentData) => {
    set({ paymentProcessing: true, paymentError: null });

    try {
      const response = await sellersAPI.makeDuePayment(sellerId, paymentData);
      console.log("✅ Payment processed:", response);

      // ✅ Use helper to extract entity data
      const paymentResult = getEntityData(response);
      console.log("📊 Extracted payment result:", paymentResult);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Payment of ₹${parseFloat(paymentData.paid_amount).toFixed(2)} processed successfully`,
      });

      set({ paymentProcessing: false, paymentError: null });
      
      // Refresh sellers list
      const { currentPage, filters } = get();
      const userId = paymentData.user_id;
      if (userId) {
        await get().fetchSellers(userId, currentPage, filters.search, false);
      }

      return { success: true, data: paymentResult };
      
    } catch (error) {
      console.error("❌ Failed to process payment:", error);
      const errorMessage = error.message || "Failed to process payment";
      set({
        paymentProcessing: false,
        paymentError: errorMessage,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Fetch payment history
  fetchPaymentHistory: async (sellerId, page = 1) => {
    console.log("📊 fetchPaymentHistory called:", { sellerId, page });
    set({ paymentHistoryLoading: true });

    try {
      const response = await sellersAPI.getPaymentHistory(sellerId, page);
      console.log("📊 Payment history response:", response);

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("📊 Payment history paginated:", paginatedData);

      let historyArray = paginatedData.data || [];
      
      if (!Array.isArray(historyArray)) {
        historyArray = [];
      }

      set({
        paymentHistory: historyArray,
        paymentHistoryPagination: paginatedData,
        paymentHistoryLoading: false,
      });

      return { success: true, data: historyArray, pagination: paginatedData };
      
    } catch (error) {
      console.error("❌ Failed to fetch payment history:", error);
      const errorMessage = error.message || "Failed to fetch payment history";
      set({
        paymentHistory: [],
        paymentHistoryPagination: null,
        paymentHistoryLoading: false,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ Set filters with auto-fetch
  setFilters: (filters, userId) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...filters };
    set({
      filters: updatedFilters,
      currentPage: 1,
      hasMore: true,
    });

    if (userId) {
      // Debounced fetch
      setTimeout(() => {
        get().fetchSellers(userId, 1, updatedFilters.search, false);
      }, 300);
    }
  },

  // ✅ Clear seller products
  clearSellerProducts: () => {
    set({
      sellerProducts: [],
      sellerProductsTotal: 0,
      sellerProductsCurrentPage: 1,
      sellerProductsLastPage: 1,
      sellerProductsPageSize: 8,
      sellerProductsLoading: false,
      sellerProductsLoadingMore: false,
      sellerProductsHasMore: true,
      sellerProductsError: null,
      sellerProductsSearch: "",
      sellerProductsPagination: null,
      currentSellerId: null,
      paymentHistory: [],
      paymentHistoryPagination: null,
    });
  },

  // ✅ Clear error
  clearError: () => set({ error: null }),

  // ✅ Reset store
  reset: () => {
    set({
      sellers: [],
      totalSellers: 0,
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
      },
      sellerProducts: [],
      sellerProductsTotal: 0,
      sellerProductsCurrentPage: 1,
      sellerProductsLastPage: 1,
      sellerProductsPageSize: 8,
      sellerProductsLoading: false,
      sellerProductsLoadingMore: false,
      sellerProductsHasMore: true,
      sellerProductsError: null,
      sellerProductsSearch: "",
      sellerProductsPagination: null,
      currentSellerId: null,
      paymentHistory: [],
      paymentHistoryPagination: null,
      paymentHistoryLoading: false,
      paymentProcessing: false,
      paymentError: null,
    });
  },
}));

export default useSellerStore;