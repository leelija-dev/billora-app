// store/stockStore.js
import { create } from 'zustand';
import { stocksAPI } from '../api/stocks';
import { productsAPI } from '../api/products';

const useStockStore = create((set, get) => ({
  stocks: [],
  totalStocks: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 15,
  loading: false,
  error: null,
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

  // Fetch stocks with pagination
  fetchStocks: async (page = 1, search = '') => {
    console.log('🔄 fetchStocks called with page:', page, 'search:', search);
    set({ loading: true, error: null });

    try {
      const response = await stocksAPI.getAll(search, page, get().perPage);
      console.log('📦 Stocks API Full Response:', response);
      
      // Handle desktop API response structure
      // Desktop returns: { data: { data: { data: [...], current_page, total, last_page } } }
      let stocksArray = [];
      let paginationData = {};
      
      // Check different possible response structures
      if (response?.data?.data?.data) {
        // Desktop structure: response.data.data.data
        stocksArray = response.data.data.data;
        paginationData = response.data.data;
        console.log('✅ Using desktop structure (data.data.data)');
      } else if (response?.data?.data) {
        // Alternative: response.data.data
        stocksArray = Array.isArray(response.data.data) ? response.data.data : [];
        paginationData = response.data;
        console.log('✅ Using structure (data.data)');
      } else if (response?.data) {
        // Simple: response.data
        stocksArray = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Using structure (data)');
      } else if (Array.isArray(response)) {
        // Direct array
        stocksArray = response;
        console.log('✅ Using direct array structure');
      }
      
      console.log('📊 Raw stocks array length:', stocksArray.length);
      
      // If stocksArray is not an array, set to empty array
      if (!Array.isArray(stocksArray)) {
        console.error('❌ stocksArray is not an array:', stocksArray);
        stocksArray = [];
      }
      
      // Fetch products to enrich stock data
      let productsArray = [];
      try {
        const productsResponse = await productsAPI.getAll();
        console.log('📦 Products API Response:', productsResponse);
        
        if (productsResponse?.data?.data?.data) {
          productsArray = productsResponse.data.data.data;
        } else if (productsResponse?.data?.data) {
          productsArray = Array.isArray(productsResponse.data.data) ? productsResponse.data.data : [];
        } else if (productsResponse?.data) {
          productsArray = Array.isArray(productsResponse.data) ? productsResponse.data : [];
        }
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

      set({
        stocks: enrichedStocks,
        totalStocks: paginationData.total || enrichedStocks.length,
        currentPage: paginationData.current_page || page,
        lastPage: paginationData.last_page || 1,
        loading: false,
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch stocks:', error);
      set({
        stocks: [],
        totalStocks: 0,
        loading: false,
        error: error.message || 'Failed to fetch stocks',
      });
    }
  },

  // Get single stock
  getStock: async (id) => {
    console.log('🔍 getStock called with:', id);
    try {
      const response = await stocksAPI.getById(id);
      let stockData = null;
      
      if (response?.data?.data) {
        stockData = response.data.data;
      } else if (response?.data) {
        stockData = response.data;
      } else {
        stockData = response;
      }
      
      return stockData;
    } catch (error) {
      console.error('❌ Failed to fetch stock:', error);
      throw error;
    }
  },

  // Create stock
  createStock: async (stockData) => {
    console.log('📝 createStock called with:', stockData);
    set({ loading: true, error: null });

    try {
      const response = await stocksAPI.create(stockData);
      console.log('✅ Stock created successfully:', response);
      
      let newStock = null;
      if (response?.data?.data) {
        newStock = response.data.data;
      } else if (response?.data) {
        newStock = response.data;
      } else {
        newStock = response;
      }

      await get().fetchStocks();
      set({ loading: false });
      return { success: true, data: newStock };
    } catch (error) {
      console.error('❌ Failed to create stock:', error);
      set({
        error: error.message || 'Failed to create stock',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Update stock
  updateStock: async (id, stockData) => {
    console.log('✏️ updateStock called with:', id, stockData);
    set({ loading: true, error: null });

    try {
      const response = await stocksAPI.update(id, stockData);
      console.log('✅ Stock updated successfully:', response);
      
      let updatedStock = null;
      if (response?.data?.data) {
        updatedStock = response.data.data;
      } else if (response?.data) {
        updatedStock = response.data;
      } else {
        updatedStock = response;
      }

      await get().fetchStocks();
      set({ loading: false });
      return { success: true, data: updatedStock };
    } catch (error) {
      console.error('❌ Failed to update stock:', error);
      set({
        error: error.message || 'Failed to update stock',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Delete stock
  deleteStock: async (id, userId) => {
    console.log('🗑️ deleteStock called with:', id);
    set({ loading: true, error: null });

    try {
      await stocksAPI.delete(id, userId);
      console.log('✅ Stock deleted successfully');

      await get().fetchStocks();
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete stock:', error);
      set({
        error: error.message || 'Failed to delete stock',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Add stock quantity
  addStockQuantity: async (id, userId, quantity) => {
    console.log('➕ addStockQuantity called with:', id, quantity);
    set({ loading: true, error: null });

    try {
      const response = await stocksAPI.addStock(id, userId, quantity);
      console.log('✅ Stock quantity added successfully:', response);

      await get().fetchStocks();
      set({ loading: false });
      return { success: true, data: response?.data };
    } catch (error) {
      console.error('❌ Failed to add stock quantity:', error);
      set({
        error: error.message || 'Failed to add stock quantity',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Set filters
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });
  },

  // Change page
  setPage: (page) => {
    const { filters } = get();
    get().fetchStocks(page, filters.search);
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useStockStore;