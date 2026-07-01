// store/productStore.js - COMPLETE FIXED VERSION
import { create } from "zustand";
import { productsAPI } from "../api/products";

const useProductStore = create((set, get) => ({
  products: [],
  totalProducts: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 15,
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
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
  fetchProducts: async (page = 1, forceRefresh = false) => {
    const { filters, perPage } = get();

    console.log("🔄 fetchProducts called with page:", page, "forceRefresh:", forceRefresh);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.getAll(filters.search, page, perPage);
      console.log("📦 Products API Response received");
      console.log("📦 Full response object:", response);
      console.log("📦 response.data:", response.data);
      console.log("📦 response.data type:", typeof response.data);

      let responseData = response.data;
      
      // Parse JSON string if response.data is a string
      if (typeof responseData === 'string') {
        console.log("📦 response.data is string, parsing JSON...");
        try {
          responseData = JSON.parse(responseData);
          console.log("✅ JSON parsed successfully");
        } catch (parseError) {
          console.error("❌ Failed to parse JSON string:", parseError);
          throw new Error("Invalid JSON response from server");
        }
      }
      
      // Handle different response structures from backend
      // Backend returns: { status: true, message: "...", data: { current_page, data: [...], ... } }
      let paginationData, products;
      
      if (responseData?.data && typeof responseData.data === 'object') {
        // Standard Laravel response with pagination
        paginationData = responseData.data;
        products = paginationData.data || [];
      } else if (responseData?.current_page !== undefined) {
        // Direct pagination object
        paginationData = responseData;
        products = paginationData.data || [];
      } else if (Array.isArray(responseData)) {
        // Direct array response
        products = responseData;
        paginationData = {
          current_page: 1,
          last_page: 1,
          per_page: products.length,
          total: products.length,
          next_page_url: null,
          prev_page_url: null,
          first_page_url: null,
          last_page_url: null,
          path: null,
          from: null,
          to: null,
        };
      } else {
        // Fallback
        console.warn("⚠️ Unexpected response structure:", responseData);
        products = [];
        paginationData = {
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

      console.log(`📦 Extracted ${products.length} products`);
      console.log("📄 Pagination info:", {
        current_page: paginationData.current_page,
        last_page: paginationData.last_page,
        total: paginationData.total,
        per_page: paginationData.per_page,
        first_page_url: paginationData.first_page_url,
        last_page_url: paginationData.last_page_url,
        next_page_url: paginationData.next_page_url,
        prev_page_url: paginationData.prev_page_url,
      });

      const pagination = {
        current_page: paginationData.current_page || 1,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || perPage,
        total: paginationData.total || 0,
        next_page_url: paginationData.next_page_url || null,
        prev_page_url: paginationData.prev_page_url || null,
        first_page_url: paginationData.first_page_url || null,
        last_page_url: paginationData.last_page_url || null,
        path: paginationData.path || null,
        from: paginationData.from || null,
        to: paginationData.to || null,
      };

      set({
        products: products,
        totalProducts: pagination.total,
        currentPage: pagination.current_page,
        lastPage: pagination.last_page,
        perPage: pagination.per_page,
        pagination: pagination,
        loading: false,
        error: null,
      });

      console.log(`✅ Products loaded successfully: ${products.length} products`);
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

      let responseData = response.data;
      
      // Parse JSON string if response.data is a string
      if (typeof responseData === 'string') {
        console.log("📦 response.data is string in fetchProductsByUrl, parsing JSON...");
        try {
          responseData = JSON.parse(responseData);
          console.log("✅ JSON parsed successfully in fetchProductsByUrl");
        } catch (parseError) {
          console.error("❌ Failed to parse JSON string in fetchProductsByUrl:", parseError);
          throw new Error("Invalid JSON response from server");
        }
      }
      
      // Validate response structure
      if (!responseData || typeof responseData !== 'object') {
        throw new Error("Invalid API response structure");
      }

      // Handle different response structures from backend
      let paginationData, products;
      
      if (responseData?.data && typeof responseData.data === 'object') {
        // Standard Laravel response with pagination
        paginationData = responseData.data;
        products = paginationData.data || [];
      } else if (responseData?.current_page !== undefined) {
        // Direct pagination object
        paginationData = responseData;
        products = paginationData.data || [];
      } else if (Array.isArray(responseData)) {
        // Direct array response
        products = responseData;
        paginationData = {
          current_page: 1,
          last_page: 1,
          per_page: products.length,
          total: products.length,
          next_page_url: null,
          prev_page_url: null,
          first_page_url: null,
          last_page_url: null,
          path: null,
          from: null,
          to: null,
        };
      } else {
        // Fallback
        console.warn("⚠️ Unexpected response structure in fetchProductsByUrl:", responseData);
        products = [];
        paginationData = {
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
        };
      }

      console.log(`📦 Extracted ${products.length} products from URL`);
      console.log("📄 Pagination from URL:", {
        current_page: paginationData.current_page,
        last_page: paginationData.last_page,
        total: paginationData.total,
        per_page: paginationData.per_page,
        first_page_url: paginationData.first_page_url,
        last_page_url: paginationData.last_page_url,
        next_page_url: paginationData.next_page_url,
        prev_page_url: paginationData.prev_page_url,
      });

      const pagination = {
        current_page: paginationData.current_page || 1,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || get().perPage,
        total: paginationData.total || 0,
        next_page_url: paginationData.next_page_url || null,
        prev_page_url: paginationData.prev_page_url || null,
        first_page_url: paginationData.first_page_url || null,
        last_page_url: paginationData.last_page_url || null,
        path: paginationData.path || null,
        from: paginationData.from || null,
        to: paginationData.to || null,
      };

      set({
        products: products,
        totalProducts: pagination.total,
        currentPage: pagination.current_page,
        lastPage: pagination.last_page,
        perPage: pagination.per_page,
        pagination: pagination,
        loading: false,
        error: null,
      });

      console.log(`✅ Products by URL loaded: ${products.length} products`);
      return response.data;
    } catch (error) {
      // Silently fall back to regular fetchProducts on errors
      // Extract page number from URL as fallback
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

      // Fallback to regular fetchProducts
      return get().fetchProducts(page, true);
    }
  },

  // Get single product
  getProduct: async (id) => {
    console.log(`🔍 getProduct called with ID: ${id}`);
    try {
      const response = await productsAPI.getById(id);
      let productData = null;

      // Handle different response structures
      if (response?.data?.data?.data) {
        productData = response.data.data.data;
      } else if (response?.data?.data) {
        productData = response.data.data;
      } else if (response?.data) {
        productData = response.data;
      } else {
        productData = response;
      }

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

      let newProduct = null;
      if (response?.data?.data?.data) {
        newProduct = response.data.data.data;
      } else if (response?.data?.data) {
        newProduct = response.data.data;
      } else if (response?.data) {
        newProduct = response.data;
      } else {
        newProduct = response;
      }

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

      let updatedProduct = null;
      if (response?.data?.data?.data) {
        updatedProduct = response.data.data.data;
      } else if (response?.data?.data) {
        updatedProduct = response.data.data;
      } else if (response?.data) {
        updatedProduct = response.data;
      } else {
        updatedProduct = response;
      }

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
    setTimeout(() => {
      get().fetchProducts(1, true);
    }, 300);
  },

  // Set page with proper pagination
  setPage: (page) => {
    const { lastPage, currentPage, pagination } = get();

    console.log(
      `📄 setPage called with: ${page}, current: ${currentPage}, last: ${lastPage}`
    );

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
        // Use the path from pagination or fallback to /products
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

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => {
    console.log("🔄 Resetting product store");
    set({
      products: [],
      totalProducts: 0,
      currentPage: 1,
      lastPage: 1,
      perPage: 15,
      loading: false,
      error: null,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
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
    });
  },
}));

export { useProductStore };
export default useProductStore;