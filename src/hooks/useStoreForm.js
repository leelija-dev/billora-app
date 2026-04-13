import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { storesAPI } from '../api/stores';
import { useStoreDetail } from './useStoreDetail';
import { useAuthStore } from '../store/authStore';

export const useStoreForm = (storeId = null) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Get current user from auth store
  const { user } = useAuthStore?.() || { user: null };
  
  // Fetch store details if editing
  const { store, loading: loadingStore } = useStoreDetail(storeId);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    gst: '',
    email: '',
    logo: '',
    mobile: '',
    address: '',
    city: '',
    status: true,
  });

  // Populate form when editing
  useEffect(() => {
    if (store && storeId) {
      setFormData({
        name: store.name || '',
        gst: store.gst || '',
        email: store.email || '',
        logo: store.logo || '',
        mobile: store.mobile || '',
        address: store.address || '',
        city: store.city || '',
        status: store.status === 1 || store.status === true,
      });
    }
  }, [store, storeId]);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [validationErrors]);

  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Store name is required';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.address?.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.city?.trim()) {
      errors.city = 'City is required';
    }
    
    return errors;
  }, [formData]);

  const createStore = useCallback(async (storeData) => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      // Validate form
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Please check the form for errors');
        return { success: false, error: 'Validation failed', errors };
      }
      
      // Get user_id from current user
      const userId = user?.id || user?.user_id || '1';
      
      // Prepare data for API
      const payload = {
        name: storeData.name?.trim() || formData.name?.trim(),
        gst: storeData.gst?.trim() || formData.gst?.trim() || '',
        email: storeData.email?.trim() || formData.email?.trim(),
        logo: storeData.logo || formData.logo || null,
        mobile: storeData.mobile?.trim() || formData.mobile?.trim() || '',
        address: storeData.address?.trim() || formData.address?.trim(),
        city: storeData.city?.trim() || formData.city?.trim(),
        status: storeData.status !== undefined ? storeData.status : formData.status,
        userId: userId,
        createdBy: userId,
      };
      
      console.log('Create store payload:', payload);
      const response = await storesAPI.create(payload);
      console.log('Create store response:', response);
      
      // Handle nested response structure
      if (response?.status === true || response?.data?.status === true) {
        const createdStore = response?.data?.data || response?.data || response;
        
        // Navigate back to stores screen
        navigation.navigate('Stores');
        
        return { 
          success: true, 
          data: createdStore 
        };
      } else {
        throw new Error(response?.message || 'Failed to create store');
      }
    } catch (err) {
      console.error('Create store error:', err);
      
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
      
      setError(err.message || 'Failed to create store');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, user, navigation]);

  const updateStore = useCallback(async (id, storeData) => {
    const updateId = storeId || id;
    
    if (!updateId) {
      setError('Store ID is required for update');
      return { success: false, error: 'Store ID is required for update' };
    }
    
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      // Validate form
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Please check the form for errors');
        return { success: false, error: 'Validation failed', errors };
      }
      
      // Prepare data for API
      const payload = {
        name: storeData.name?.trim() || formData.name?.trim(),
        gst: storeData.gst?.trim() || formData.gst?.trim() || '',
        email: storeData.email?.trim() || formData.email?.trim(),
        logo: storeData.logo || formData.logo || null,
        mobile: storeData.mobile?.trim() || formData.mobile?.trim() || '',
        address: storeData.address?.trim() || formData.address?.trim(),
        city: storeData.city?.trim() || formData.city?.trim(),
        status: storeData.status !== undefined ? storeData.status : formData.status,
      };
      
      console.log('Update store payload:', payload);
      const response = await storesAPI.update(updateId, payload);
      console.log('Update store response:', response);
      
      // Handle nested response structure
      if (response?.status === true || response?.data?.status === true) {
        const updatedStore = response?.data?.data || response?.data || response;
        
        // Navigate back to stores screen
        navigation.navigate('Stores');
        
        return { 
          success: true, 
          data: updatedStore 
        };
      } else {
        throw new Error(response?.message || 'Failed to update store');
      }
    } catch (err) {
      console.error('Update store error:', err);
      
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
      
      setError(err.message || 'Failed to update store');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [storeId, formData, validateForm, navigation]);

  const saveStore = useCallback(async (storeData) => {
    if (storeId) {
      return await updateStore(storeId, storeData);
    } else {
      return await createStore(storeData);
    }
  }, [storeId, createStore, updateStore]);

  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors({});
  }, []);

  return {
    formData,
    loading: loading || loadingStore,
    error,
    validationErrors,
    handleChange,
    createStore,
    updateStore,
    saveStore,
    setFormData,
    setError,
    clearError,
  };
};