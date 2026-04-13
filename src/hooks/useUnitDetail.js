import { useState, useEffect } from 'react';
import { unitsAPI } from '../api/units';
import { productsAPI } from '../api/products';

export const useUnitDetail = (unitId) => {
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);

  const fetchUnit = async () => {
    if (!unitId) {
      setError('Unit ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await unitsAPI.getById(unitId);
      
      console.log('Raw API Response:', response); // Debug log
      
      // Extract unit data from the nested structure
      let unitData = null;
      
      if (response?.data?.data) {
        unitData = response.data.data;
        // If it's an array with one item, extract the first item
        if (Array.isArray(unitData) && unitData.length > 0) {
          unitData = unitData[0];
        }
        console.log('Extracted Unit Data:', unitData);
      } else if (response?.data) {
        unitData = response.data;
        // If it's an array with one item, extract the first item
        if (Array.isArray(unitData) && unitData.length > 0) {
          unitData = unitData[0];
        }
      } else {
        unitData = response;
        // If it's an array with one item, extract the first item
        if (Array.isArray(unitData) && unitData.length > 0) {
          unitData = unitData[0];
        }
      }
      
      setUnit(unitData);
      
    } catch (err) {
      console.error('Error fetching unit:', err);
      setError(err.message || 'Failed to fetch unit');
      setUnit(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUnit = async (unitData) => {
    if (!unitId) {
      setError('Unit ID is required for update');
      return { success: false, error: 'Unit ID is required for update' };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for API
      const updatePayload = {
        code: unitData.code,
        name: unitData.name,
      };
      
      const response = await unitsAPI.update(unitId, updatePayload);
      console.log('Update Response:', response);
      
      // Extract updated unit from response
      let updatedUnit = null;
      
      if (response?.data?.data) {
        updatedUnit = response.data.data;
      } else if (response?.data) {
        updatedUnit = response.data;
      } else {
        updatedUnit = response;
      }
      
      setUnit(updatedUnit);
      return { success: true, data: updatedUnit };
    } catch (err) {
      console.error('Error updating unit:', err);
      setError(err.message || 'Failed to update unit');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteUnit = async () => {
    if (!unitId) {
      setError('Unit ID is required for delete');
      return { success: false, error: 'Unit ID is required for delete' };
    }

    try {
      setLoading(true);
      setError(null);
      const response = await unitsAPI.delete(unitId);
      console.log('Delete Response:', response);
      
      if (response?.data?.status === true || response?.status === true || response?.data?.status === 'success') {
        return { success: true };
      } else {
        return { success: false, error: 'Delete operation failed' };
      }
    } catch (err) {
      console.error('Error deleting unit:', err);
      setError(err.message || 'Failed to delete unit');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByUnit = async () => {
    console.log('fetchProductsByUnit called with unitId:', unitId);
    if (!unitId) {
      console.log('No unitId, returning early');
      return;
    }

    try {
      console.log('Calling productsAPI.getAll with unit_id:', unitId);
      const response = await productsAPI.getAll({ unit_id: unitId });
      console.log('Products by Unit Response:', response);
      
      let productsData = [];
      
      // Handle paginated response structure
      if (response?.data?.data?.data) {
        productsData = response.data.data.data;
      } else if (response?.data?.data) {
        productsData = response.data.data;
      } else if (response?.data) {
        productsData = response.data;
      } else {
        productsData = response;
      }
      
      console.log('Setting products:', Array.isArray(productsData) ? productsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      
    } catch (err) {
      console.error('Error fetching products by unit:', err);
      setProducts([]);
    }
  };

  const refreshUnit = () => {
    fetchUnit();
    fetchProductsByUnit();
  };

  const clearError = () => setError(null);

  useEffect(() => {
    fetchUnit();
    fetchProductsByUnit();
  }, [unitId]);

  return {
    unit,
    loading,
    error,
    products,
    updateUnit,
    deleteUnit,
    refreshUnit,
    clearError,
    fetchUnit,
  };
};