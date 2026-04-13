import { useState, useEffect } from 'react';
import { categoriesAPI } from '../api';
import { productsAPI } from '../api/products';

export const useCategoryDetail = (categoryId) => {
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);

  const fetchCategory = async () => {
    if (!categoryId) {
      setError('Category ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await categoriesAPI.getById(categoryId);
      
      console.log('Raw API Response:', response); // Debug log
      
      // Extract category data from the nested structure
      // Response structure: { data: { data: { ...category }, message, status } }
      let categoryData = null;
      
      if (response?.data?.data) {
        // Your actual structure: response.data.data contains the category
        categoryData = response.data.data;
        console.log('Extracted Category Data:', categoryData);
      } else if (response?.data) {
        // Fallback: if data is directly the category
        categoryData = response.data;
      } else {
        // Fallback: response itself is the category
        categoryData = response;
      }
      
      setCategory(categoryData);
      
    } catch (err) {
      console.error('Error fetching category:', err);
      setError(err.message || 'Failed to fetch category');
      setCategory(null);
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (categoryData) => {
    if (!categoryId) {
      setError('Category ID is required for update');
      return { success: false, error: 'Category ID is required for update' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for API
      const updatePayload = {
        name: categoryData.name,
        description: categoryData.description,
        isActive: categoryData.is_active !== undefined ? categoryData.is_active : categoryData.isActive,
      };
      
      const response = await categoriesAPI.update(categoryId, updatePayload);
      console.log('Update Response:', response);
      
      // Extract updated category from response
      let updatedCategory = null;
      
      if (response?.data?.data) {
        updatedCategory = response.data.data;
      } else if (response?.data) {
        updatedCategory = response.data;
      } else {
        updatedCategory = response;
      }
      
      setCategory(updatedCategory);
      return { success: true, data: updatedCategory };
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.message || 'Failed to update category');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async () => {
    if (!categoryId) {
      setError('Category ID is required for delete');
      return { success: false, error: 'Category ID is required for delete' };
    }

    try {
      setLoading(true);
      setError(null);
      const response = await categoriesAPI.delete(categoryId);
      console.log('Delete Response:', response);
      
      // Check if deletion was successful
      // Your API returns { status: true, message: "...", data: null }
      if (response?.status === true || response?.data?.status === true) {
        return { success: true };
      } else {
        return { success: false, error: 'Delete operation failed' };
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryStatus = async () => {
    if (!category) {
      setError('No category data available');
      return { success: false, error: 'No category data available' };
    }

    const updatedData = {
      name: category.name,
      description: category.description,
      is_active: !category.is_active,
    };

    return await updateCategory(updatedData);
  };

  const fetchProductsByCategory = async () => {
    console.log('fetchProductsByCategory called with categoryId:', categoryId);
    if (!categoryId) {
      console.log('No categoryId, returning early');
      return;
    }

    try {
      console.log('Calling productsAPI.getAll with category_id:', categoryId);
      const response = await productsAPI.getAll({ category_id: categoryId });
      console.log('Products by Category Response:', response);
      
      let productsData = [];
      
      // Handle paginated response structure
      if (response?.data?.data?.data) {
        productsData = response.data.data.data;
      } else if (response?.data?.data) {
        productsData = response.data.data;
      } else if (response?.data) {
        productsData = response.data;
      } else {
        productsData = response;
      }
      
      console.log('Setting products:', Array.isArray(productsData) ? productsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      
    } catch (err) {
      console.error('Error fetching products by category:', err);
      setProducts([]);
    }
  };

  const refreshCategory = () => {
    fetchCategory();
    fetchProductsByCategory();
  };

  const clearError = () => setError(null);

  useEffect(() => {
    fetchCategory();
    fetchProductsByCategory();
  }, [categoryId]);

  return {
    category,
    loading,
    error,
    products,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    refreshCategory,
    clearError,
    fetchCategory,
  };
};