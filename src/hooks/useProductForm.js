import { useState } from 'react';
import { productsAPI } from '../api/products';

export const useProductForm = (productId = null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createProduct = async (productData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.create(productData);
      
      // Handle nested response structure
      if (response?.data?.status === true || response?.status === true || response?.data?.status === 'success') {
        return { success: true, data: response?.data?.data || response };
      } else {
        throw new Error(response?.message || response?.data?.message || 'Failed to create product');
      }
    } catch (err) {
      setError(err.message || 'Failed to create product');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productData) => {
    if (!productId) {
      setError('Product ID is required for update');
      return { success: false, error: 'Product ID is required for update' };
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.update(productId, productData);
      
      // Handle nested response structure
      if (response?.data?.status === true || response?.status === true || response?.data?.status === 'success') {
        return { success: true, data: response?.data?.data || response };
      } else {
        throw new Error(response?.message || response?.data?.message || 'Failed to update product');
      }
    } catch (err) {
      setError(err.message || 'Failed to update product');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async (productData) => {
    if (productId) {
      return await updateProduct(productData);
    } else {
      return await createProduct(productData);
    }
  };

  return {
    loading,
    error,
    createProduct,
    updateProduct,
    saveProduct,
    setError,
    clearError: () => setError(null),
  };
};
