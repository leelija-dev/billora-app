// store/sellerStore.js - COMPLETE FIXED VERSION
import { create } from "zustand";
import { sellersAPI } from "../api/sellers";
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

  // Payment history state
  paymentHistory: [],
  paymentHistoryPagination: null,
  paymentHistoryLoading: false,

  // Payment state
  paymentProcessing: false,
  paymentError: null,

  // Helper to extract sellers data
  _extractSellersData: (response) => {
    if (!response) {
      return { sellers: [], pagination: { current_page: 1, last_page: 1, total: 0 } };
    }

    const data = response.data || response;

    if (data?.current_page !== undefined && data?.data && Array.isArray(data.data)) {
      const sellersArray = data.data;
      const paginationData = data;
      
      const pagination = {
        current_page: paginationData.current_page || 1,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || 8,
        total: paginationData.total || sellersArray.length,
        next_page_url: paginationData.next_page_url || null,
        prev_page_url: paginationData.prev_page_url || null,
        first_page_url: paginationData.first_page_url || null,
        last_page_url: paginationData.last_page_url || null,
        path: paginationData.path || null,
        from: paginationData.from || null,
        to: paginationData.to || null,
      };

      return { sellers: sellersArray, pagination };
    }

    if (Array.isArray(data)) {
      return {
        sellers: data,
        pagination: { current_page: 1, last_page: 1, total: data.length }
      };
    }

    return { sellers: [], pagination: { current_page: 1, last_page: 1, total: 0 } };
  },

  // Fetch sellers by user ID with pagination
  fetchSellers: async (userId, page = 1, search = "", append = false) => {
    if (!userId) {
      console.error("No user ID provided");
      return;
    }

    console.log("👥 fetchSellers called with userId:", userId, "page:", page, "search:", search, "append:", append);

    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await sellersAPI.getByUserId(userId, page, search);
      const { sellers: sellersArray, pagination: paginationData } = get()._extractSellersData(response);

      const hasMoreData = paginationData.current_page < paginationData.last_page;

      const { sellers: existingSellers } = get();
      let finalSellers;
      if (append && page > 1) {
        const existingIds = new Set(existingSellers.map(s => s.id));
        const uniqueNewSellers = sellersArray.filter(s => !existingIds.has(s.id));
        finalSellers = [...existingSellers, ...uniqueNewSellers];
      } else {
        finalSellers = sellersArray;
      }

      set({
        sellers: finalSellers,
        totalSellers: paginationData.total,
        currentPage: paginationData.current_page,
        lastPage: paginationData.last_page,
        perPage: paginationData.per_page,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Sellers loaded: ${finalSellers.length} sellers, page ${paginationData.current_page}/${paginationData.last_page}`);
      return response.data;
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
      throw error;
    }
  },

  // Load more sellers for pagination
  loadMoreSellers: async (userId) => {
    const { currentPage, lastPage, hasMore, loading, loadingMore, filters } = get();

    if (loading || loadingMore || !hasMore || currentPage >= lastPage) {
      return;
    }

    set({ loadingMore: true, error: null });

    try {
      const nextPage = currentPage + 1;
      const response = await sellersAPI.getByUserId(userId, nextPage, filters.search);
      const { sellers: sellersArray, pagination: paginationData } = get()._extractSellersData(response);

      const { sellers: existingSellers } = get();
      const existingIds = new Set(existingSellers.map(s => s.id));
      const uniqueNewSellers = sellersArray.filter(s => !existingIds.has(s.id));

      const hasMoreData = paginationData.current_page < paginationData.last_page;

      set({
        sellers: [...existingSellers, ...uniqueNewSellers],
        totalSellers: paginationData.total,
        currentPage: paginationData.current_page,
        lastPage: paginationData.last_page,
        perPage: paginationData.per_page,
        hasMore: hasMoreData,
        loadingMore: false,
        error: null,
      });

      return response.data;
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
      throw error;
    }
  },

  // Get seller by ID
  getSellerById: async (sellerId) => {
    console.log("🔍 getSellerById called with sellerId:", sellerId);
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.getEditData(sellerId);
      
      let sellerData = null;
      
      if (response?.data?.data) {
        sellerData = response.data.data;
        console.log("✅ Extracted from response.data.data");
      } else if (response?.data) {
        sellerData = response.data;
        console.log("✅ Extracted from response.data");
      } else if (response) {
        sellerData = response;
        console.log("✅ Extracted from response");
      }

      if (!sellerData || !sellerData.id) {
        throw new Error("Seller not found");
      }

      set({ loading: false, error: null });
      return sellerData;
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
      throw error;
    }
  },

  // Fetch seller products
fetchSellerProducts: async (sellerId, page = 1, search = "", append = false) => {
  if (!sellerId) {
    console.error("No seller ID provided");
    return;
  }

  console.log("📦 fetchSellerProducts called with sellerId:", sellerId, "page:", page, "search:", search, "append:", append);

  if (append && page > 1) {
    set({ sellerProductsLoadingMore: true, sellerProductsError: null });
  } else {
    set({ sellerProductsLoading: true, sellerProductsError: null });
  }

  try {
    const response = await sellersAPI.getSellerProducts(sellerId, page, search);
    console.log("📦 Seller products response received");
    
    // Get the data - could be response.data or response
    const data = response.data || response;
    
    console.log("📦 Response data type:", typeof data);
    console.log("📦 Response data keys:", data ? Object.keys(data) : []);

    // Try multiple ways to extract products
    let productsArray = [];
    let paginationData = {};
    let paymentHistoryArray = [];
    let paymentHistoryPagination = null;

    // Check if data has a 'data' property (nested response)
    const actualData = data?.data || data;

    // Method 1: Direct sellerProducts from actualData
    if (actualData?.sellerProducts?.data && Array.isArray(actualData.sellerProducts.data)) {
      productsArray = actualData.sellerProducts.data;
      paginationData = actualData.sellerProducts;
      console.log(`✅ Method 1: Extracted ${productsArray.length} products from actualData.sellerProducts.data`);
    }
    // Method 2: data.data.sellerProducts
    else if (data?.data?.sellerProducts?.data && Array.isArray(data.data.sellerProducts.data)) {
      productsArray = data.data.sellerProducts.data;
      paginationData = data.data.sellerProducts;
      console.log(`✅ Method 2: Extracted ${productsArray.length} products from data.data.sellerProducts.data`);
    }
    // Method 3: data.products
    else if (data?.products?.data && Array.isArray(data.products.data)) {
      productsArray = data.products.data;
      paginationData = data.products;
      console.log(`✅ Method 3: Extracted ${productsArray.length} products from data.products.data`);
    }
    // Method 4: data.data (array)
    else if (data?.data && Array.isArray(data.data)) {
      productsArray = data.data;
      paginationData = data;
      console.log(`✅ Method 4: Extracted ${productsArray.length} products from data.data (array)`);
    }
    // Method 5: data is array
    else if (Array.isArray(data)) {
      productsArray = data;
      paginationData = { current_page: 1, last_page: 1, total: productsArray.length };
      console.log(`✅ Method 5: Extracted ${productsArray.length} products from data (array)`);
    }

    // ============ EXTRACT PAYMENT HISTORY ============
    // Check for payment history in actualData first
    if (actualData?.sellerPaymentHistory?.data && Array.isArray(actualData.sellerPaymentHistory.data)) {
      paymentHistoryArray = actualData.sellerPaymentHistory.data;
      paymentHistoryPagination = {
        current_page: actualData.sellerPaymentHistory.current_page || 1,
        last_page: actualData.sellerPaymentHistory.last_page || 1,
        per_page: actualData.sellerPaymentHistory.per_page || 8,
        total: actualData.sellerPaymentHistory.total || 0,
        next_page_url: actualData.sellerPaymentHistory.next_page_url || null,
        prev_page_url: actualData.sellerPaymentHistory.prev_page_url || null,
        first_page_url: actualData.sellerPaymentHistory.first_page_url || null,
        last_page_url: actualData.sellerPaymentHistory.last_page_url || null,
        path: actualData.sellerPaymentHistory.path || null,
        from: actualData.sellerPaymentHistory.from || null,
        to: actualData.sellerPaymentHistory.to || null,
      };
      console.log(`✅ Extracted ${paymentHistoryArray.length} payment history records from actualData.sellerPaymentHistory.data`);
    }
    // Check for payment history in data.data.sellerPaymentHistory
    else if (data?.data?.sellerPaymentHistory?.data && Array.isArray(data.data.sellerPaymentHistory.data)) {
      paymentHistoryArray = data.data.sellerPaymentHistory.data;
      paymentHistoryPagination = {
        current_page: data.data.sellerPaymentHistory.current_page || 1,
        last_page: data.data.sellerPaymentHistory.last_page || 1,
        per_page: data.data.sellerPaymentHistory.per_page || 8,
        total: data.data.sellerPaymentHistory.total || 0,
        next_page_url: data.data.sellerPaymentHistory.next_page_url || null,
        prev_page_url: data.data.sellerPaymentHistory.prev_page_url || null,
        first_page_url: data.data.sellerPaymentHistory.first_page_url || null,
        last_page_url: data.data.sellerPaymentHistory.last_page_url || null,
        path: data.data.sellerPaymentHistory.path || null,
        from: data.data.sellerPaymentHistory.from || null,
        to: data.data.sellerPaymentHistory.to || null,
      };
      console.log(`✅ Extracted ${paymentHistoryArray.length} payment history records from data.data.sellerPaymentHistory.data`);
    }
    // Check for direct sellerPaymentHistory
    else if (data?.sellerPaymentHistory?.data && Array.isArray(data.sellerPaymentHistory.data)) {
      paymentHistoryArray = data.sellerPaymentHistory.data;
      paymentHistoryPagination = {
        current_page: data.sellerPaymentHistory.current_page || 1,
        last_page: data.sellerPaymentHistory.last_page || 1,
        per_page: data.sellerPaymentHistory.per_page || 8,
        total: data.sellerPaymentHistory.total || 0,
        next_page_url: data.sellerPaymentHistory.next_page_url || null,
        prev_page_url: data.sellerPaymentHistory.prev_page_url || null,
        first_page_url: data.sellerPaymentHistory.first_page_url || null,
        last_page_url: data.sellerPaymentHistory.last_page_url || null,
        path: data.sellerPaymentHistory.path || null,
        from: data.sellerPaymentHistory.from || null,
        to: data.sellerPaymentHistory.to || null,
      };
      console.log(`✅ Extracted ${paymentHistoryArray.length} payment history records from data.sellerPaymentHistory.data`);
    } else {
      console.log("ℹ️ No payment history found in response");
    }

    // If products array is empty, log warning
    if (productsArray.length === 0) {
      console.warn("⚠️ No products found in response");
      console.log("📦 Full response structure:", JSON.stringify(data, null, 2));
    }

    const pagination = {
      current_page: paginationData.current_page || 1,
      last_page: paginationData.last_page || 1,
      per_page: paginationData.per_page || 8,
      total: paginationData.total || productsArray.length,
      next_page_url: paginationData.next_page_url || null,
      prev_page_url: paginationData.prev_page_url || null,
      first_page_url: paginationData.first_page_url || null,
      last_page_url: paginationData.last_page_url || null,
      path: paginationData.path || null,
      from: paginationData.from || null,
      to: paginationData.to || null,
    };

    const hasMoreData = pagination.current_page < pagination.last_page;

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
      sellerProductsTotal: pagination.total,
      sellerProductsCurrentPage: pagination.current_page,
      sellerProductsLastPage: pagination.last_page,
      sellerProductsPageSize: pagination.per_page,
      sellerProductsHasMore: hasMoreData,
      sellerProductsLoading: false,
      sellerProductsLoadingMore: false,
      sellerProductsError: null,
      sellerProductsSearch: search,
      currentSellerId: sellerId,
      // Store payment history
      paymentHistory: paymentHistoryArray,
      paymentHistoryPagination: paymentHistoryPagination,
    });

    console.log(`✅ Products loaded: ${finalProducts.length} products, page ${pagination.current_page}/${pagination.last_page}, hasMore: ${hasMoreData}`);
    console.log(`✅ Payment history: ${paymentHistoryArray.length} records`);
    return response.data;
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
    throw error;
  }
},

  // Load more seller products
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
      
      // Get the data
      const data = response.data || response;
      
      let productsArray = [];
      let paginationData = {};

      // Extract products using same methods as fetchSellerProducts
      if (data?.sellerProducts?.data && Array.isArray(data.sellerProducts.data)) {
        productsArray = data.sellerProducts.data;
        paginationData = data.sellerProducts;
        console.log(`✅ Load more: Extracted ${productsArray.length} products from data.sellerProducts.data`);
      } else if (data?.data?.sellerProducts?.data && Array.isArray(data.data.sellerProducts.data)) {
        productsArray = data.data.sellerProducts.data;
        paginationData = data.data.sellerProducts;
        console.log(`✅ Load more: Extracted ${productsArray.length} products from data.data.sellerProducts.data`);
      } else if (data?.products?.data && Array.isArray(data.products.data)) {
        productsArray = data.products.data;
        paginationData = data.products;
        console.log(`✅ Load more: Extracted ${productsArray.length} products from data.products.data`);
      } else if (data?.data && Array.isArray(data.data)) {
        productsArray = data.data;
        paginationData = data;
        console.log(`✅ Load more: Extracted ${productsArray.length} products from data.data (array)`);
      } else if (Array.isArray(data)) {
        productsArray = data;
        paginationData = { current_page: 1, last_page: 1, total: productsArray.length };
        console.log(`✅ Load more: Extracted ${productsArray.length} products from data (array)`);
      }

      const { sellerProducts: existingProducts } = get();
      const existingIds = new Set(existingProducts.map(p => p.id));
      const uniqueNewProducts = productsArray.filter(p => !existingIds.has(p.id));

      const pagination = {
        current_page: paginationData.current_page || 1,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || 8,
        total: paginationData.total || productsArray.length,
        next_page_url: paginationData.next_page_url || null,
        prev_page_url: paginationData.prev_page_url || null,
        first_page_url: paginationData.first_page_url || null,
        last_page_url: paginationData.last_page_url || null,
        path: paginationData.path || null,
        from: paginationData.from || null,
        to: paginationData.to || null,
      };

      const hasMoreData = pagination.current_page < pagination.last_page;

      set({
        sellerProducts: [...existingProducts, ...uniqueNewProducts],
        sellerProductsTotal: pagination.total,
        sellerProductsCurrentPage: pagination.current_page,
        sellerProductsLastPage: pagination.last_page,
        sellerProductsPageSize: pagination.per_page,
        sellerProductsHasMore: hasMoreData,
        sellerProductsLoadingMore: false,
        sellerProductsError: null,
      });

      console.log(`✅ Load more completed: ${uniqueNewProducts.length} new products, total: ${get().sellerProducts.length}, hasMore: ${hasMoreData}`);
      return response.data;
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
      throw error;
    }
  },

  // Create seller
  createSeller: async (sellerData) => {
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.create(sellerData);
      
      let newSeller = null;
      const data = response.data || response;
      
      if (data?.seller) {
        newSeller = data.seller;
      } else if (data?.data?.seller) {
        newSeller = data.data.seller;
      } else if (data?.data) {
        newSeller = data.data;
      } else if (data) {
        newSeller = data;
      }

      const { sellers } = get();
      set({
        sellers: [newSeller, ...sellers],
        totalSellers: get().totalSellers + 1,
        loading: false,
        error: null,
      });

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

  // Update seller
  updateSeller: async (id, sellerData) => {
    set({ loading: true, error: null });

    try {
      const response = await sellersAPI.update(id, sellerData);
      
      let updatedSeller = null;
      const data = response.data || response;
      
      if (data?.seller) {
        updatedSeller = data.seller;
      } else if (data?.data?.seller) {
        updatedSeller = data.data.seller;
      } else if (data?.data) {
        updatedSeller = data.data;
      } else if (data) {
        updatedSeller = data;
      }

      const { sellers } = get();
      set({
        sellers: sellers.map(seller => seller.id === id ? updatedSeller : seller),
        loading: false,
        error: null,
      });

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

  // Delete seller
  deleteSeller: async (id) => {
    set({ loading: true, error: null });

    try {
      await sellersAPI.delete(id);

      const { sellers } = get();
      set({
        sellers: sellers.filter(seller => seller.id !== id),
        totalSellers: Math.max(0, get().totalSellers - 1),
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

  // Process due payment
  processDuePayment: async (sellerId, paymentData) => {
    set({ paymentProcessing: true, paymentError: null });

    try {
      const response = await sellersAPI.makeDuePayment(sellerId, paymentData);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Payment of ₹${parseFloat(paymentData.paid_amount).toFixed(2)} processed successfully`,
      });

      set({ paymentProcessing: false, paymentError: null });
      
      const { currentPage, filters } = get();
      const userId = paymentData.user_id;
      if (userId) {
        await get().fetchSellers(userId, currentPage, filters.search, false);
      }

      return { success: true, data: response.data };
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

  // Fetch payment history
  fetchPaymentHistory: async (sellerId, page = 1) => {
    console.log("📊 fetchPaymentHistory called with sellerId:", sellerId, "page:", page);
    set({ paymentHistoryLoading: true, paymentHistoryPagination: null });

    try {
      const response = await sellersAPI.getPaymentHistory(sellerId, page);
      
      let historyArray = [];
      let paginationData = null;

      const data = response.data || response;
      
      if (data?.data && Array.isArray(data.data)) {
        historyArray = data.data;
        paginationData = {
          current_page: data.current_page || page,
          last_page: data.last_page || 1,
          per_page: data.per_page || 8,
          total: data.total || historyArray.length,
        };
      } else if (Array.isArray(data)) {
        historyArray = data;
      }

      set({
        paymentHistory: historyArray,
        paymentHistoryPagination: paginationData,
        paymentHistoryLoading: false,
      });

      return { success: true, data: historyArray };
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

  // Set filters
  setFilters: (filters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...filters };
    set({
      filters: updatedFilters,
      currentPage: 1,
      hasMore: true,
    });
  },

  // Clear seller products
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
      currentSellerId: null,
      paymentHistory: [],
      paymentHistoryPagination: null,
    });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
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