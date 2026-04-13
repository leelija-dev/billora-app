import { useState, useEffect } from 'react';
import { productsAPI } from '../api/products';
import { stocksAPI } from '../api/stocks';

export const useProducts = (params = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setError(null);
      const response = await productsAPI.getAll(params);
      
      // Handle the API response structure: { data: { data: [...products] } }
      let productsData = [];
      
      if (response?.data?.data) {
        // Check if it's paginated data
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          productsData = response.data.data.data; // Paginated: { data: { data: { data: [...] } } }
        } else if (Array.isArray(response.data.data)) {
          productsData = response.data.data; // Non-paginated: { data: { data: [...] } }
        }
      } else if (response?.data) {
        productsData = response.data;
      } else if (Array.isArray(response)) {
        productsData = response;
      }
      
      // Fetch stock data for each product to get accurate stock information
      if (productsData.length > 0) {
        try {
          const stocksResponse = await stocksAPI.getAll();
          let stocksData = [];
          
          if (stocksResponse?.data?.data) {
            if (stocksResponse.data.data.data && Array.isArray(stocksResponse.data.data.data)) {
              stocksData = stocksResponse.data.data.data;
            } else if (Array.isArray(stocksResponse.data.data)) {
              stocksData = stocksResponse.data.data;
            }
          } else if (Array.isArray(stocksResponse?.data)) {
            stocksData = stocksResponse.data;
          }
          
          // Create a map of product_id to stock quantity
          const stockMap = {};
          stocksData.forEach(stock => {
            if (stock.product_id && stock.quantity !== undefined) {
              stockMap[stock.product_id] = stock.quantity;
            }
          });
          
          // Merge stock data into products
          productsData = productsData.map(product => ({
            ...product,
            stock: stockMap[product.id] || 0
          }));
          
        } catch (stockError) {
          console.log('Failed to fetch stock data, using 0 stock for all products:', stockError);
          // If stock fetch fails, set stock to 0 for all products
          productsData = productsData.map(product => ({
            ...product,
            stock: 0
          }));
        }
      }
      
      setProducts(productsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = async () => {
    setLoading(true);
    await fetchProducts();
  };

  const searchProducts = async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.search(query, filters);
      
      let productsData = [];
      if (response?.data?.data) {
        // Check if it's paginated data
        if (response.data.data.data && Array.isArray(response.data.data.data)) {
          productsData = response.data.data.data; // Paginated: { data: { data: { data: [...] } } }
        } else if (Array.isArray(response.data.data)) {
          productsData = response.data.data; // Non-paginated: { data: { data: [...] } }
        }
      } else if (response?.data) {
        productsData = response.data;
      } else if (Array.isArray(response)) {
        productsData = response;
      }
      
      setProducts(productsData);
    } catch (err) {
      setError(err.message || 'Failed to search products');
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsAPI.getByCategory(categoryId);
      setProducts(response.data || response);
    } catch (err) {
      setError(err.message || 'Failed to fetch products by category');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refreshProducts,
    searchProducts,
    getProductsByCategory,
    fetchProducts,
  };
};
