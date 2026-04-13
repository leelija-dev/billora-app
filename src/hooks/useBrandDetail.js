import { useState, useEffect } from 'react';
import { brandsAPI } from '../api/brands';
import { productsAPI } from '../api/products';

export const useBrandDetail = (brandId) => {
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);

  const fetchBrand = async () => {
    if (!brandId) {
      setError('Brand ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await brandsAPI.getById(brandId);
      
      console.log('Raw API Response:', response);
      
      // Extract brand data from the nested structure
      let brandData = null;
      
      if (response?.data?.data) {
        brandData = response.data.data;
        // If it's an array with one item, extract the first item
        if (Array.isArray(brandData) && brandData.length > 0) {
          brandData = brandData[0];
        }
        console.log('Extracted Brand Data:', brandData);
      } else if (response?.data) {
        brandData = response.data;
        // If it's an array with one item, extract the first item
        if (Array.isArray(brandData) && brandData.length > 0) {
          brandData = brandData[0];
        }
      } else {
        brandData = response;
        // If it's an array with one item, extract the first item
        if (Array.isArray(brandData) && brandData.length > 0) {
          brandData = brandData[0];
        }
      }
      
      setBrand(brandData);
      
    } catch (err) {
      console.error('Error fetching brand:', err);
      setError(err.message || 'Failed to fetch brand');
      setBrand(null);
    } finally {
      setLoading(false);
    }
  };

  const updateBrand = async (brandData) => {
    if (!brandId) {
      setError('Brand ID is required for update');
      return { success: false, error: 'Brand ID is required for update' };
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatePayload = {
        name: brandData.name,
        description: brandData.description,
        isActive: brandData.is_active !== undefined ? brandData.is_active : brandData.isActive,
      };
      
      const response = await brandsAPI.update(brandId, updatePayload);
      console.log('Update Response:', response);
      
      let updatedBrand = null;
      
      if (response?.data?.data) {
        updatedBrand = response.data.data;
      } else if (response?.data) {
        updatedBrand = response.data;
      } else {
        updatedBrand = response;
      }
      
      setBrand(updatedBrand);
      return { success: true, data: updatedBrand };
    } catch (err) {
      console.error('Error updating brand:', err);
      setError(err.message || 'Failed to update brand');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async () => {
    if (!brandId) {
      setError('Brand ID is required for delete');
      return { success: false, error: 'Brand ID is required for delete' };
    }

    try {
      setLoading(true);
      setError(null);
      const response = await brandsAPI.delete(brandId);
      console.log('Delete Response:', response);
      
      if (response?.data?.status === 'success' || response?.data?.status === true || response?.status === 'success') {
        return { success: true };
      } else {
        return { success: false, error: 'Delete operation failed' };
      }
    } catch (err) {
      console.error('Error deleting brand:', err);
      setError(err.message || 'Failed to delete brand');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const toggleBrandStatus = async () => {
    if (!brand) {
      setError('No brand data available');
      return { success: false, error: 'No brand data available' };
    }

    const updatedData = {
      name: brand.name,
      description: brand.description,
      is_active: !brand.is_active,
    };

    return await updateBrand(updatedData);
  };

  const fetchProductsByBrand = async () => {
    console.log('fetchProductsByBrand called with brandId:', brandId);
    if (!brandId) {
      console.log('No brandId, returning early');
      return;
    }

    try {
      console.log('Calling productsAPI.getAll with brand_id:', brandId);
      const response = await productsAPI.getAll({ brand_id: brandId });
      console.log('Products by Brand Response:', response);
      
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
      console.error('Error fetching products by brand:', err);
      setProducts([]);
    }
  };

  const refreshBrand = () => {
    fetchBrand();
    fetchProductsByBrand();
  };

  const clearError = () => setError(null);

  useEffect(() => {
    fetchBrand();
    fetchProductsByBrand();
  }, [brandId]);

  return {
    brand,
    loading,
    error,
    products,
    updateBrand,
    deleteBrand,
    toggleBrandStatus,
    refreshBrand,
    clearError,
    fetchBrand,
  };
};