import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { brandsAPI } from '../api/brands';
import { useBrandDetail } from './useBrandDetail';
import { useAuthStore } from '../store/authStore';

export const useBrandForm = (brandId = null) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Get current user from auth store
  const { user } = useAuthStore?.() || { user: null };
  
  // Fetch brand details if editing
  const { brand, loading: loadingBrand } = useBrandDetail(brandId);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  // Populate form when editing
  useEffect(() => {
    if (brand && brandId) {
      setFormData({
        name: brand.name || '',
        description: brand.description || '',
        is_active: brand.is_active === 1 || brand.is_active === true,
      });
    }
  }, [brand, brandId]);

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
      errors.name = 'Brand name is required';
    }
    
    return errors;
  };

  const createBrand = async (brandData) => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      // Get user_id from current user or use default
      const userId = user?.id || user?.user_id || '1';
      
      // Prepare data for API
      const payload = {
        name: brandData.name?.trim() || formData.name?.trim(),
        description: brandData.description?.trim() || formData.description?.trim() || '',
        is_active: brandData.is_active !== undefined ? brandData.is_active : formData.is_active,
        user_id: userId,
        created_by: userId,
      };
      
      console.log('Create brand payload:', payload);
      const response = await brandsAPI.create(payload);
      console.log('Create brand response:', response);
      
      if (response?.data?.status === 'success' || response?.data?.status === true || response?.status === 'success') {
        const createdBrand = response?.data?.data || response?.data || response;
        
        // Navigate back to brands screen after successful creation
        navigation.navigate('Brands');
        
        return { 
          success: true, 
          data: createdBrand 
        };
      } else {
        throw new Error(response?.message || response?.data?.message || 'Failed to create brand');
      }
    } catch (err) {
      console.error('Create brand error:', err);
      
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
      
      setError(err.message || 'Failed to create brand');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateBrand = async (id, brandData) => {
    const updateId = brandId || id;
    
    if (!updateId) {
      setError('Brand ID is required for update');
      return { success: false, error: 'Brand ID is required for update' };
    }
    
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      const userId = brand?.user_id || brand?.created_by;
      
      const payload = {
        name: brandData.name?.trim() || formData.name?.trim(),
        description: brandData.description?.trim() || formData.description?.trim() || '',
        is_active: brandData.is_active !== undefined ? brandData.is_active : formData.is_active,
      };
      
      if (userId) {
        payload.user_id = userId.toString();
      } else {
        payload.user_id = user?.id?.toString() || user?.user_id?.toString() || '1';
      }
      
      console.log('Update brand payload:', payload);
      const response = await brandsAPI.update(updateId, payload);
      console.log('Update brand response:', response);
      
      if (response?.data?.status === 'success' || response?.data?.status === true || response?.status === 'success') {
        const newBrand = response?.data?.data || response?.data || response;
        
        navigation.navigate('Brands');
        
        return { 
          success: true, 
          data: newBrand 
        };
      } else {
        throw new Error(response?.message || response?.data?.message || 'Failed to update brand');
      }
    } catch (err) {
      console.error('Update brand error:', err);
      
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
      
      setError(err.message || 'Failed to update brand');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const saveBrand = async (brandData) => {
    if (brandId) {
      return await updateBrand(brandId, brandData);
    } else {
      return await createBrand(brandData);
    }
  };

  const clearError = () => {
    setError(null);
    setValidationErrors({});
  };

  return {
    formData,
    loading: loading || loadingBrand,
    error,
    validationErrors,
    handleChange,
    createBrand,
    updateBrand,
    saveBrand,
    setFormData,
    setError,
    clearError,
  };
};