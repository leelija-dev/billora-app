import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { categoriesAPI } from '../api';
import { useCategoryDetail } from './useCategoryDetail';
import { useAuthStore } from '../store/authStore';

export const useCategoryForm = (categoryId = null) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Get current user from auth store
  const { user } = useAuthStore?.() || { user: null };
  
  // Fetch category details if editing
  const { category, loading: loadingCategory } = useCategoryDetail(categoryId);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  // Populate form when editing
  useEffect(() => {
    if (category && categoryId) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        is_active: category.is_active === 1 || category.is_active === true,
      });
    }
  }, [category, categoryId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Category name is required';
    }
    
    return errors;
  };

  const createCategory = async (categoryData) => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      // Get user_id from current user or use default
      const userId = user?.id || user?.user_id || '1';
      
      // Prepare data for API
      const payload = {
        name: categoryData.name?.trim() || formData.name?.trim(),
        description: categoryData.description?.trim() || formData.description?.trim() || '',
        isActive: categoryData.is_active !== undefined ? categoryData.is_active : formData.is_active,
        userId: userId,
        createdBy: userId,
      };
      
      console.log('Create payload:', payload);
      const response = await categoriesAPI.create(payload);
      console.log('Create response:', response);
      
      // Handle nested response structure
      if (response?.status === true || response?.data?.status === true) {
        const createdCategory = response?.data?.data || response?.data || response;
        
        // Navigate back to categories screen after successful creation
        navigation.navigate('Categories');
        
        return { 
          success: true, 
          data: createdCategory 
        };
      } else {
        throw new Error(response?.message || 'Failed to create category');
      }
    } catch (err) {
      console.error('Create category error:', err);
      
      // Handle validation errors
      if (err.response?.status === 422) {
        const errors = err.response?.data?.errors || {};
        setValidationErrors(errors);
        setError('Please check the form for errors');
        return { 
          success: false, 
          error: 'Validation failed',
          errors: errors 
        };
      }
      
      setError(err.message || 'Failed to create category');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id, categoryData) => {
    const updateId = categoryId || id;
    
    if (!updateId) {
      setError('Category ID is required for update');
      return { success: false, error: 'Category ID is required for update' };
    }
    
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      // Get user_id from the existing category
      const userId = category?.user_id || category?.created_by;
      
      // Prepare data for API
      const payload = {
        name: categoryData.name?.trim() || formData.name?.trim(),
        description: categoryData.description?.trim() || formData.description?.trim() || '',
        isActive: categoryData.is_active !== undefined ? categoryData.is_active : formData.is_active,
      };
      
      // Include user_id if available (required by API)
      if (userId) {
        payload.user_id = userId.toString();
      } else {
        // Fallback to current user or default
        payload.user_id = user?.id?.toString() || user?.user_id?.toString() || '1';
      }
      
      console.log('Update payload:', payload);
      const response = await categoriesAPI.update(updateId, payload);
      console.log('Update response:', response);
      
      // Handle nested response structure
      if (response?.status === true || response?.data?.status === true) {
        const newCategory = response?.data?.data || response?.data || response;
        
        // Navigate back to categories screen to show updated data
        navigation.navigate('Categories');
        
        return { 
          success: true, 
          data: newCategory 
        };
      } else {
        throw new Error(response?.message || 'Failed to update category');
      }
    } catch (err) {
      console.error('Update category error:', err);
      
      // Handle validation errors
      if (err.response?.status === 422) {
        const errors = err.response?.data?.errors || {};
        setValidationErrors(errors);
        setError('Please check the form for errors');
        return { 
          success: false, 
          error: 'Validation failed',
          errors: errors 
        };
      }
      
      setError(err.message || 'Failed to update category');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const saveCategory = async (categoryData) => {
    if (categoryId) {
      return await updateCategory(categoryId, categoryData);
    } else {
      return await createCategory(categoryData);
    }
  };

  const clearError = () => {
    setError(null);
    setValidationErrors({});
  };

  return {
    formData,
    loading: loading || loadingCategory,
    error,
    validationErrors,
    handleChange,
    createCategory,
    updateCategory,
    saveCategory,
    setFormData,
    setError,
    clearError,
  };
};