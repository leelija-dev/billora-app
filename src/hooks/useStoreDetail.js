import { useState, useEffect, useCallback } from 'react';
import { storesAPI } from '../api/stores';

export const useStoreDetail = (storeId) => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStore = useCallback(async () => {
    if (!storeId) {
      setError('Store ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await storesAPI.getById(storeId);
      
      console.log('Raw Store API Response:', response);
      
      // Extract store data from the nested structure
      let storeData = null;
      
      if (response?.data?.data) {
        storeData = response.data.data;
        console.log('Extracted Store Data:', storeData);
      } else if (response?.data) {
        storeData = response.data;
      } else {
        storeData = response;
      }
      
      setStore(storeData);
      
    } catch (err) {
      console.error('Error fetching store:', err);
      setError(err.message || 'Failed to fetch store');
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const updateStore = useCallback(async (storeData) => {
    if (!storeId) {
      setError('Store ID is required for update');
      return { success: false, error: 'Store ID is required for update' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for API
      const updatePayload = {
        name: storeData.name,
        gst: storeData.gst,
        email: storeData.email,
        logo: storeData.logo,
        mobile: storeData.mobile,
        address: storeData.address,
        city: storeData.city,
        status: storeData.status !== undefined ? storeData.status : storeData.is_active,
      };
      
      const response = await storesAPI.update(storeId, updatePayload);
      console.log('Update Store Response:', response);
      
      // Extract updated store from response
      let updatedStore = null;
      
      if (response?.data?.data) {
        updatedStore = response.data.data;
      } else if (response?.data) {
        updatedStore = response.data;
      } else {
        updatedStore = response;
      }
      
      setStore(updatedStore);
      return { success: true, data: updatedStore };
    } catch (err) {
      console.error('Error updating store:', err);
      setError(err.message || 'Failed to update store');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const deleteStore = useCallback(async () => {
    if (!storeId) {
      setError('Store ID is required for delete');
      return { success: false, error: 'Store ID is required for delete' };
    }

    try {
      setLoading(true);
      setError(null);
      const response = await storesAPI.delete(storeId);
      console.log('Delete Store Response:', response);
      
      if (response?.status === true || response?.data?.status === true) {
        return { success: true };
      } else {
        return { success: false, error: 'Delete operation failed' };
      }
    } catch (err) {
      console.error('Error deleting store:', err);
      setError(err.message || 'Failed to delete store');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const toggleStoreStatus = useCallback(async () => {
    if (!store) {
      setError('No store data available');
      return { success: false, error: 'No store data available' };
    }

    const updatedData = {
      name: store.name,
      gst: store.gst,
      email: store.email,
      logo: store.logo,
      mobile: store.mobile,
      address: store.address,
      city: store.city,
      status: !store.status,
    };

    return await updateStore(updatedData);
  }, [store, updateStore]);

  const refreshStore = useCallback(() => {
    fetchStore();
  }, [fetchStore]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    fetchStore();
  }, [fetchStore, storeId]);

  return {
    store,
    loading,
    error,
    updateStore,
    deleteStore,
    toggleStoreStatus,
    refreshStore,
    clearError,
    fetchStore,
  };
};