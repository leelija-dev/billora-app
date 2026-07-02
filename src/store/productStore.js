// store/productStore.js - OPTIMIZED VERSION
import { create } from "zustand";
import { productsAPI } from "../api/products";

const useProductStore = create((set, get) => ({
  products: [],
  totalProducts: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 8,
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 8,
    total: 0,
    next_page_url: null,
    prev_page_url: null,
    first_page_url: null,
    last_page_url: null,
    path: null,
    from: null,
    to: null,
  },
  filters: {
    search: "",
    category_id: null,
    brand_id: null,
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  },

  // Helper to get total stock for a product
  getProductTotalStock: (product) => {
    if (!product || !product.stocks || !Array.isArray(product.stocks)) return 0;
    return product.stocks.reduce((total, stock) => {
      const quantity = parseFloat(stock.quantity) || 0;
      return total + quantity;
    }, 0);
  },

  // Helper to get stocks for a product
  getProductStocks: (product) => {
    if (!product || !product.stocks || !Array.isArray(product.stocks))
      return [];
    return product.stocks;
  },

  // Fetch products with pagination
  fetchProducts: async (page = 1, forceRefresh = false, append = false) => {
  const { filters, perPage, products: existingProducts } = get();

  console.log("🔄 fetchProducts called with page:", page, "forceRefresh:", forceRefresh, "append:", append);
  set({ loading: true, error: null });

  try {
    const response = await productsAPI.getAll(filters.search, page, perPage);
    console.log("📦 Products API Response received");

    // ✅ FIX: Ensure response.data is always an object
    let paginatedData = response.data || {};
    
    // ✅ FIX: If paginatedData is not an object or doesn't have data property, create a valid structure
    if (!paginatedData || typeof paginatedData !== 'object') {
      console.warn('⚠️ Invalid paginated data, creating fallback');
      paginatedData = {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: 0,
        next_page_url: null,
        prev_page_url: null,
        first_page_url: null,
        last_page_url: null,
        path: null,
        from: null,
        to: null,
      };
    }

    // ✅ FIX: Ensure data array exists
    const productsData = paginatedData.data || [];
    const newProducts = Array.isArray(productsData) ? productsData : [];

    console.log(`📦 Extracted ${newProducts.length} products`);
    console.log("📄 Pagination info:", {
      current_page: paginatedData.current_page,
      last_page: paginatedData.last_page,
      total: paginatedData.total,
      per_page: paginatedData.per_page,
    });

    const pagination = {
      current_page: paginatedData.current_page || 1,
      last_page: paginatedData.last_page || 1,
      per_page: paginatedData.per_page || perPage,
      total: paginatedData.total || 0,
      next_page_url: paginatedData.next_page_url || null,
      prev_page_url: paginatedData.prev_page_url || null,
      first_page_url: paginatedData.first_page_url || null,
      last_page_url: paginatedData.last_page_url || null,
      path: paginatedData.path || null,
      from: paginatedData.from || null,
      to: paginatedData.to || null,
    };

    // If append is true and not force refresh, append to existing products
    const finalProducts = append && !forceRefresh && page > 1 
      ? [...existingProducts, ...newProducts]
      : newProducts;

    set({
      products: finalProducts,
      totalProducts: pagination.total,
      currentPage: pagination.current_page,
      lastPage: pagination.last_page,
      perPage: pagination.per_page,
      pagination: pagination,
      loading: false,
      error: null,
    });

    console.log(`✅ Products loaded successfully: ${finalProducts.length} products`);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch products:", error);
    set({
      products: [],
      totalProducts: 0,
      currentPage: 1,
      lastPage: 1,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: get().perPage,
        total: 0,
        next_page_url: null,
        prev_page_url: null,
        first_page_url: null,
        last_page_url: null,
        path: null,
        from: null,
        to: null,
      },
      loading: false,
      error: error.message || "Failed to fetch products",
    });
    throw error;
  }
},

  // Fetch products by URL (for pagination)
  fetchProductsByUrl: async (url) => {
    if (!url) {
      console.warn("⚠️ fetchProductsByUrl called with null URL");
      return;
    }

    console.log("🔄 fetchProductsByUrl called with URL:", url);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.getByUrl(url);
      
      // API client already unwrapped the response
      const paginatedData = response.data;

      console.log(`📦 Extracted ${paginatedData.data?.length || 0} products from URL`);

      const pagination = {
        current_page: paginatedData.current_page || 1,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || get().perPage,
        total: paginatedData.total || 0,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };

      set({
        products: paginatedData.data || [],
        totalProducts: pagination.total,
        currentPage: pagination.current_page,
        lastPage: pagination.last_page,
        perPage: pagination.per_page,
        pagination: pagination,
        loading: false,
        error: null,
      });

      console.log(`✅ Products by URL loaded: ${paginatedData.data?.length || 0} products`);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch products by URL:", error);
      
      // Fallback to regular fetch
      let page = 1;
      try {
        const urlObj = new URL(url);
        const pageParam = urlObj.searchParams.get('page');
        if (pageParam) {
          page = parseInt(pageParam, 10);
        }
      } catch (e) {
        // Use default page 1 if URL parsing fails
      }

      set({ loading: false, error: error.message });
      return get().fetchProducts(page, true);
    }
  },

  // Get single product
  getProduct: async (id) => {
    console.log(`🔍 getProduct called with ID: ${id}`);
    try {
      const response = await productsAPI.getById(id);
      
      // API client already unwrapped the response
      const productData = response.data;
      
      console.log(`✅ Product ${id} fetched successfully`);
      return productData;
    } catch (error) {
      console.error(`❌ Failed to fetch product ${id}:`, error);
      throw error;
    }
  },

  // Create product
  createProduct: async (productData) => {
    console.log("📝 createProduct called");
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.create(productData);
      console.log("✅ Product created successfully");

      // API client already unwrapped the response
      const newProduct = response.data;

      // Refresh products list
      await get().fetchProducts(1, true);

      set({ loading: false });
      return { success: true, data: newProduct };
    } catch (error) {
      console.error("❌ Failed to create product:", error);
      set({
        error: error.message || "Failed to create product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Update product
  updateProduct: async (id, productData) => {
    console.log(`✏️ updateProduct called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.update(id, productData);
      console.log(`✅ Product ${id} updated successfully`);

      // API client already unwrapped the response
      const updatedProduct = response.data;

      // Refresh products list
      await get().fetchProducts(get().currentPage, true);

      set({ loading: false });
      return { success: true, data: updatedProduct };
    } catch (error) {
      console.error(`❌ Failed to update product ${id}:`, error);
      set({
        error: error.message || "Failed to update product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Delete product (soft delete)
  deleteProduct: async (id) => {
    console.log(`🗑️ deleteProduct called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      await productsAPI.delete(id);
      console.log(`✅ Product ${id} deleted successfully`);

      // Refresh products list
      await get().fetchProducts(get().currentPage, true);

      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to delete product ${id}:`, error);
      set({
        error: error.message || "Failed to delete product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Restore product
  restoreProduct: async (id) => {
    console.log(`♻️ restoreProduct called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      await productsAPI.restore(id);
      console.log(`✅ Product ${id} restored successfully`);

      // Refresh products list
      await get().fetchProducts(get().currentPage, true);

      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to restore product ${id}:`, error);
      set({
        error: error.message || "Failed to restore product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Permanently delete product
  forceDeleteProduct: async (id) => {
    console.log(`💥 forceDeleteProduct called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      await productsAPI.forceDelete(id);
      console.log(`✅ Product ${id} permanently deleted`);

      // Refresh products list
      await get().fetchProducts(get().currentPage, true);

      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to permanently delete product ${id}:`, error);
      set({
        error: error.message || "Failed to permanently delete product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Bulk delete products
  bulkDeleteProducts: async (ids) => {
    console.log(`📦 Bulk delete called for ${ids.length} products`);
    set({ loading: true, error: null });

    try {
      await productsAPI.bulkDelete(ids);
      console.log(`✅ ${ids.length} products bulk deleted successfully`);

      // Refresh products list
      await get().fetchProducts(get().currentPage, true);

      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to bulk delete products:", error);
      set({
        error: error.message || "Failed to bulk delete products",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Bulk force delete products
  bulkForceDeleteProducts: async (ids) => {
    console.log(`💥 Bulk force delete called for ${ids.length} products`);
    set({ loading: true, error: null });

    try {
      await productsAPI.bulkForceDelete(ids);
      console.log(`✅ ${ids.length} products bulk permanently deleted`);

      // Refresh products list
      await get().fetchProducts(get().currentPage, true);

      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to bulk force delete products:", error);
      set({
        error: error.message || "Failed to bulk force delete products",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Set filters
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    console.log("🔍 Setting filters:", updatedFilters);
    
    set({
      filters: updatedFilters,
      currentPage: 1,
    });

    // Debounce the fetch
    const timeoutId = setTimeout(() => {
      get().fetchProducts(1, true);
    }, 300);

    // Store timeout ID for cleanup if needed
    if (get()._filterTimeout) {
      clearTimeout(get()._filterTimeout);
    }
    set({ _filterTimeout: timeoutId });
  },

  // Set page with proper pagination
  setPage: (page) => {
    const { lastPage, currentPage, pagination } = get();

    console.log(`📄 setPage called with: ${page}, current: ${currentPage}, last: ${lastPage}`);

    // Validate page number
    if (page < 1) page = 1;
    if (page > lastPage) page = lastPage;

    if (page !== currentPage) {
      console.log(`📄 Changing page from ${currentPage} to ${page}`);
      set({ currentPage: page });

      // Use the pagination URLs from the API response
      let pageUrl = null;
      
      // Try to use the exact URL from pagination data
      if (page === 1 && pagination.first_page_url) {
        pageUrl = pagination.first_page_url;
        console.log("📄 Using first_page_url:", pageUrl);
      } else if (page === pagination.last_page && pagination.last_page_url) {
        pageUrl = pagination.last_page_url;
        console.log("📄 Using last_page_url:", pageUrl);
      } else if (pagination.next_page_url && page === currentPage + 1) {
        pageUrl = pagination.next_page_url;
        console.log("📄 Using next_page_url:", pageUrl);
      } else if (pagination.prev_page_url && page === currentPage - 1) {
        pageUrl = pagination.prev_page_url;
        console.log("📄 Using prev_page_url:", pageUrl);
      } else {
        // Construct URL for pages in between
        const basePath = pagination.path || "/products";
        pageUrl = `${basePath}?page=${page}`;
        console.log("📄 Constructed page URL:", pageUrl);
      }

      // If we have a URL, fetch it
      if (pageUrl) {
        get().fetchProductsByUrl(pageUrl);
      } else {
        // Fallback to regular fetch
        console.log("📄 No URL available, using regular fetch");
        get().fetchProducts(page, true);
      }
    }
  },

  // Search products
  searchProducts: async (query) => {
    console.log(`🔍 Searching products with query: "${query}"`);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.search(query);
      
      // API client already unwrapped the response
      const paginatedData = response.data;

      const pagination = {
        current_page: paginatedData.current_page || 1,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || get().perPage,
        total: paginatedData.total || 0,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };

      set({
        products: paginatedData.data || [],
        totalProducts: pagination.total,
        currentPage: pagination.current_page,
        lastPage: pagination.last_page,
        perPage: pagination.per_page,
        pagination: pagination,
        loading: false,
        error: null,
      });

      console.log(`✅ Search completed: ${paginatedData.data?.length || 0} products found`);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to search products:", error);
      set({
        loading: false,
        error: error.message || "Failed to search products",
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => {
    console.log("🔄 Resetting product store");
    if (get()._filterTimeout) {
      clearTimeout(get()._filterTimeout);
    }
    set({
      products: [],
      totalProducts: 0,
      currentPage: 1,
      lastPage: 1,
      perPage: 8,
      loading: false,
      error: null,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 8,
        total: 0,
        next_page_url: null,
        prev_page_url: null,
        first_page_url: null,
        last_page_url: null,
        path: null,
        from: null,
        to: null,
      },
      filters: {
        search: "",
        category_id: null,
        brand_id: null,
        status: "all",
        sortBy: "name",
        sortOrder: "asc",
      },
      _filterTimeout: null,
    });
  },
}));

export { useProductStore };
export default useProductStore;