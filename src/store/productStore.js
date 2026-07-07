// store/productStore.js
import { create } from "zustand";
import { productsAPI } from "../api/products";
import { getPaginatedData, getEntityData } from "../api/client";

const useProductStore = create((set, get) => ({
  // State
  products: [],
  totalProducts: 0,
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
    category_id: null,
    brand_id: null,
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  },
  _filterTimeout: null,

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

  // ✅ FIXED: Fetch products with pagination
  fetchProducts: async (page = 1, append = false) => {
    const { filters, perPage, products: existingProducts } = get();

    console.log("🔄 fetchProducts called:", { page, append, filters });
    
    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await productsAPI.getAll(filters.search, page, perPage);
      console.log("📦 Products API Response received");

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("📊 Extracted paginated data:", paginatedData);

      // Extract products array
      let productsData = paginatedData.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(productsData)) {
        productsData = [];
      }

      console.log(`📦 Extracted ${productsData.length} products`);

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

      // If append is true, append to existing products (with duplicate prevention)
      let finalProducts;
      if (append && page > 1) {
        const existingIds = new Set(existingProducts.map(p => p.id));
        const uniqueNewProducts = productsData.filter(p => !existingIds.has(p.id));
        finalProducts = [...existingProducts, ...uniqueNewProducts];
        console.log(`📦 Appended ${uniqueNewProducts.length} new products, total: ${finalProducts.length}`);
      } else {
        finalProducts = productsData;
      }

      set({
        products: finalProducts,
        totalProducts: paginatedData.total || finalProducts.length,
        currentPage: paginatedData.current_page || page,
        lastPage: paginatedData.last_page || 1,
        perPage: paginatedData.per_page || perPage,
        pagination: paginatedData,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Products loaded successfully: ${finalProducts.length} products, hasMore: ${hasMoreData}`);
      return { success: true, data: finalProducts, pagination: paginatedData };
      
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
      
      const errorMessage = error.message || "Failed to fetch products";
      set({
        products: append ? get().products : [],
        totalProducts: append ? get().totalProducts : 0,
        loading: false,
        loadingMore: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Load more products for pagination
  loadMoreProducts: async () => {
    const { hasMore, loading, loadingMore, currentPage, lastPage, filters, perPage } = get();

    if (loading || loadingMore || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    const nextPage = currentPage + 1;
    console.log(`🔄 loadMoreProducts called with page: ${nextPage}`);
    
    try {
      const response = await productsAPI.getAll(filters.search, nextPage, perPage);
      console.log("📦 Products API Response received for page:", nextPage);

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("📊 Load more paginated:", paginatedData);

      let productsData = paginatedData.data || [];
      
      if (!Array.isArray(productsData)) {
        productsData = [];
      }

      console.log(`📦 Extracted ${productsData.length} products from page ${nextPage}`);

      const { products: existingProducts } = get();
      // Create a Set of existing product IDs to avoid duplicates
      const existingIds = new Set(existingProducts.map(p => p.id));
      const uniqueNewProducts = productsData.filter(p => !existingIds.has(p.id));

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

      set({
        products: [...existingProducts, ...uniqueNewProducts],
        totalProducts: paginatedData.total || get().totalProducts,
        currentPage: paginatedData.current_page || nextPage,
        lastPage: paginatedData.last_page || 1,
        perPage: paginatedData.per_page || perPage,
        pagination: paginatedData,
        hasMore: hasMoreData,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Load more completed: ${uniqueNewProducts.length} new products, total: ${get().products.length}, hasMore: ${hasMoreData}`);
      return { success: true, data: uniqueNewProducts };
      
    } catch (error) {
      console.error(`❌ Failed to load more products:`, error);
      
      const errorMessage = error.message || "Failed to load more products";
      set({
        loadingMore: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Fetch products by URL (for pagination)
  fetchProductsByUrl: async (url) => {
    if (!url) {
      console.warn("⚠️ fetchProductsByUrl called with null URL");
      return;
    }

    console.log("🔄 fetchProductsByUrl called with URL:", url);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.getByUrl(url);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("📊 Products by URL paginated:", paginatedData);

      let productsData = paginatedData.data || [];
      
      if (!Array.isArray(productsData)) {
        productsData = [];
      }

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

      set({
        products: productsData,
        totalProducts: paginatedData.total || productsData.length,
        currentPage: paginatedData.current_page || 1,
        lastPage: paginatedData.last_page || 1,
        perPage: paginatedData.per_page || get().perPage,
        pagination: paginatedData,
        hasMore: hasMoreData,
        loading: false,
        error: null,
      });

      console.log(`✅ Products by URL loaded: ${productsData.length} products`);
      return { success: true, data: productsData, pagination: paginatedData };
      
    } catch (error) {
      console.error("❌ Failed to fetch products by URL:", error);
      
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
      return get().fetchProducts(page, false);
    }
  },

  // ✅ FIXED: Get single product
  getProduct: async (id) => {
    console.log(`🔍 getProduct called with ID: ${id}`);
    set({ loading: true, error: null });
    
    try {
      const response = await productsAPI.getById(id);
      console.log(`✅ Product ${id} fetched successfully`);
      
      // ✅ Use helper to extract entity data
      const productData = getEntityData(response);
      console.log("📊 Extracted product:", productData);
      
      set({ loading: false, error: null });
      return { success: true, data: productData };
      
    } catch (error) {
      console.error(`❌ Failed to fetch product ${id}:`, error);
      set({ 
        loading: false, 
        error: error.message || 'Failed to fetch product' 
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Create product
  createProduct: async (productData) => {
    console.log("📝 createProduct called");
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.create(productData);
      console.log("✅ Product created successfully:", response);

      // ✅ Use helper to extract entity data
      const newProduct = getEntityData(response);
      console.log("📊 Extracted new product:", newProduct);

      // Optimistic update
      if (newProduct && newProduct.id) {
        const { products } = get();
        set({
          products: [newProduct, ...products],
          totalProducts: products.length + 1,
          loading: false,
          error: null,
        });
      }

      // Optionally refresh the list
      // await get().fetchProducts(1, false);

      set({ loading: false, error: null });
      return { success: true, data: newProduct };
      
    } catch (error) {
      console.error("❌ Failed to create product:", error);
      
      const errorMessage = error.message || "Failed to create product";
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Update product
  updateProduct: async (id, productData) => {
    console.log(`✏️ updateProduct called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.update(id, productData);
      console.log(`✅ Product ${id} updated successfully:`, response);

      // ✅ Use helper to extract entity data
      const updatedProduct = getEntityData(response);
      console.log("📊 Extracted updated product:", updatedProduct);

      // Optimistic update
      if (updatedProduct && updatedProduct.id) {
        const { products } = get();
        set({
          products: products.map(p => 
            p.id === id ? updatedProduct : p
          ),
          loading: false,
          error: null,
        });
      }

      // Optionally refresh the list
      // await get().fetchProducts(get().currentPage, false);

      set({ loading: false, error: null });
      return { success: true, data: updatedProduct };
      
    } catch (error) {
      console.error(`❌ Failed to update product ${id}:`, error);
      
      const errorMessage = error.message || "Failed to update product";
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Delete product (soft delete)
  deleteProduct: async (id) => {
    console.log(`🗑️ deleteProduct called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      await productsAPI.delete(id);
      console.log(`✅ Product ${id} deleted successfully`);

      // Remove from local state
      const { products } = get();
      set({
        products: products.filter(p => p.id !== id),
        totalProducts: Math.max(0, products.length - 1),
        loading: false,
        error: null,
      });

      // Optionally refresh the list
      // await get().fetchProducts(get().currentPage, false);

      set({ loading: false, error: null });
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Failed to delete product ${id}:`, error);
      
      const errorMessage = error.message || "Failed to delete product";
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Restore product
  restoreProduct: async (id) => {
    console.log(`♻️ restoreProduct called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      await productsAPI.restore(id);
      console.log(`✅ Product ${id} restored successfully`);

      // Refresh products list at current page
      await get().fetchProducts(get().currentPage, false);

      set({ loading: false, error: null });
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Failed to restore product ${id}:`, error);
      
      const errorMessage = error.message || "Failed to restore product";
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Permanently delete product
  forceDeleteProduct: async (id) => {
    console.log(`💥 forceDeleteProduct called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      await productsAPI.forceDelete(id);
      console.log(`✅ Product ${id} permanently deleted`);

      // Remove from local state
      const { products } = get();
      set({
        products: products.filter(p => p.id !== id),
        totalProducts: Math.max(0, products.length - 1),
        loading: false,
        error: null,
      });

      // Optionally refresh the list
      // await get().fetchProducts(get().currentPage, false);

      return { success: true };
      
    } catch (error) {
      console.error(`❌ Failed to permanently delete product ${id}:`, error);
      
      const errorMessage = error.message || "Failed to permanently delete product";
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Bulk delete products
  bulkDeleteProducts: async (ids) => {
    console.log(`📦 Bulk delete called for ${ids.length} products`);
    set({ loading: true, error: null });

    try {
      await productsAPI.bulkDelete(ids);
      console.log(`✅ ${ids.length} products bulk deleted successfully`);

      // Remove from local state
      const { products } = get();
      const idsSet = new Set(ids);
      set({
        products: products.filter(p => !idsSet.has(p.id)),
        totalProducts: Math.max(0, products.length - ids.length),
        loading: false,
        error: null,
      });

      // Optionally refresh the list
      // await get().fetchProducts(get().currentPage, false);

      return { success: true };
      
    } catch (error) {
      console.error("❌ Failed to bulk delete products:", error);
      
      const errorMessage = error.message || "Failed to bulk delete products";
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Bulk force delete products
  bulkForceDeleteProducts: async (ids) => {
    console.log(`💥 Bulk force delete called for ${ids.length} products`);
    set({ loading: true, error: null });

    try {
      await productsAPI.bulkForceDelete(ids);
      console.log(`✅ ${ids.length} products bulk permanently deleted`);

      // Remove from local state
      const { products } = get();
      const idsSet = new Set(ids);
      set({
        products: products.filter(p => !idsSet.has(p.id)),
        totalProducts: Math.max(0, products.length - ids.length),
        loading: false,
        error: null,
      });

      // Optionally refresh the list
      // await get().fetchProducts(get().currentPage, false);

      return { success: true };
      
    } catch (error) {
      console.error("❌ Failed to bulk force delete products:", error);
      
      const errorMessage = error.message || "Failed to bulk force delete products";
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Set filters with auto-fetch
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    console.log("🔍 Setting filters:", updatedFilters);
    
    set({
      filters: updatedFilters,
      currentPage: 1,
      hasMore: true,
    });

    if (get()._filterTimeout) {
      clearTimeout(get()._filterTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      get().fetchProducts(1, false);
    }, 300);

    set({ _filterTimeout: timeoutId });
  },

  // ✅ FIXED: Set page with proper pagination
  setPage: (page) => {
    const { lastPage, currentPage, pagination } = get();

    console.log(`📄 setPage called with: ${page}, current: ${currentPage}, last: ${lastPage}`);

    if (page < 1) page = 1;
    if (page > lastPage) page = lastPage;

    if (page !== currentPage) {
      console.log(`📄 Changing page from ${currentPage} to ${page}`);
      set({ currentPage: page });

      let pageUrl = null;
      
      if (pagination) {
        if (page === 1 && pagination.first_page_url) {
          pageUrl = pagination.first_page_url;
        } else if (page === pagination.last_page && pagination.last_page_url) {
          pageUrl = pagination.last_page_url;
        } else if (pagination.next_page_url && page === currentPage + 1) {
          pageUrl = pagination.next_page_url;
        } else if (pagination.prev_page_url && page === currentPage - 1) {
          pageUrl = pagination.prev_page_url;
        } else {
          const basePath = pagination.path || "/products";
          pageUrl = `${basePath}?page=${page}`;
        }
      } else {
        pageUrl = `/products?page=${page}`;
      }

      if (pageUrl) {
        get().fetchProductsByUrl(pageUrl);
      } else {
        get().fetchProducts(page, false);
      }
    }
  },

  // ✅ FIXED: Search products
  searchProducts: async (query) => {
    console.log(`🔍 Searching products with query: "${query}"`);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.search(query);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("🔍 Search results paginated:", paginatedData);

      let productsData = paginatedData.data || [];
      
      if (!Array.isArray(productsData)) {
        productsData = [];
      }

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

      set({
        products: productsData,
        totalProducts: paginatedData.total || productsData.length,
        currentPage: paginatedData.current_page || 1,
        lastPage: paginatedData.last_page || 1,
        perPage: paginatedData.per_page || get().perPage,
        pagination: paginatedData,
        hasMore: hasMoreData,
        loading: false,
        error: null,
      });

      console.log(`✅ Search completed: ${productsData.length} products found`);
      return { success: true, data: productsData, pagination: paginatedData };
      
    } catch (error) {
      console.error("❌ Failed to search products:", error);
      
      const errorMessage = error.message || "Failed to search products";
      set({
        loading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ Reset to page 1
  resetToPageOne: async () => {
    await get().fetchProducts(1, false);
  },

  // ✅ Clear error
  clearError: () => set({ error: null }),

  // ✅ Reset store
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
      loadingMore: false,
      hasMore: true,
      error: null,
      pagination: null,
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