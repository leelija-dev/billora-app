import { useState, useEffect } from 'react';
import { categoriesAPI } from '../api';

export const useCategories = (params = {}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesAPI.getAll(params);
      console.log('useCategories response:', response);
      
      // Handle the API response structure: { data: { data: [...categories] } }
      let categoriesData = [];
      
      if (response?.data?.data) {
        categoriesData = response.data.data;
      } else if (response?.data) {
        categoriesData = response.data;
      } else if (Array.isArray(response)) {
        categoriesData = response;
      }
      
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async () => {
    await fetchCategories();
  };

  const searchCategories = async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesAPI.search(query, filters);
      
      let categoriesData = [];
      if (response?.data?.data) {
        categoriesData = response.data.data;
      } else if (response?.data) {
        categoriesData = response.data;
      } else if (Array.isArray(response)) {
        categoriesData = response;
      }
      
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message || 'Failed to search categories');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesAPI.create(categoryData);
      
      // Refresh categories after creation
      await fetchCategories();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to create category');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesAPI.update(id, categoryData);
      
      // Refresh categories after update
      await fetchCategories();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to update category');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await categoriesAPI.delete(id);
      
      // Refresh categories after deletion
      await fetchCategories();
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getCategoryById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesAPI.getById(id);
      return response?.data?.data || response?.data || response;
    } catch (err) {
      setError(err.message || 'Failed to fetch category');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refreshCategories,
    searchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    fetchCategories,
  };
};