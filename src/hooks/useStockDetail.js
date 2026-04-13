import { useState, useEffect } from 'react';
import { stocksAPI } from '../api/stocks';
import { productsAPI } from '../api/products';
import { brandsAPI } from '../api/brands';
import { categoriesAPI } from '../api/categories';
import { unitsAPI } from '../api/units';
import { useAuthStore } from '../store/authStore';

export const useStockDetail = (stockId) => {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  const fetchStock = async () => {
    if (!stockId) {
      setError('Stock ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await stocksAPI.getById(stockId);
      
      console.log('Raw API Response:', response);
      
      // Extract stock data from the nested structure
      let stockData = null;
      
      if (response?.data?.data) {
        stockData = response.data.data;
        console.log('Extracted Stock Data:', stockData);
      } else if (response?.data) {
        stockData = response.data;
      } else {
        stockData = response;
      }
      
      // If stock has product_id, fetch product details with brand, category, and unit
      if (stockData && stockData.product_id) {
        try {
          const productResponse = await productsAPI.getById(stockData.product_id);
          console.log('Product API Response:', productResponse);
          
          let productData = null;
          if (productResponse?.data?.data?.data) {
            productData = productResponse.data.data.data;
          } else if (productResponse?.data?.data) {
            productData = productResponse.data.data;
          } else if (productResponse?.data) {
            productData = productResponse.data;
          } else {
            productData = productResponse;
          }
          
          // Initialize brand, category, and unit names
          productData.brand_name = 'N/A';
          productData.category_name = 'N/A';
          productData.unit_code = 'N/A';
          productData.unit_name = 'N/A';
          
          // Fetch brand details if brand_id exists
          if (productData.brand_id) {
            try {
              const brandResponse = await brandsAPI.getById(productData.brand_id);
              console.log('Brand API Response:', brandResponse);
              
              let brandData = null;
              if (brandResponse?.data?.data) {
                brandData = brandResponse.data.data;
              } else if (brandResponse?.data) {
                brandData = brandResponse.data;
              } else {
                brandData = brandResponse;
              }
              
              // Add brand name to product data
              productData.brand_name = brandData?.name || 'N/A';
              productData.brand = brandData; // Optional: store full brand object
              
            } catch (brandErr) {
              console.error('Error fetching brand:', brandErr);
              productData.brand_name = 'N/A';
            }
          }
          
          // Fetch category details if category_id exists
          if (productData.category_id) {
            try {
              const categoryResponse = await categoriesAPI.getById(productData.category_id);
              console.log('Category API Response:', categoryResponse);
              
              let categoryData = null;
              if (categoryResponse?.data?.data) {
                categoryData = categoryResponse.data.data;
              } else if (categoryResponse?.data) {
                categoryData = categoryResponse.data;
              } else {
                categoryData = categoryResponse;
              }
              
              // Add category name to product data
              productData.category_name = categoryData?.name || 'N/A';
              productData.category = categoryData; // Optional: store full category object
              
            } catch (categoryErr) {
              console.error('Error fetching category:', categoryErr);
              productData.category_name = 'N/A';
            }
          }
          
          // Fetch unit details if unit_id exists in product
          if (productData.unit_id) {
            try {
              const unitResponse = await unitsAPI.getById(productData.unit_id);
              console.log('Unit API Response:', unitResponse);
              
              let unitData = null;
              if (unitResponse?.data?.data) {
                unitData = unitResponse.data.data;
              } else if (unitResponse?.data) {
                unitData = unitResponse.data;
              } else {
                unitData = unitResponse;
              }
              
              // Add unit code and name to product data
              productData.unit_code = unitData?.code || 'N/A';
              productData.unit_name = unitData?.name || 'N/A';
              productData.unit = unitData; // Optional: store full unit object
              
            } catch (unitErr) {
              console.error('Error fetching unit:', unitErr);
              productData.unit_code = 'N/A';
              productData.unit_name = 'N/A';
            }
          }
          
          // Add product details to stock data
          stockData.product = productData;
          
          // Also set unit_code at stock level from product for backward compatibility
          stockData.unit_code = productData.unit_code;
          stockData.unit_name = productData.unit_name;
          
          console.log('Final Stock Data with Product:', stockData);
          
        } catch (productErr) {
          console.error('Error fetching product details:', productErr);
          // Create a minimal product object with error info
          stockData.product = {
            id: stockData.product_id,
            name: 'Unknown Product',
            brand_name: 'N/A',
            category_name: 'N/A',
            unit_code: 'N/A',
            unit_name: 'N/A',
            description: null,
            error: 'Failed to load product details'
          };
          stockData.unit_code = 'N/A';
          stockData.unit_name = 'N/A';
        }
      }
      
      setStock(stockData);
      
    } catch (err) {
      console.error('Error fetching stock:', err);
      setError(err.message || 'Failed to fetch stock');
      setStock(null);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (stockData) => {
    if (!stockId) {
      setError('Stock ID is required for update');
      return { success: false, error: 'Stock ID is required for update' };
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await stocksAPI.update(stockId, stockData);
      console.log('Update Response:', response);
      
      // Extract updated stock from response
      let updatedStock = null;
      
      if (response?.data?.data) {
        updatedStock = response.data.data;
      } else if (response?.data) {
        updatedStock = response.data;
      } else {
        updatedStock = response;
      }
      
      // If stock was updated successfully, refresh the full stock data with product details
      if (updatedStock) {
        await fetchStock(); // Refresh to get updated details
      } else {
        setStock(updatedStock);
      }
      
      return { success: true, data: updatedStock };
    } catch (err) {
      console.error('Error updating stock:', err);
      setError(err.message || 'Failed to update stock');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addStock = async (quantityData) => {
    if (!stockId) {
      setError('Stock ID is required');
      return { success: false, error: 'Stock ID is required' };
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await stocksAPI.addStock(stockId, quantityData);
      console.log('Add Stock Response:', response);
      
      // Extract updated stock from response
      let updatedStock = null;
      
      if (response?.data?.data) {
        updatedStock = response.data.data;
      } else if (response?.data) {
        updatedStock = response.data;
      } else {
        updatedStock = response;
      }
      
      // If stock was updated successfully, refresh the full stock data
      if (updatedStock) {
        await fetchStock(); // Refresh to get updated quantity
      } else {
        setStock(updatedStock);
      }
      
      return { success: true, data: updatedStock };
    } catch (err) {
      console.error('Error adding stock:', err);
      setError(err.message || 'Failed to add stock');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteStock = async () => {
    if (!stockId) {
      setError('Stock ID is required for delete');
      return { success: false, error: 'Stock ID is required for delete' };
    }

    try {
      setLoading(true);
      setError(null);
      const response = await stocksAPI.delete(stockId, user?.id);
      console.log('Delete Response:', response);
      
      if (response?.status === true || response?.data?.status === true) {
        return { success: true };
      } else {
        return { success: false, error: 'Delete operation failed' };
      }
    } catch (err) {
      console.error('Error deleting stock:', err);
      setError(err.message || 'Failed to delete stock');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshStock = () => {
    fetchStock();
  };

  const clearError = () => setError(null);

  useEffect(() => {
    fetchStock();
  }, [stockId]);

  return {
    stock,
    loading,
    error,
    updateStock,
    addStock,
    deleteStock,
    refreshStock,
    clearError,
    fetchStock,
  };
};