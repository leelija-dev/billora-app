import { useState, useEffect } from 'react';
import { brandsAPI } from '../api/brands';

export const useBrands = (params = {}) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandsAPI.getAll(params);
      console.log('useBrands response:', response);
      
      // Handle the API response structure: { data: { data: { data: [...brands], ...pagination } } }
      let brandsData = [];
      
      if (response?.data?.data?.data) {
        brandsData = response.data.data.data;
      } else if (response?.data?.data) {
        brandsData = response.data.data;
      } else if (response?.data) {
        brandsData = response.data;
      } else if (Array.isArray(response)) {
        brandsData = response;
      }
      
      setBrands(brandsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  const refreshBrands = async () => {
    await fetchBrands();
  };

  const searchBrands = async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandsAPI.search(query, filters);
      
      let brandsData = [];
      if (response?.data?.data) {
        brandsData = response.data.data;
      } else if (response?.data) {
        brandsData = response.data;
      } else if (Array.isArray(response)) {
        brandsData = response;
      }
      
      setBrands(brandsData);
    } catch (err) {
      setError(err.message || 'Failed to search brands');
    } finally {
      setLoading(false);
    }
  };

  const createBrand = async (brandData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandsAPI.create(brandData);
      
      // Refresh brands after creation
      await fetchBrands();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to create brand');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateBrand = async (id, brandData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandsAPI.update(id, brandData);
      
      // Refresh brands after update
      await fetchBrands();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to update brand');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await brandsAPI.delete(id);
      
      // Refresh brands after deletion
      await fetchBrands();
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete brand');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getBrandById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandsAPI.getById(id);
      return response?.data?.data || response?.data || response;
    } catch (err) {
      setError(err.message || 'Failed to fetch brand');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return {
    brands,
    loading,
    error,
    refreshBrands,
    searchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    getBrandById,
    fetchBrands,
  };
};