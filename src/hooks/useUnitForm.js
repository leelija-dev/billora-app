import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { unitsAPI } from '../api/units';
import { useUnitDetail } from './useUnitDetail';
import { useAuthStore } from '../store/authStore';

export const useUnitForm = (unitId = null) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Get current user from auth store
  const { user } = useAuthStore?.() || { user: null };
  
  // Fetch unit details if editing
  const { unit, loading: loadingUnit } = useUnitDetail(unitId);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (unit && unitId) {
      setFormData({
        code: unit.code || '',
        name: unit.name || '',
      });
    }
  }, [unit, unitId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.code?.trim()) {
      errors.code = 'Unit code is required';
    }
    
    if (!formData.name?.trim()) {
      errors.name = 'Unit name is required';
    }
    
    return errors;
  };

  const createUnit = async (unitData) => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Please check the form for errors');
        return { success: false, error: 'Validation failed', errors };
      }
      
      // Get user_id from current user or use default
      const userId = user?.id || user?.user_id || '1';
      
      // Prepare data for API
      const payload = {
        code: unitData.code?.trim() || formData.code?.trim(),
        name: unitData.name?.trim() || formData.name?.trim(),
        user_id: userId,
        created_by: userId,
      };
      
      console.log('Create unit payload:', payload);
      const response = await unitsAPI.create(payload);
      console.log('Create unit response:', response);
      
      // Handle nested response structure
      if (response?.data?.status === true || response?.status === true || response?.data?.status === 'success') {
        const createdUnit = response?.data?.data || response?.data || response;
        
        // Navigate back to units screen after successful creation
        navigation.navigate('Units');
        
        return { 
          success: true, 
          data: createdUnit 
        };
      } else {
        throw new Error(response?.message || response?.data?.message || 'Failed to create unit');
      }
    } catch (err) {
      console.error('Create unit error:', err);
      
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
      
      setError(err.message || 'Failed to create unit');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUnit = async (id, unitData) => {
    const updateId = unitId || id;
    
    if (!updateId) {
      setError('Unit ID is required for update');
      return { success: false, error: 'Unit ID is required for update' };
    }
    
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Please check the form for errors');
        return { success: false, error: 'Validation failed', errors };
      }
      
      // Get user_id from the existing unit
      const userId = unit?.user_id || unit?.created_by;
      
      // Prepare data for API
      const payload = {
        code: unitData.code?.trim() || formData.code?.trim(),
        name: unitData.name?.trim() || formData.name?.trim(),
      };
      
      // Include user_id if available (required by API)
      if (userId) {
        payload.user_id = userId.toString();
      } else {
        // Fallback to current user or default
        payload.user_id = user?.id?.toString() || user?.user_id?.toString() || '1';
      }
      
      console.log('Update unit payload:', payload);
      const response = await unitsAPI.update(updateId, payload);
      console.log('Update unit response:', response);
      
      // Handle nested response structure
      if (response?.data?.status === true || response?.status === true || response?.data?.status === 'success') {
        const newUnit = response?.data?.data || response?.data || response;
        
        // Navigate back to units screen to show updated data
        navigation.navigate('Units');
        
        return { 
          success: true, 
          data: newUnit 
        };
      } else {
        throw new Error(response?.message || response?.data?.message || 'Failed to update unit');
      }
    } catch (err) {
      console.error('Update unit error:', err);
      
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
      
      setError(err.message || 'Failed to update unit');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const saveUnit = async (unitData) => {
    if (unitId) {
      return await updateUnit(unitId, unitData);
    } else {
      return await createUnit(unitData);
    }
  };

  const clearError = () => {
    setError(null);
    setValidationErrors({});
  };

  return {
    formData,
    loading: loading || loadingUnit,
    error,
    validationErrors,
    handleChange,
    createUnit,
    updateUnit,
    saveUnit,
    setFormData,
    setError,
    clearError,
  };
};