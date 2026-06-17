// store/productStore.js
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
  },
  filters: {
    search: "",
    category_id: null,
    brand_id: null,
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  },

  // Get product total stock from stocks array
  getProductTotalStock: (product) => {
    if (!product || !product.stocks || !Array.isArray(product.stocks)) return 0;
    return product.stocks.reduce((total, stock) => {
      const quantity = parseFloat(stock.quantity) || 0;
      return total + quantity;
    }, 0);
  },

  // Get product stocks
  getProductStocks: (product) => {
    if (!product || !product.stocks || !Array.isArray(product.stocks)) return [];
    return product.stocks;
  },

  // Fetch products with pagination - FIXED for your API structure
  fetchProducts: async (page = 1, forceRefresh = false) => {
    const { filters, perPage } = get();
    
    console.log("🔄 fetchProducts called with page:", page, "filters:", filters);
    set({ loading: true, error: null });

    try {
      const params = { page, per_page: perPage };
      if (filters.search) params.search = filters.search;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.brand_id) params.brand_id = filters.brand_id;

      const response = await productsAPI.getAll(params.search, page, perPage);
      console.log("📦 Products API Response received");
      
      // Extract products and pagination data - FIXED for your API structure
      let productsArray = [];
      let paginationData = {};
      
      // Your API returns: response.data = { status, message, data: { current_page, data: [...], last_page, ... } }
      const apiData = response.data;
      
      if (apiData?.data) {
        // The products are at apiData.data.data
        if (apiData.data.data && Array.isArray(apiData.data.data)) {
          productsArray = apiData.data.data;
          paginationData = apiData.data;
          console.log("✅ Found products at apiData.data.data:", productsArray.length);
        } else if (Array.isArray(apiData.data)) {
          productsArray = apiData.data;
          paginationData = {
            current_page: page,
            last_page: 1,
            per_page: perPage,
            total: productsArray.length,
          };
          console.log("✅ Found products at apiData.data (array):", productsArray.length);
        } else {
          // Try to find data anywhere
          const possibleData = apiData.data.data || apiData.data || [];
          if (Array.isArray(possibleData)) {
            productsArray = possibleData;
            paginationData = {
              current_page: apiData.data.current_page || page,
              last_page: apiData.data.last_page || 1,
              per_page: apiData.data.per_page || perPage,
              total: apiData.data.total || possibleData.length,
            };
            console.log("✅ Found products in nested structure:", productsArray.length);
          } else {
            productsArray = [];
            paginationData = {
              current_page: page,
              last_page: 1,
              per_page: perPage,
              total: 0,
            };
          }
        }
      } else if (apiData && Array.isArray(apiData)) {
        productsArray = apiData;
        paginationData = {
          current_page: page,
          last_page: 1,
          per_page: perPage,
          total: productsArray.length,
        };
      } else {
        productsArray = [];
        paginationData = {
          current_page: page,
          last_page: 1,
          per_page: perPage,
          total: 0,
        };
      }
      
      // Ensure productsArray is an array
      if (!Array.isArray(productsArray)) {
        productsArray = [];
      }

      console.log("📊 Extracted products:", productsArray.length);
      console.log("📊 Pagination data:", paginationData);

      // Apply status filter locally (like desktop)
      let filteredProducts = [...productsArray];
      const { status, sortBy, sortOrder } = filters;
      
      if (status !== "all") {
        if (status === "active") {
          filteredProducts = productsArray.filter(p => p.is_active === 1);
        } else if (status === "inactive") {
          filteredProducts = productsArray.filter(p => p.is_active === 0);
        } else if (status === "low_stock") {
          filteredProducts = productsArray.filter(p => {
            const totalStock = get().getProductTotalStock(p);
            const minStock = p.minimum_stock_quantity || 10;
            return totalStock <= minStock && totalStock > 0;
          });
        } else if (status === "out_of_stock") {
          filteredProducts = productsArray.filter(p => get().getProductTotalStock(p) === 0);
        }
      }

      // Apply sorting
      filteredProducts.sort((a, b) => {
        let valA, valB;
        if (sortBy === "name") {
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
        } else if (sortBy === "price") {
          valA = parseFloat(a.selling_price || 0);
          valB = parseFloat(b.selling_price || 0);
        } else if (sortBy === "stock") {
          valA = get().getProductTotalStock(a);
          valB = get().getProductTotalStock(b);
        } else if (sortBy === "date") {
          valA = new Date(a.created_at || 0).getTime();
          valB = new Date(b.created_at || 0).getTime();
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

      // Build pagination data
      const pageData = {
        current_page: parseInt(paginationData.current_page) || page,
        last_page: parseInt(paginationData.last_page) || 1,
        per_page: parseInt(paginationData.per_page) || perPage,
        total: parseInt(paginationData.total) || filteredProducts.length,
        next_page_url: paginationData.next_page_url || null,
        prev_page_url: paginationData.prev_page_url || null,
        first_page_url: paginationData.first_page_url || null,
        last_page_url: paginationData.last_page_url || null,
      };

      console.log("✅ Final pagination data:", pageData);
      console.log("✅ last_page:", pageData.last_page);

      // Update state
      set({
        products: filteredProducts,
        totalProducts: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        loading: false,
      });

      console.log("✅ Products loaded:", filteredProducts.length, "Total:", pageData.total);
      return response;
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
        },
        loading: false,
        error: error.message || "Failed to fetch products",
      });
    }
  },

  // Fetch products by URL (for pagination)
  fetchProductsByUrl: async (url) => {
    if (!url) {
      console.warn("fetchProductsByUrl called with null URL");
      return;
    }

    console.log("🔄 fetchProductsByUrl called with URL:", url);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.getByUrl(url);
      console.log("📦 Products by URL Response received");

      // Extract data - same structure as fetchProducts
      let productsArray = [];
      let paginationData = {};
      
      const apiData = response.data;
      
      if (apiData?.data) {
        if (apiData.data.data && Array.isArray(apiData.data.data)) {
          productsArray = apiData.data.data;
          paginationData = apiData.data;
          console.log("✅ Found products at apiData.data.data:", productsArray.length);
        } else if (Array.isArray(apiData.data)) {
          productsArray = apiData.data;
          paginationData = {
            current_page: parseInt(url.match(/page=(\d+)/)?.[1] || 1),
            last_page: 1,
            per_page: get().perPage,
            total: productsArray.length,
          };
        } else {
          const possibleData = apiData.data.data || apiData.data || [];
          if (Array.isArray(possibleData)) {
            productsArray = possibleData;
            paginationData = {
              current_page: apiData.data.current_page || parseInt(url.match(/page=(\d+)/)?.[1] || 1),
              last_page: apiData.data.last_page || 1,
              per_page: apiData.data.per_page || get().perPage,
              total: apiData.data.total || possibleData.length,
            };
          } else {
            productsArray = [];
            paginationData = {
              current_page: parseInt(url.match(/page=(\d+)/)?.[1] || 1),
              last_page: 1,
              per_page: get().perPage,
              total: 0,
            };
          }
        }
      } else {
        productsArray = [];
        paginationData = {
          current_page: parseInt(url.match(/page=(\d+)/)?.[1] || 1),
          last_page: 1,
          per_page: get().perPage,
          total: 0,
        };
      }

      // Apply filters and sorting (same as fetchProducts)
      let filteredProducts = [...productsArray];
      const { status, sortBy, sortOrder } = get().filters;
      
      if (status !== "all") {
        if (status === "active") {
          filteredProducts = productsArray.filter(p => p.is_active === 1);
        } else if (status === "inactive") {
          filteredProducts = productsArray.filter(p => p.is_active === 0);
        } else if (status === "low_stock") {
          filteredProducts = productsArray.filter(p => {
            const totalStock = get().getProductTotalStock(p);
            const minStock = p.minimum_stock_quantity || 10;
            return totalStock <= minStock && totalStock > 0;
          });
        } else if (status === "out_of_stock") {
          filteredProducts = productsArray.filter(p => get().getProductTotalStock(p) === 0);
        }
      }

      // Apply sorting
      filteredProducts.sort((a, b) => {
        let valA, valB;
        if (sortBy === "name") {
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
        } else if (sortBy === "price") {
          valA = parseFloat(a.selling_price || 0);
          valB = parseFloat(b.selling_price || 0);
        } else if (sortBy === "stock") {
          valA = get().getProductTotalStock(a);
          valB = get().getProductTotalStock(b);
        } else if (sortBy === "date") {
          valA = new Date(a.created_at || 0).getTime();
          valB = new Date(b.created_at || 0).getTime();
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

      const pageData = {
        current_page: parseInt(paginationData.current_page) || parseInt(url.match(/page=(\d+)/)?.[1] || 1),
        last_page: parseInt(paginationData.last_page) || 1,
        per_page: parseInt(paginationData.per_page) || get().perPage,
        total: parseInt(paginationData.total) || filteredProducts.length,
        next_page_url: paginationData.next_page_url || null,
        prev_page_url: paginationData.prev_page_url || null,
        first_page_url: paginationData.first_page_url || null,
        last_page_url: paginationData.last_page_url || null,
      };

      set({
        products: filteredProducts,
        totalProducts: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        loading: false,
      });

      console.log("✅ Products by URL loaded:", filteredProducts.length);
    } catch (error) {
      console.error("❌ Failed to fetch products by URL:", error);
      set({
        loading: false,
        error: error.message || "Failed to fetch products",
      });
    }
  },

  // Get single product
  getProduct: async (id) => {
    console.log("🔍 getProduct called with:", id);
    try {
      const response = await productsAPI.getById(id);
      let productData = null;
      
      if (response?.data?.data?.data) {
        productData = response.data.data.data;
      } else if (response?.data?.data) {
        productData = response.data.data;
      } else if (response?.data) {
        productData = response.data;
      } else {
        productData = response;
      }
      
      return productData;
    } catch (error) {
      console.error("❌ Failed to fetch product:", error);
      throw error;
    }
  },

  // Create product
  createProduct: async (productData) => {
    console.log("📝 createProduct called with:", productData);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.create(productData);
      console.log("✅ Product created successfully:", response);
      
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
    console.log("✏️ updateProduct called with:", id, productData);
    set({ loading: true, error: null });

    try {
      const response = await productsAPI.update(id, productData);
      console.log("✅ Product updated successfully:", response);
      
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

      await get().fetchProducts(get().currentPage, true);
      
      set({ loading: false });
      return { success: true, data: updatedProduct };
    } catch (error) {
      console.error("❌ Failed to update product:", error);
      set({
        error: error.message || "Failed to update product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Delete product (soft delete)
  deleteProduct: async (id) => {
    console.log("🗑️ deleteProduct called with:", id);
    set({ loading: true, error: null });

    try {
      await productsAPI.delete(id);
      console.log("✅ Product deleted successfully");

      await get().fetchProducts(get().currentPage, true);
      
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to delete product:", error);
      set({
        error: error.message || "Failed to delete product",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Set filters
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ 
      filters: updatedFilters,
      currentPage: 1
    });

    setTimeout(() => {
      get().fetchProducts(1, true);
    }, 100);
  },

  // Change page
  setPage: (page) => {
    const { lastPage, currentPage, pagination } = get();
    
    console.log("📄 setPage called with:", page, "current:", currentPage, "last:", lastPage);
    
    if (page < 1) page = 1;
    if (page > lastPage) page = lastPage;
    
    if (page !== currentPage) {
      console.log("📄 Changing page to:", page);
      set({ currentPage: page });
      
      // Try to use pagination URL if available (like desktop)
      let pageUrl = null;
      if (pagination) {
        if (page === 1 && pagination.first_page_url) {
          pageUrl = pagination.first_page_url;
        } else if (page === pagination.last_page && pagination.last_page_url) {
          pageUrl = pagination.last_page_url;
        } else if (pagination.first_page_url) {
          // Construct URL with page parameter
          const baseUrl = pagination.first_page_url.split('?')[0];
          const searchParams = new URLSearchParams(pagination.first_page_url.split('?')[1] || '');
          searchParams.set('page', page);
          pageUrl = `${baseUrl}?${searchParams.toString()}`;
        }
      }
      
      if (pageUrl) {
        get().fetchProductsByUrl(pageUrl);
      } else {
        get().fetchProducts(page, true);
      }
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useProductStore;