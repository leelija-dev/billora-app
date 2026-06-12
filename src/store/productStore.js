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
  },
  filters: {
    search: "",
    category_id: null,
    brand_id: null,
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  },

  // Get product total stock from stocks array (like desktop)
  getProductTotalStock: (product) => {
    if (!product || !product.stocks || !Array.isArray(product.stocks)) return 0;
    return product.stocks.reduce((total, stock) => {
      const quantity = parseFloat(stock.quantity) || 0;
      return total + quantity;
    }, 0);
  },

  // Get product stocks (like desktop)
  getProductStocks: (product) => {
    if (!product || !product.stocks || !Array.isArray(product.stocks)) return [];
    return product.stocks;
  },

  // Fetch products with pagination
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
      console.log("📦 Products API Full Response:", response);
      
      let productsArray = [];
      let paginationData = {};
      
      if (response?.data?.data?.data) {
        productsArray = response.data.data.data;
        paginationData = response.data.data;
      } else if (response?.data?.data) {
        productsArray = Array.isArray(response.data.data) ? response.data.data : [];
        paginationData = response.data;
      } else if (response?.data) {
        productsArray = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        productsArray = response;
      }
      
      if (!Array.isArray(productsArray)) {
        productsArray = [];
      }

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

      const pageData = {
        current_page: paginationData.current_page || page,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || perPage,
        total: paginationData.total || filteredProducts.length,
      };

      set({
        products: filteredProducts,
        totalProducts: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        loading: false,
      });

      console.log("✅ Products loaded:", filteredProducts.length);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
      set({
        products: [],
        totalProducts: 0,
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
    set({ filters: updatedFilters });

    setTimeout(() => {
      get().fetchProducts(1, true);
    }, 100);
  },

  // Change page
  setPage: (page) => {
    if (page >= 1 && page <= get().lastPage) {
      get().fetchProducts(page, true);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useProductStore;