import { useState, useEffect } from 'react';
import { customersAPI } from '../api/customers';

export const useCustomerDetail = (customerId) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchCustomer = async (start, end) => {
    if (!customerId) {
      setError('Customer ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (start && end) {
        response = await customersAPI.getPaymentHistory(customerId, start, end);
      } else {
        response = await customersAPI.getById(customerId);
      }
      
      console.log('Raw API Response:', response);
      
      // Extract customer data from the nested structure
      let customerData = null;
      
      if (response?.data?.data) {
        customerData = response.data.data;
        console.log('Extracted Customer Data:', customerData);
        
        // Extract payment history if available
        if (customerData.payment_history) {
          setPaymentHistory(customerData.payment_history);
        }
      } else if (response?.data) {
        customerData = response.data;
      } else {
        customerData = response;
      }
      
      setCustomer(customerData);
      
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError(err.message || 'Failed to fetch customer');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const filterByDateRange = async (start, end) => {
    setStartDate(start);
    setEndDate(end);
    await fetchCustomer(start, end);
  };

  const updateCustomer = async (customerData) => {
    if (!customerId) {
      setError('Customer ID is required for update');
      return { success: false, error: 'Customer ID is required for update' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for API
      const updatePayload = {
        name: customerData.name,
        email: customerData.email || '',
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city || '',
        userId: customerData.userId || customerData.user_id || customer?.admin_id,
      };
      
      const response = await customersAPI.update(customerId, updatePayload);
      console.log('Update Response:', response);
      
      // Extract updated customer from response
      let updatedCustomer = null;
      
      if (response?.data?.data) {
        updatedCustomer = response.data.data;
      } else if (response?.data) {
        updatedCustomer = response.data;
      } else {
        updatedCustomer = response;
      }
      
      setCustomer(updatedCustomer);
      return { success: true, data: updatedCustomer };
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err.message || 'Failed to update customer');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addDuePayment = async (paymentData) => {
    if (!customerId) {
      setError('Customer ID is required for due payment');
      return { success: false, error: 'Customer ID is required' };
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await customersAPI.addDuePayment(customerId, paymentData);
      console.log('Due Payment Response:', response);
      
      // Refresh customer data
      await fetchCustomer(startDate, endDate);
      
      return { success: true, data: response?.data?.data || response };
    } catch (err) {
      console.error('Error adding due payment:', err);
      setError(err.message || 'Failed to add due payment');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async () => {
    if (!customerId) {
      setError('Customer ID is required for delete');
      return { success: false, error: 'Customer ID is required for delete' };
    }

    try {
      setLoading(true);
      setError(null);
      const response = await customersAPI.delete(customerId);
      console.log('Delete Response:', response);
      
      if (response?.status === true || response?.data?.status === true) {
        return { success: true };
      } else {
        return { success: false, error: 'Delete operation failed' };
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError(err.message || 'Failed to delete customer');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomer = () => {
    fetchCustomer(startDate, endDate);
  };

  const clearError = () => setError(null);

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  return {
    customer,
    loading,
    error,
    paymentHistory,
    updateCustomer,
    addDuePayment,
    deleteCustomer,
    filterByDateRange,
    refreshCustomer,
    clearError,
    fetchCustomer,
  };
};