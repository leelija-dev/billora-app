import { useState, useEffect } from 'react';
import { stocksAPI } from '../api/stocks';
import { productsAPI } from '../api/products';

export const useStocks = (params = {}) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await stocksAPI.getAll(params);
      console.log('useStocks response:', response);
      
      // Handle the API response structure: { data: { data: [...stocks] } }
      let stocksData = [];
      
      if (response?.data?.data) {
        // Check if it's paginated data
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          stocksData = response.data.data.data; // Paginated: { data: { data: { data: [...] } } }
        } else if (Array.isArray(response.data.data)) {
          stocksData = response.data.data; // Non-paginated: { data: { data: [...] } }
        }
      } else if (response?.data) {
        stocksData = response.data;
      } else if (Array.isArray(response)) {
        stocksData = response;
      }
      
      // Fetch product details for each stock entry
      const stocksWithProducts = await Promise.all(
        stocksData.map(async (stock) => {
          if (stock && stock.product_id) {
            try {
              const productResponse = await productsAPI.getById(stock.product_id);
              console.log(`Product API Response for stock ${stock.id}:`, productResponse);
              
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
              
              // Add product details to stock data
              return { ...stock, product: productData };
            } catch (productErr) {
              console.error(`Error fetching product details for stock ${stock.id}:`, productErr);
              // Return stock data even if product fetch fails
              return stock;
            }
          } else {
            return stock;
          }
        })
      );
      
      setStocks(stocksWithProducts);
    } catch (err) {
      setError(err.message || 'Failed to fetch stocks');
    } finally {
      setLoading(false);
    }
  };

  const refreshStocks = async () => {
    await fetchStocks();
  };

  const searchStocks = async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await stocksAPI.search(query, filters);
      
      let stocksData = [];
      if (response?.data?.data) {
        // Check if it's paginated data
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          stocksData = response.data.data.data; // Paginated: { data: { data: { data: [...] } } }
        } else if (Array.isArray(response.data.data)) {
          stocksData = response.data.data; // Non-paginated: { data: { data: [...] } }
        }
      } else if (response?.data) {
        stocksData = response.data;
      } else if (Array.isArray(response)) {
        stocksData = response;
      }
      
      setStocks(stocksData);
    } catch (err) {
      setError(err.message || 'Failed to search stocks');
    } finally {
      setLoading(false);
    }
  };

  const createStock = async (stockData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await stocksAPI.create(stockData);
      
      // Refresh stocks after creation
      await fetchStocks();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to create stock');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id, stockData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await stocksAPI.update(id, stockData);
      
      // Refresh stocks after update
      await fetchStocks();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to update stock');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addStock = async (id, stockData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await stocksAPI.addStock(id, stockData);
      
      // Refresh stocks after adding
      await fetchStocks();
      
      return { 
        success: true, 
        data: response?.data?.data || response 
      };
    } catch (err) {
      setError(err.message || 'Failed to add stock');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteStock = async (id, userId) => {
    try {
      setLoading(true);
      setError(null);
      await stocksAPI.delete(id, userId);
      
      // Refresh stocks after deletion
      await fetchStocks();
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to delete stock');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getStockById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await stocksAPI.getById(id);
      return response?.data?.data || response?.data || response;
    } catch (err) {
      setError(err.message || 'Failed to fetch stock');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getStocksByProduct = async (productId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await stocksAPI.getByProduct(productId);
      
      let stocksData = [];
      if (response?.data?.data) {
        // Check if it's paginated data
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          stocksData = response.data.data.data; // Paginated: { data: { data: { data: [...] } } }
        } else if (Array.isArray(response.data.data)) {
          stocksData = response.data.data; // Non-paginated: { data: { data: [...] } }
        }
      } else if (response?.data) {
        stocksData = response.data;
      } else if (Array.isArray(response)) {
        stocksData = response;
      }
      
      return stocksData;
    } catch (err) {
      setError(err.message || 'Failed to fetch stocks by product');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  return {
    stocks,
    loading,
    error,
    refreshStocks,
    searchStocks,
    createStock,
    updateStock,
    addStock,
    deleteStock,
    getStockById,
    getStocksByProduct,
    fetchStocks,
  };
};