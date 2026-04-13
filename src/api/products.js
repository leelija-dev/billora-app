import { apiClient } from './client';


export const productsAPI = {
  // Get all products
  getAll: async (params = {}) => {
    try {
      return await apiClient.get('/products', { params });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single product
  getById: async (id) => {
    try {
      const api = apiClient;
      return await api.get(`/products/${id}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new product
  create: async (productData) => {
    try {
      const api = apiClient;
      return await api.post('/products/store', {
        user_id: productData.user_id,
        sku: productData.sku,
        name: productData.name,
        brand_id: productData.brand_id,
        category_id: productData.category_id,
        unit_amount: productData.unit_amount,
        unit_id: productData.unit_id,
        selling_price: productData.selling_price,
        purchase_price: productData.purchase_price,
        gst_percentage: productData.gst_percentage,
        discount_percentage: productData.discount_percentage,
        description: productData.description,
        is_active: productData.is_active ?? true,
        created_by: productData.created_by,
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update product
  update: async (id, productData) => {
    try {
      const api = apiClient;
      return await api.put(`/products/${id}`, {
        user_id: productData.user_id,
        sku: productData.sku,
        name: productData.name,
        brand_id: productData.brand_id,
        category_id: productData.category_id,
        unit_amount: productData.unit_amount,
        unit_id: productData.unit_id,
        selling_price: productData.selling_price,
        purchase_price: productData.purchase_price,
        gst_percentage: productData.gst_percentage,
        discount_percentage: productData.discount_percentage,
        description: productData.description,
        is_active: productData.is_active,
        created_by: productData.created_by,
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete product
  delete: async (id) => {
    try {
      const api = apiClient;
      return await api.delete(`/products/${id}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Restore product (soft delete undo)
  restore: async (id) => {
    try {
      const api = apiClient;
      return await api.patch(`/products/${id}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Permanently delete product
  forceDelete: async (id) => {
    try {
      const api = apiClient;
      return await api.delete(`/products/${id}/force`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search products
  search: async (query, filters = {}) => {
    try {
      const api = apiClient;
      return await api.get('/products', {
        params: { search: query, ...filters }
      });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get products by category
  getByCategory: async (categoryId) => {
    try {
      const api = apiClient;
      return await api.get(`/products/category/${categoryId}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get products by brand
  getByBrand: async (brandId) => {
    try {
      const api = apiClient;
      return await api.get(`/products/brand/${brandId}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Legacy methods for backward compatibility
  getProducts: async (params = {}) => {
    try {
      const api = apiClient;
      return await api.get('/products', { params });
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getProduct: async (id) => {
    try {
      const api = apiClient;
      return await api.get(`/products/${id}`);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createProduct: async (productData) => {
    return await productsAPI.create(productData);
  },

  updateProduct: async (id, productData) => {
    return await productsAPI.update(id, productData);
  },

  deleteProduct: async (id) => {
    return await productsAPI.delete(id);
  },

  searchProducts: async (query, filters = {}) => {
    return await productsAPI.search(query, filters);
  },

  getProductCategories: async () => {
    try {
      const api = apiClient;
      return await api.get('/products/categories');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateStock: async (id, stockData) => {
    try {
      const api = apiClient;
      return await api.patch(`/products/${id}/stock`, stockData);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
