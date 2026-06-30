// api/products.js
import apiClient from './client';

export const productsAPI = {
  // Get create page data (brands, categories, units, input permissions)
  getCreatePage: async (userId) => {
    try {
      console.log(`📦 Fetching create page data for user: ${userId}`);
      const response = await apiClient.get(`/products/create/${userId}`);
      console.log("✅ Create page data fetched successfully:", response.data);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch create page data:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get all products with pagination
  getAll: async (search = "", page = 1, perPage = 15) => {
    try {
      const params = { page, per_page: perPage };
      if (search) params.search = search;
      console.log("📦 Fetching all products with params:", params);
      const response = await apiClient.get("/products", { params });
      console.log("✅ Products fetched successfully");
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch products:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get products by URL (for pagination)
  getByUrl: async (url) => {
    try {
      console.log("📦 Fetching products by URL:", url);
      
      // Extract the path from the full URL
      let path = url;
      
      // If url is a full URL with base URL, extract just the path and query
      if (url.startsWith('http')) {
        try {
          const urlObj = new URL(url);
          // Get the full path including query parameters
          path = urlObj.pathname + urlObj.search;
          console.log("📦 Extracted path from URL:", path);
        } catch (e) {
          console.warn("⚠️ Failed to parse URL, using as is:", url);
          path = url;
        }
      }
      
      // Since apiClient already has /api in baseURL, remove /api from the path
      // This prevents /api/api/products
      if (path.startsWith('/api/')) {
        path = path.replace('/api', '');
        console.log("📦 Removed /api prefix from path:", path);
      }
      
      // Ensure the path starts with a slash
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      
      console.log("📦 Final request path:", path);
      const response = await apiClient.get(path);
      console.log("✅ Products fetched by URL successfully");
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch products by URL:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get deleted products (soft deleted)
  getDeleted: async (userId = null, search = "", page = 1) => {
    try {
      const params = { page };
      if (search) params.search = search;
      console.log("📦 Fetching deleted products with params:", params);
      const response = await apiClient.get(`/products/deleted-products/${userId}`, { params });
      console.log("✅ Deleted products fetched successfully");
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch deleted products:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get single product
  getById: async (id) => {
    try {
      console.log(`📦 Fetching product with ID: ${id}`);
      const response = await apiClient.get(`/products/${id}`);
      console.log("✅ Product fetched successfully");
      return response;
    } catch (error) {
      console.error(`❌ Failed to fetch product ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Create product
  create: async (productData) => {
    try {
      console.log("📝 Creating product with data:", productData);

      const formData = new FormData();

      // Core required fields
      if (productData.user_id) formData.append("user_id", productData.user_id);
      if (productData.sku) formData.append("sku", productData.sku);
      if (productData.name) formData.append("name", productData.name);
      if (productData.category_id) formData.append("category_id", productData.category_id);
      if (productData.unit_amount) formData.append("unit_amount", productData.unit_amount);
      if (productData.unit_id) formData.append("unit_id", productData.unit_id);
      if (productData.is_active !== undefined) formData.append("is_active", productData.is_active ? 1 : 0);
      if (productData.created_by) formData.append("created_by", productData.created_by);

      // Optional fields
      if (productData.brand_id) formData.append("brand_id", productData.brand_id);
      if (productData.selling_price) formData.append("selling_price", productData.selling_price);
      if (productData.purchase_price) formData.append("purchase_price", productData.purchase_price);
      if (productData.gst_percentage) formData.append("gst_percentage", productData.gst_percentage);
      if (productData.purchase_gst_percentage) formData.append("purchase_gst_percentage", productData.purchase_gst_percentage);
      if (productData.discount_percentage) formData.append("discount_percentage", productData.discount_percentage);
      if (productData.description) formData.append("description", productData.description);

      // Additional optional fields
      if (productData.conversion_factor) formData.append("conversion_factor", productData.conversion_factor);
      if (productData.minimum_stock_quantity) formData.append("minimum_stock_quantity", productData.minimum_stock_quantity);
      if (productData.maximum_stock_quantity) formData.append("maximum_stock_quantity", productData.maximum_stock_quantity);
      if (productData.current_stock) formData.append("current_stock", productData.current_stock);
      if (productData.mrp) formData.append("mrp", productData.mrp);
      if (productData.wholesale_price) formData.append("wholesale_price", productData.wholesale_price);
      if (productData.gst_hsn_code) formData.append("gst_hsn_code", productData.gst_hsn_code);
      if (productData.discount_amount) formData.append("discount_amount", productData.discount_amount);
      if (productData.cess_percentage) formData.append("cess_percentage", productData.cess_percentage);

      // Handle attributes field
      if (productData.attributes && Array.isArray(productData.attributes)) {
        productData.attributes.forEach((attr, index) => {
          if (typeof attr === "object" && attr !== null) {
            Object.keys(attr).forEach((key) => {
              formData.append(`attributes[${index}][${key}]`, attr[key]);
            });
          }
        });
      }

      // Medicine and other fields
      if (productData.medicine_type_id) formData.append("medicine_type_id", productData.medicine_type_id);
      if (productData.expiry_date) formData.append("expiry_date", productData.expiry_date);
      if (productData.batch_number) formData.append("batch_number", productData.batch_number);
      if (productData.manufacturer_name) formData.append("manufacturer_name", productData.manufacturer_name);
      if (productData.prescription_required !== undefined) formData.append("prescription_required", productData.prescription_required ? 1 : 0);
      if (productData.schedule_type) formData.append("schedule_type", productData.schedule_type);
      if (productData.salt_composition) formData.append("salt_composition", productData.salt_composition);
      if (productData.perishable !== undefined) formData.append("perishable", productData.perishable ? 1 : 0);
      if (productData.organic_certified !== undefined) formData.append("organic_certified", productData.organic_certified ? 1 : 0);
      if (productData.harvest_date) formData.append("harvest_date", productData.harvest_date);
      if (productData.storage_instructions) formData.append("storage_instructions", productData.storage_instructions);
      if (productData.short_description) formData.append("short_description", productData.short_description);
      if (productData.is_featured !== undefined) formData.append("is_featured", productData.is_featured ? 1 : 0);
      if (productData.is_returnable !== undefined) formData.append("is_returnable", productData.is_returnable ? 1 : 0);
      if (productData.is_refundable !== undefined) formData.append("is_refundable", productData.is_refundable ? 1 : 0);
      if (productData.warranty_months) formData.append("warranty_months", productData.warranty_months);
      if (productData.warehouse_location) formData.append("warehouse_location", productData.warehouse_location);
      if (productData.supplier_id) formData.append("supplier_id", productData.supplier_id);
      if (productData.updated_by) formData.append("updated_by", productData.updated_by);

      // Handle single image
      if (productData.image) {
        if (productData.image.uri) {
          const filename = productData.image.uri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append("image", {
            uri: productData.image.uri,
            name: filename,
            type,
          });
        } else if (typeof productData.image === "string") {
          formData.append("existing_image", productData.image);
        }
      }

      // Handle multiple images
      if (productData.images && Array.isArray(productData.images)) {
        if (productData.images.length === 0) {
          formData.append("images", JSON.stringify([]));
        } else {
          productData.images.forEach((image, index) => {
            if (image.uri) {
              const filename = image.uri.split('/').pop();
              const match = /\.(\w+)$/.exec(filename);
              const type = match ? `image/${match[1]}` : 'image/jpeg';
              formData.append(`images[${index}]`, {
                uri: image.uri,
                name: filename,
                type,
              });
            } else if (typeof image === "string") {
              formData.append(`old_images[${index}]`, image);
            }
          });
        }
      } else {
        formData.append("images", JSON.stringify([]));
      }

      // Handle variants
      if (productData.variants && Array.isArray(productData.variants)) {
        productData.variants.forEach((variant, index) => {
          if (variant.size) formData.append(`variants[${index}][size]`, variant.size);
          if (variant.color) formData.append(`variants[${index}][color]`, variant.color);
          if (variant.material) formData.append(`variants[${index}][material]`, variant.material);
          if (variant.gender) formData.append(`variants[${index}][gender]`, variant.gender);
        });
      }

      const response = await apiClient.post("/products/store", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("✅ Product created successfully");
      return response;
    } catch (error) {
      console.error("❌ Failed to create product:", error);
      throw error.response?.data || error.message;
    }
  },

  // Update product
  update: async (id, productData) => {
    try {
      console.log(`✏️ Updating product ${id} with data:`, productData);

      const hasNewImages = productData.image?.uri || 
        (Array.isArray(productData.images) && productData.images.some(img => img.uri));

      let response;

      if (hasNewImages) {
        const formData = new FormData();

        // Core required fields
        if (productData.user_id) formData.append("user_id", productData.user_id);
        if (productData.sku) formData.append("sku", productData.sku);
        if (productData.name) formData.append("name", productData.name);
        if (productData.category_id) formData.append("category_id", productData.category_id);
        if (productData.unit_amount) formData.append("unit_amount", productData.unit_amount);
        if (productData.unit_id) formData.append("unit_id", productData.unit_id);
        if (productData.is_active !== undefined) formData.append("is_active", productData.is_active ? 1 : 0);
        if (productData.created_by) formData.append("created_by", productData.created_by);
        if (productData.updated_by) formData.append("updated_by", productData.updated_by);

        // Optional fields
        if (productData.brand_id) formData.append("brand_id", productData.brand_id);
        if (productData.selling_price) formData.append("selling_price", productData.selling_price);
        if (productData.purchase_price) formData.append("purchase_price", productData.purchase_price);
        if (productData.gst_percentage) formData.append("gst_percentage", productData.gst_percentage);
        if (productData.purchase_gst_percentage) formData.append("purchase_gst_percentage", productData.purchase_gst_percentage);
        if (productData.discount_percentage) formData.append("discount_percentage", productData.discount_percentage);
        if (productData.description) formData.append("description", productData.description);
        if (productData.conversion_factor) formData.append("conversion_factor", productData.conversion_factor);
        if (productData.minimum_stock_quantity) formData.append("minimum_stock_quantity", productData.minimum_stock_quantity);
        if (productData.maximum_stock_quantity) formData.append("maximum_stock_quantity", productData.maximum_stock_quantity);
        if (productData.current_stock) formData.append("current_stock", productData.current_stock);
        if (productData.mrp) formData.append("mrp", productData.mrp);
        if (productData.wholesale_price) formData.append("wholesale_price", productData.wholesale_price);
        if (productData.gst_hsn_code) formData.append("gst_hsn_code", productData.gst_hsn_code);
        if (productData.discount_amount) formData.append("discount_amount", productData.discount_amount);
        if (productData.cess_percentage) formData.append("cess_percentage", productData.cess_percentage);

        // Handle attributes
        if (productData.attributes && Array.isArray(productData.attributes)) {
          productData.attributes.forEach((attr, index) => {
            if (typeof attr === "object" && attr !== null) {
              Object.keys(attr).forEach((key) => {
                formData.append(`attributes[${index}][${key}]`, attr[key]);
              });
            }
          });
        }

        // Medicine and other fields
        if (productData.medicine_type_id) formData.append("medicine_type_id", productData.medicine_type_id);
        if (productData.expiry_date) formData.append("expiry_date", productData.expiry_date);
        if (productData.batch_number) formData.append("batch_number", productData.batch_number);
        if (productData.manufacturer_name) formData.append("manufacturer_name", productData.manufacturer_name);
        if (productData.prescription_required !== undefined) formData.append("prescription_required", productData.prescription_required ? 1 : 0);
        if (productData.schedule_type) formData.append("schedule_type", productData.schedule_type);
        if (productData.salt_composition) formData.append("salt_composition", productData.salt_composition);
        if (productData.perishable !== undefined) formData.append("perishable", productData.perishable ? 1 : 0);
        if (productData.organic_certified !== undefined) formData.append("organic_certified", productData.organic_certified ? 1 : 0);
        if (productData.harvest_date) formData.append("harvest_date", productData.harvest_date);
        if (productData.storage_instructions) formData.append("storage_instructions", productData.storage_instructions);
        if (productData.short_description) formData.append("short_description", productData.short_description);
        if (productData.is_featured !== undefined) formData.append("is_featured", productData.is_featured ? 1 : 0);
        if (productData.is_returnable !== undefined) formData.append("is_returnable", productData.is_returnable ? 1 : 0);
        if (productData.is_refundable !== undefined) formData.append("is_refundable", productData.is_refundable ? 1 : 0);
        if (productData.warranty_months) formData.append("warranty_months", productData.warranty_months);
        if (productData.warehouse_location) formData.append("warehouse_location", productData.warehouse_location);
        if (productData.supplier_id) formData.append("supplier_id", productData.supplier_id);

        // Handle single image
        if (productData.image) {
          if (productData.image.uri) {
            const filename = productData.image.uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            formData.append("image", {
              uri: productData.image.uri,
              name: filename,
              type,
            });
          } else if (typeof productData.image === "string") {
            formData.append("existing_image", productData.image);
          }
        }

        // Handle multiple images
        if (productData.images && Array.isArray(productData.images)) {
          productData.images.forEach((image) => {
            if (image.uri) {
              const filename = image.uri.split('/').pop();
              const match = /\.(\w+)$/.exec(filename);
              const type = match ? `image/${match[1]}` : 'image/jpeg';
              formData.append("images[]", {
                uri: image.uri,
                name: filename,
                type,
              });
            } else if (typeof image === "string") {
              formData.append("old_images[]", image);
            }
          });
        }

        // Handle variants
        if (productData.variants && Array.isArray(productData.variants)) {
          productData.variants.forEach((variant, index) => {
            if (variant.size) formData.append(`variants[${index}][size]`, variant.size);
            if (variant.color) formData.append(`variants[${index}][color]`, variant.color);
            if (variant.material) formData.append(`variants[${index}][material]`, variant.material);
            if (variant.gender) formData.append(`variants[${index}][gender]`, variant.gender);
          });
        }

        formData.append("_method", "PUT");

        response = await apiClient.post(`/products/${id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Use JSON for updates without new images
        const cleanedData = { ...productData };
        delete cleanedData.created_at;
        delete cleanedData.updated_at;
        delete cleanedData.deleted_at;

        // Clean up nullable fields
        const nullableFields = [
          "conversion_factor", "minimum_stock_quantity", "maximum_stock_quantity",
          "current_stock", "mrp", "wholesale_price", "gst_hsn_code", "discount_amount",
          "cess_percentage", "expiry_date", "batch_number", "manufacturer_name",
          "schedule_type", "salt_composition", "harvest_date", "storage_instructions",
          "short_description", "warehouse_location", "supplier_id", "updated_by"
        ];

        nullableFields.forEach((field) => {
          if (!cleanedData[field] || cleanedData[field] === "") {
            delete cleanedData[field];
          }
        });

        response = await apiClient.put(`/products/${id}`, cleanedData);
      }

      console.log("✅ Product updated successfully");
      return response;
    } catch (error) {
      console.error(`❌ Failed to update product ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Delete product (soft delete)
  delete: async (id) => {
    try {
      console.log(`🗑️ Deleting product with ID: ${id}`);
      const response = await apiClient.delete(`/products/${id}`);
      console.log("✅ Product deleted successfully");
      return response;
    } catch (error) {
      console.error(`❌ Failed to delete product ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Restore product
  restore: async (id) => {
    try {
      console.log(`♻️ Restoring product with ID: ${id}`);
      const response = await apiClient.patch(`/products/${id}/restore`);
      console.log("✅ Product restored successfully");
      return response;
    } catch (error) {
      console.error(`❌ Failed to restore product ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Permanently delete product
  forceDelete: async (id) => {
    try {
      console.log(`💥 Permanently deleting product with ID: ${id}`);
      const response = await apiClient.delete(`/products/${id}/force`);
      console.log("✅ Product permanently deleted");
      return response;
    } catch (error) {
      console.error(`❌ Failed to permanently delete product ${id}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Bulk soft delete products
  bulkDelete: async (ids) => {
    try {
      console.log(`📦 Bulk deleting products with IDs:`, ids);
      const response = await apiClient.delete("/products/bulk-delete", {
        data: { ids },
      });
      console.log("✅ Products bulk deleted successfully");
      return response;
    } catch (error) {
      console.error("❌ Failed to bulk delete products:", error);
      throw error.response?.data || error.message;
    }
  },

  // Bulk permanently delete products
  bulkForceDelete: async (ids) => {
    try {
      console.log(`💥 Bulk permanently deleting products with IDs:`, ids);
      const response = await apiClient.delete(`/products/bulk-force-delete`, {
        data: { ids },
      });
      console.log("✅ Products bulk permanently deleted");
      return response;
    } catch (error) {
      console.error("❌ Failed to bulk permanently delete products:", error);
      throw error.response?.data || error.message;
    }
  },

  // Search products
  search: async (query, filters = {}) => {
    try {
      console.log("🔍 Searching products with query:", query, filters);
      const response = await apiClient.get("/products", {
        params: { search: query, ...filters },
      });
      console.log("✅ Products search results fetched");
      return response;
    } catch (error) {
      console.error("❌ Failed to search products:", error);
      throw error.response?.data || error.message;
    }
  },

  // Get products by category
  getByCategory: async (categoryId, page = 1) => {
    try {
      console.log(`📂 Fetching products by category ID: ${categoryId}`);
      const response = await apiClient.get("/products", {
        params: { category_id: categoryId, page },
      });
      console.log("✅ Products by category fetched successfully");
      return response;
    } catch (error) {
      console.error(`❌ Failed to fetch products by category ${categoryId}:`, error);
      throw error.response?.data || error.message;
    }
  },
};

export default productsAPI;