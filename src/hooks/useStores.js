import { useState, useEffect, useCallback } from 'react';
import { storesAPI } from '../api/stores';
import { useAuthStore } from '../store/authStore';

export const useStores = (params = {}) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthStore?.() || { user: null };
  
  const userId = user?.id || user?.user_id || 1; // Fallback to 1 for demo

  const fetchStores = useCallback(async () => {
    if (!userId) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await storesAPI.getAll(userId, params);
      console.log('useStores response:', response);
      
      // Handle the API response structure: { data: { data: [...stores] } }
      let storesData = [];
      
      if (response?.data?.data) {
        storesData = response.data.data;
      } else if (response?.data) {
        storesData = response.data;
      } else if (Array.isArray(response)) {
        storesData = response;
      }
      
      setStores(storesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  }, [userId, params]);

  const refreshStores = useCallback(async () => {
    await fetchStores();
  }, [fetchStores]);

  const searchStores = useCallback(async (query, searchParams = {}) => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await storesAPI.search(userId, query, searchParams);
      
      let storesData = [];
      if (response?.data?.data) {
        storesData = response.data.data;
      } else if (response?.data) {
        storesData = response.data;
      } else if (Array.isArray(response)) {
        storesData = response;
      }
      
      setStores(storesData);
    } catch (err) {
      setError(err.message || 'Failed to search stores');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createStore = useCallback(async (storeData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await storesAPI.create(storeData);
      
      // Refresh stores after creation
      await fetchStores();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to create store');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchStores]);

  const updateStore = useCallback(async (id, storeData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await storesAPI.update(id, storeData);
      
      // Refresh stores after update
      await fetchStores();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to update store');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchStores]);

  const deleteStore = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await storesAPI.delete(id);
      
      // Refresh stores after deletion
      await fetchStores();
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete store');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchStores]);

  const getStoreById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await storesAPI.getById(id);
      return response?.data?.data || response?.data || response;
    } catch (err) {
      setError(err.message || 'Failed to fetch store');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, []);

  return {
    stores,
    loading,
    error,
    refreshStores,
    searchStores,
    createStore,
    updateStore,
    deleteStore,
    getStoreById,
    fetchStores,
  };
};