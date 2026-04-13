import { useState, useEffect } from 'react';
import { customersAPI } from '../api/customers';
import { useAuthStore } from '../store/authStore';

export const useCustomers = (params = {}) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalDue, setTotalDue] = useState(0);
  const { user } = useAuthStore();

  const fetchCustomers = async () => {
    try {
      setError(null);
      
      const userId = user?.id || user?.user_id || '1';
      const response = await customersAPI.getAll(userId, params);
      console.log('useCustomers response:', response);
      
      // Handle the API response structure: { data: { data: [...customers] } }
      let customersData = [];
      
      if (response?.data?.data) {
        customersData = response.data.data;
      } else if (response?.data) {
        customersData = response.data;
      } else if (Array.isArray(response)) {
        customersData = response;
      }
      
      setCustomers(customersData);
      
      // Calculate total due
      const due = customersData.reduce((sum, customer) => sum + (customer.due_amount || 0), 0);
      setTotalDue(due);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomers = async () => {
    setLoading(true);
    await fetchCustomers();
  };

  const searchCustomers = async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = user?.id || user?.user_id || '1';
      const response = await customersAPI.search(userId, query, filters);
      
      let customersData = [];
      if (response?.data?.data) {
        customersData = response.data.data;
      } else if (response?.data) {
        customersData = response.data;
      } else if (Array.isArray(response)) {
        customersData = response;
      }
      
      setCustomers(customersData);
      
      // Calculate total due
      const due = customersData.reduce((sum, customer) => sum + (customer.due_amount || 0), 0);
      setTotalDue(due);
      
    } catch (err) {
      setError(err.message || 'Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersAPI.create(customerData);
      
      // Refresh customers after creation
      await fetchCustomers();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to create customer');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id, customerData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersAPI.update(id, customerData);
      
      // Refresh customers after update
      await fetchCustomers();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to update customer');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addDuePayment = async (id, paymentData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersAPI.addDuePayment(id, paymentData);
      
      // Refresh customers after due payment
      await fetchCustomers();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to add due payment');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await customersAPI.delete(id);
      
      // Refresh customers after deletion
      await fetchCustomers();
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete customer');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const restoreCustomer = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersAPI.restore(id);
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to restore customer');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const forceDeleteCustomer = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await customersAPI.forceDelete(id);
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to permanently delete customer');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getTrashedCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersAPI.getTrashed();
      
      let trashedData = [];
      if (response?.data?.data) {
        trashedData = response.data.data;
      } else if (response?.data) {
        trashedData = response.data;
      } else if (Array.isArray(response)) {
        trashedData = response;
      }
      
      return trashedData;
    } catch (err) {
      setError(err.message || 'Failed to fetch trashed customers');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getCustomerById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await customersAPI.getById(id);
      return response?.data?.data || response?.data || response;
    } catch (err) {
      setError(err.message || 'Failed to fetch customer');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    totalDue,
    refreshCustomers,
    searchCustomers,
    createCustomer,
    updateCustomer,
    addDuePayment,
    deleteCustomer,
    restoreCustomer,
    forceDeleteCustomer,
    getTrashedCustomers,
    getCustomerById,
    fetchCustomers,
  };
};