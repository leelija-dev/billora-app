// store/stockStore.js
import { create } from 'zustand';
import { stocksAPI } from '../api/stocks';
import { productsAPI } from '../api/products';
import { getPaginatedData, getEntityData } from '../api/client';

const useStockStore = create((set, get) => ({
  stocks: [],
  totalStocks: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 8,
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  pagination: null,
  filters: {
    search: '',
    product_id: '',
    unit_id: '',
    lowStock: false,
    minQuantity: '',
    maxQuantity: '',
    dateRange: 'all',
    createdBy: '',
    sortBy: 'name',
    sortOrder: 'asc',
  },

  // ✅ FIXED: Fetch stocks with pagination
  fetchStocks: async (page = 1, search = '', append = false) => {
    console.log('🔄 fetchStocks called:', { page, search, append });
    
    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await stocksAPI.getAll(search, page, get().perPage);
      console.log('📦 Stocks API Full Response:', response);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log('📊 Extracted paginated data:', paginatedData);

      // Extract stocks array
      let stocksArray = paginatedData.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(stocksArray)) {
        console.error('❌ stocksArray is not an array:', stocksArray);
        set({
          stocks: [],
          totalStocks: 0,
          loading: false,
          loadingMore: false,
          error: 'Invalid response format',
        });
        return { success: false, error: 'Invalid response format' };
      }
      
      console.log('📊 Raw stocks array length:', stocksArray.length);
      
      // Fetch products to enrich stock data
      let productsArray = [];
      try {
        const productsResponse = await productsAPI.getAll();
        console.log('📦 Products API Response:', productsResponse);
        
        // ✅ Use helper to extract paginated data for products
        const productsPaginated = getPaginatedData(productsResponse);
        productsArray = productsPaginated.data || [];
        console.log('📊 Products array length:', productsArray.length);
      } catch (productError) {
        console.error('❌ Failed to fetch products:', productError);
      }

      // Enrich stocks with product information
      const enrichedStocks = stocksArray.map(stock => {
        const product = productsArray.find(p => p.id === stock.product_id);
        return {
          ...stock,
          product: product || null,
          product_name: product?.name || stock.product_name || `Product ${stock.product_id}`,
          product_sku: product?.sku || stock.product_sku || '',
          product_image: product?.image || stock.product_image || null,
          selling_price: stock.selling_price || product?.selling_price || 0,
          purchase_price: stock.purchase_price || product?.purchase_price || 0,
        };
      });

      console.log('✅ Enriched stocks count:', enrichedStocks.length);

      // If append is true and page > 1, append to existing stocks
      const { stocks: existingStocks } = get();
      const finalStocks = append && page > 1 
        ? [...existingStocks, ...enrichedStocks]
        : enrichedStocks;

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

      set({
        stocks: finalStocks,
        totalStocks: paginatedData.total || finalStocks.length,
        currentPage: paginatedData.current_page || page,
        lastPage: paginatedData.last_page || 1,
        perPage: paginatedData.per_page || 8,
        pagination: paginatedData,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Stocks loaded: ${finalStocks.length}, page ${paginatedData.current_page}/${paginatedData.last_page}, hasMore: ${hasMoreData}`);
      return { success: true, data: finalStocks, pagination: paginatedData };
      
    } catch (error) {
      console.error('❌ Failed to fetch stocks:', error);
      const errorMessage = error.message || 'Failed to fetch stocks';
      set({
        stocks: append ? get().stocks : [],
        totalStocks: append ? get().totalStocks : 0,
        loading: false,
        loadingMore: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Load more stocks for pagination
  loadMoreStocks: async (search = '') => {
    const { hasMore, loadingMore, loading, currentPage, lastPage } = get();
    
    console.log(`🔄 Load more: hasMore=${hasMore}, loadingMore=${loadingMore}, loading=${loading}, currentPage=${currentPage}, lastPage=${lastPage}`);
    
    // Prevent loading if already loading, no more stocks, or reached last page
    if (loadingMore || loading || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    set({ loadingMore: true });
    const nextPage = currentPage + 1;
    console.log(`📡 Fetching next page: ${nextPage}`);

    try {
      const response = await stocksAPI.getAll(search, nextPage, get().perPage);
      console.log('📦 Stocks API Full Response:', response);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log('📊 Load more paginated:', paginatedData);

      let stocksArray = paginatedData.data || [];
      
      if (!Array.isArray(stocksArray)) {
        console.error('❌ stocksArray is not an array:', stocksArray);
        set({ loadingMore: false });
        return { success: false, error: 'Invalid response format' };
      }
      
      // Fetch products to enrich stock data
      let productsArray = [];
      try {
        const productsResponse = await productsAPI.getAll();
        const productsPaginated = getPaginatedData(productsResponse);
        productsArray = productsPaginated.data || [];
      } catch (productError) {
        console.error('❌ Failed to fetch products:', productError);
      }

      // Enrich stocks with product information
      const enrichedStocks = stocksArray.map(stock => {
        const product = productsArray.find(p => p.id === stock.product_id);
        return {
          ...stock,
          product: product || null,
          product_name: product?.name || stock.product_name || `Product ${stock.product_id}`,
          product_sku: product?.sku || stock.product_sku || '',
          product_image: product?.image || stock.product_image || null,
          selling_price: stock.selling_price || product?.selling_price || 0,
          purchase_price: stock.purchase_price || product?.purchase_price || 0,
        };
      });

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

      set((state) => {
        // Create a Set of existing stock IDs to avoid duplicates
        const existingIds = new Set(state.stocks.map(s => s.id));
        const newStocks = enrichedStocks.filter(s => !existingIds.has(s.id));
        
        return {
          stocks: [...state.stocks, ...newStocks],
          totalStocks: paginatedData.total || state.stocks.length + newStocks.length,
          currentPage: paginatedData.current_page || nextPage,
          lastPage: paginatedData.last_page || 1,
          perPage: paginatedData.per_page || 8,
          pagination: paginatedData,
          hasMore: hasMoreData,
          loadingMore: false,
          error: null,
        };
      });

      console.log(`✅ Load more completed: ${enrichedStocks.length} new stocks, total: ${get().stocks.length}, hasMore: ${hasMoreData}`);
      return { success: true, data: enrichedStocks };
      
    } catch (error) {
      console.error('❌ Failed to load more stocks:', error);
      const errorMessage = error.message || 'Failed to load more stocks';
      set({ 
        loadingMore: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Get single stock
  getStock: async (id) => {
    console.log('🔍 getStock called with:', id);
    set({ loading: true, error: null });
    
    try {
      const response = await stocksAPI.getById(id);
      console.log('📦 getStock response:', response);
      
      // ✅ Use helper to extract entity data
      const stockData = getEntityData(response);
      console.log('📊 Extracted stock:', stockData);
      
      set({ loading: false, error: null });
      return { success: true, data: stockData };
      
    } catch (error) {
      console.error('❌ Failed to fetch stock:', error);
      const errorMessage = error.message || 'Failed to fetch stock';
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Create stock
  createStock: async (stockData) => {
    console.log('📝 createStock called with:', stockData);
    set({ loading: true, error: null });

    try {
      const response = await stocksAPI.create(stockData);
      console.log('✅ Stock created successfully:', response);
      
      // ✅ Use helper to extract entity data
      const newStock = getEntityData(response);
      console.log('📊 Extracted new stock:', newStock);

      // Optimistic update
      if (newStock && newStock.id) {
        const { stocks } = get();
        set({
          stocks: [newStock, ...stocks],
          totalStocks: stocks.length + 1,
          loading: false,
          error: null,
        });
      } else {
        set({ loading: false, error: null });
      }

      // Optionally refresh the list
      // await get().fetchStocks(1, '', false);

      return { success: true, data: newStock };
      
    } catch (error) {
      console.error('❌ Failed to create stock:', error);
      const errorMessage = error.message || 'Failed to create stock';
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Update stock
  updateStock: async (id, stockData) => {
    console.log('✏️ updateStock called:', { id, stockData });
    set({ loading: true, error: null });

    try {
      const response = await stocksAPI.update(id, stockData);
      console.log('✅ Stock updated successfully:', response);
      
      // ✅ Use helper to extract entity data
      const updatedStock = getEntityData(response);
      console.log('📊 Extracted updated stock:', updatedStock);

      // Optimistic update
      if (updatedStock && updatedStock.id) {
        const { stocks } = get();
        set({
          stocks: stocks.map(stock => stock.id === id ? updatedStock : stock),
          loading: false,
          error: null,
        });
      } else {
        set({ loading: false, error: null });
      }

      // Optionally refresh the list
      // await get().fetchStocks(get().currentPage, get().filters.search, false);

      return { success: true, data: updatedStock };
      
    } catch (error) {
      console.error('❌ Failed to update stock:', error);
      const errorMessage = error.message || 'Failed to update stock';
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Delete stock
  deleteStock: async (id, userId) => {
    console.log('🗑️ deleteStock called with:', id);
    set({ loading: true, error: null });

    try {
      await stocksAPI.delete(id, userId);
      console.log('✅ Stock deleted successfully');

      // Remove from local state
      const { stocks } = get();
      set({
        stocks: stocks.filter(stock => stock.id !== id),
        totalStocks: Math.max(0, stocks.length - 1),
        loading: false,
        error: null,
      });

      // Optionally refresh the list
      // await get().fetchStocks(get().currentPage, get().filters.search, false);

      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to delete stock:', error);
      const errorMessage = error.message || 'Failed to delete stock';
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Add stock quantity
  addStockQuantity: async (id, userId, quantity) => {
    console.log('➕ addStockQuantity called:', { id, quantity });
    set({ loading: true, error: null });

    try {
      const response = await stocksAPI.addStock(id, userId, quantity);
      console.log('✅ Stock quantity added successfully:', response);

      // ✅ Use helper to extract entity data
      const updatedStock = getEntityData(response);
      console.log('📊 Extracted updated stock after adding quantity:', updatedStock);

      // Update local state
      if (updatedStock && updatedStock.id) {
        const { stocks } = get();
        set({
          stocks: stocks.map(stock => 
            stock.id === id ? updatedStock : stock
          ),
          loading: false,
          error: null,
        });
      } else {
        // If we can't extract the updated stock, refresh the list
        await get().fetchStocks(get().currentPage, get().filters.search, false);
        set({ loading: false, error: null });
      }

      return { success: true, data: updatedStock };
      
    } catch (error) {
      console.error('❌ Failed to add stock quantity:', error);
      const errorMessage = error.message || 'Failed to add stock quantity';
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ Set filters with auto-fetch
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ 
      filters: updatedFilters,
      currentPage: 1,
      hasMore: true,
    });
    
    // Refetch with new filters (debounced)
    setTimeout(() => {
      get().fetchStocks(1, updatedFilters.search, false);
    }, 300);
  },

  // ✅ Set page with auto-fetch
  setPage: (page) => {
    const { lastPage, filters } = get();
    if (page >= 1 && page <= lastPage) {
      set({ currentPage: page });
      get().fetchStocks(page, filters.search, false);
    }
  },

  // ✅ Reset to page 1
  resetToPageOne: async (search = '') => {
    await get().fetchStocks(1, search, false);
  },

  // ✅ Clear error
  clearError: () => set({ error: null }),

  // ✅ Reset store
  reset: () => {
    set({
      stocks: [],
      totalStocks: 0,
      currentPage: 1,
      lastPage: 1,
      perPage: 8,
      loading: false,
      loadingMore: false,
      hasMore: true,
      error: null,
      pagination: null,
      filters: {
        search: '',
        product_id: '',
        unit_id: '',
        lowStock: false,
        minQuantity: '',
        maxQuantity: '',
        dateRange: 'all',
        createdBy: '',
        sortBy: 'name',
        sortOrder: 'asc',
      },
    });
  },
}));

export default useStockStore;