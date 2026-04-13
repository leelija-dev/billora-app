import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { customersAPI } from '../api/customers';
import { useCustomerDetail } from './useCustomerDetail';
import { useAuthStore } from '../store/authStore';

export const useCustomerForm = (customerId = null) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Get current user from auth store
  const { user } = useAuthStore?.() || { user: null };
  
  // Fetch customer details if editing
  const { customer, loading: loadingCustomer } = useCustomerDetail(customerId);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (customer && customerId) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
      });
    }
  }, [customer, customerId]);

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
      errors.name = 'Customer name is required';
    }
    
    if (!formData.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.address?.trim()) {
      errors.address = 'Address is required';
    }
    
    return errors;
  };

  const createCustomer = async (customerData) => {
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
      
      // Get admin_id from current user
      const adminId = user?.id || user?.user_id || '1';
      
      // Prepare data for API
      const payload = {
        name: customerData.name?.trim() || formData.name?.trim(),
        email: customerData.email?.trim() || formData.email?.trim() || '',
        phone: customerData.phone?.trim() || formData.phone?.trim(),
        address: customerData.address?.trim() || formData.address?.trim(),
        city: customerData.city?.trim() || formData.city?.trim() || '',
        adminId: adminId,
        createdBy: adminId,
      };
      
      console.log('Create customer payload:', payload);
      const response = await customersAPI.create(payload);
      console.log('Create customer response:', response);
      
      // Handle nested response structure
      if (response?.status === true || response?.data?.status === true) {
        const createdCustomer = response?.data?.data || response?.data || response;
        
        // Navigate back to customers screen after successful creation
        navigation.navigate('Customers');
        
        return { 
          success: true, 
          data: createdCustomer 
        };
      } else {
        throw new Error(response?.message || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Create customer error:', err);
      
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
      
      setError(err.message || 'Failed to create customer');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id, customerData) => {
    const updateId = customerId || id;
    
    if (!updateId) {
      setError('Customer ID is required for update');
      return { success: false, error: 'Customer ID is required for update' };
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
      
      // Get admin_id from current user
      const adminId = user?.id || user?.user_id || '1';
      
      // Prepare data for API
      const payload = {
        name: customerData.name?.trim() || formData.name?.trim(),
        email: customerData.email?.trim() || formData.email?.trim() || '',
        phone: customerData.phone?.trim() || formData.phone?.trim(),
        address: customerData.address?.trim() || formData.address?.trim(),
        city: customerData.city?.trim() || formData.city?.trim() || '',
        userId: adminId,
      };
      
      console.log('Update customer payload:', payload);
      const response = await customersAPI.update(updateId, payload);
      console.log('Update customer response:', response);
      
      // Handle nested response structure
      if (response?.status === true || response?.data?.status === true) {
        const newCustomer = response?.data?.data || response?.data || response;
        
        // Navigate back to customers screen to show updated data
        navigation.navigate('Customers');
        
        return { 
          success: true, 
          data: newCustomer 
        };
      } else {
        throw new Error(response?.message || 'Failed to update customer');
      }
    } catch (err) {
      console.error('Update customer error:', err);
      
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
      
      setError(err.message || 'Failed to update customer');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const saveCustomer = async (customerData) => {
    if (customerId) {
      return await updateCustomer(customerId, customerData);
    } else {
      return await createCustomer(customerData);
    }
  };

  const clearError = () => {
    setError(null);
    setValidationErrors({});
  };

  return {
    formData,
    loading: loading || loadingCustomer,
    error,
    validationErrors,
    handleChange,
    createCustomer,
    updateCustomer,
    saveCustomer,
    setFormData,
    setError,
    clearError,
  };
};