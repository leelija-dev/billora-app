import { useState, useEffect } from 'react';
import { unitsAPI } from '../api/units';

export const useUnits = (params = {}) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await unitsAPI.getAll(params);
      console.log('useUnits response:', response);
      
      // Handle the API response structure: { data: { data: [...units] } }
      let unitsData = [];
      
      if (response?.data?.data) {
        unitsData = response.data.data;
      } else if (response?.data) {
        unitsData = response.data;
      } else if (Array.isArray(response)) {
        unitsData = response;
      }
      
      setUnits(unitsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch units');
    } finally {
      setLoading(false);
    }
  };

  const refreshUnits = async () => {
    await fetchUnits();
  };

  const searchUnits = async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await unitsAPI.search(query, filters);
      
      let unitsData = [];
      if (response?.data?.data) {
        unitsData = response.data.data;
      } else if (response?.data) {
        unitsData = response.data;
      } else if (Array.isArray(response)) {
        unitsData = response;
      }
      
      setUnits(unitsData);
    } catch (err) {
      setError(err.message || 'Failed to search units');
    } finally {
      setLoading(false);
    }
  };

  const createUnit = async (unitData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await unitsAPI.create(unitData);
      
      // Refresh units after creation
      await fetchUnits();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to create unit');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUnit = async (id, unitData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await unitsAPI.update(id, unitData);
      
      // Refresh units after update
      await fetchUnits();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to update unit');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteUnit = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await unitsAPI.delete(id);
      
      // Refresh units after deletion
      await fetchUnits();
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete unit');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getUnitById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await unitsAPI.getById(id);
      return response?.data?.data || response?.data || response;
    } catch (err) {
      setError(err.message || 'Failed to fetch unit');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  return {
    units,
    loading,
    error,
    refreshUnits,
    searchUnits,
    createUnit,
    updateUnit,
    deleteUnit,
    getUnitById,
    fetchUnits,
  };
};