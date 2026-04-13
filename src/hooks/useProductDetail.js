import { useState, useEffect } from 'react';
import { productsAPI } from '../api/products';

export const useProductDetail = (productId) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.getById(productId);
      
      // Handle paginated API response structure
      let productData = null;
      if (response?.data?.data) {
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          // This is for list endpoints - not expected here
          productData = response.data.data.data.find(item => item.id == productId);
        } else if (response.data.data.id) {
          // Single product response
          productData = response.data.data;
        }
      } else if (response?.data?.id) {
        // Direct product data
        productData = response.data;
      } else if (response?.id) {
        // Response itself is the product
        productData = response;
      }
      
      setProduct(productData);
    } catch (err) {
      setError(err.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productData) => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.update(productId, productData);
      setProduct(response.data || response);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to update product');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError(null);
      await productsAPI.delete(productId);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete product');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (stockData) => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.updateStock(productId, stockData);
      setProduct(prev => ({ ...prev, ...response.data }));
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to update stock');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  return {
    product,
    loading,
    error,
    fetchProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    refreshProduct: fetchProduct,
  };
};
