import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { stocksAPI } from '../api/stocks';
import { productsAPI } from '../api/products';
import { brandsAPI } from '../api/brands';
import { categoriesAPI } from '../api/categories';
import { useStockDetail } from './useStockDetail';
import { useAuthStore } from '../store/authStore';

export const useStockForm = (stockId = null) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Get current user from auth store
  const { user } = useAuthStore?.() || { user: null };
  
  // Fetch stock details if editing
  const { stock, loading: loadingStock } = useStockDetail(stockId);

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    sellingPrice: '',
    purchasePrice: '',
    unitId: '',
    productPackageId: null,
  });

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await productsAPI.getAll();
      
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
      
      // Extract unique units from products
      const uniqueUnits = [];
      const unitMap = new Map();
      
      productsData.forEach(product => {
        if (product.unit_id && !unitMap.has(product.unit_id)) {
          unitMap.set(product.unit_id, {
            id: product.unit_id,
            code: product.unit_code || 'UNIT',
            name: product.unit_name || `Unit ${product.unit_id}`
          });
        }
      });
      
      setUnits(Array.from(unitMap.values()));
      
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch brands and categories
  const fetchBrandsAndCategories = async () => {
    try {
      const brandsResponse = await brandsAPI.getAll();
      console.log('Brands API Response:', brandsResponse);
      let brandsData = [];
      
      // Handle nested array structure
      if (brandsResponse?.data?.data?.data && Array.isArray(brandsResponse.data.data.data)) {
        brandsData = brandsResponse.data.data.data;
      } else if (brandsResponse?.data?.data && Array.isArray(brandsResponse.data.data)) {
        brandsData = brandsResponse.data.data;
      } else if (brandsResponse?.data?.data && Array.isArray(brandsResponse.data.data)) {
        brandsData = brandsResponse.data.data;
      } else if (brandsResponse?.data && Array.isArray(brandsResponse.data)) {
        brandsData = brandsResponse.data;
      } else if (Array.isArray(brandsResponse)) {
        brandsData = brandsResponse;
      }
      
      setBrands(brandsData);
      
      const categoriesResponse = await categoriesAPI.getAll();
      console.log('Categories API Response:', categoriesResponse);
      let categoriesData = [];
      
      // Handle nested array structure
      if (categoriesResponse?.data?.data?.data && Array.isArray(categoriesResponse.data.data.data)) {
        categoriesData = categoriesResponse.data.data.data;
      } else if (categoriesResponse?.data?.data && Array.isArray(categoriesResponse.data.data)) {
        categoriesData = categoriesResponse.data.data;
      } else if (categoriesResponse?.data?.data && Array.isArray(categoriesResponse.data.data)) {
        categoriesData = categoriesResponse.data.data;
      } else if (categoriesResponse?.data && Array.isArray(categoriesResponse.data)) {
        categoriesData = categoriesResponse.data;
      } else if (Array.isArray(categoriesResponse)) {
        categoriesData = categoriesResponse;
      }
      
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error fetching brands and categories:', err);
    }
  };

  // Helper function to get brand and category names
  const getBrandAndCategoryNames = (productId) => {
    const product = products.find(p => p.id?.toString() === productId);
    if (!product) return { brandName: 'N/A', categoryName: 'N/A' };
    
    const brand = brands.find(b => b.id === product.brand_id);
    const category = categories.find(c => c.id === product.category_id);
    
    return {
      brandName: brand?.name || 'N/A',
      categoryName: category?.name || 'N/A'
    };
  };

  // Populate form when editing
  useEffect(() => {
    fetchProducts();
    fetchBrandsAndCategories();
  }, []);

  useEffect(() => {
    if (stock && stockId) {
      setFormData({
        productId: stock.product_id?.toString() || '',
        quantity: stock.quantity?.toString() || '',
        sellingPrice: stock.selling_price?.toString() || '',
        purchasePrice: stock.purchase_price?.toString() || '',
        unitId: stock.unit_id?.toString() || '',
        productPackageId: stock.product_package_id || null,
      });
    }
  }, [stock, stockId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.productId) {
      errors.productId = 'Product is required';
    }
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      errors.sellingPrice = 'Selling price must be greater than 0';
    }
    
    return errors;
  };

  const createStock = async (stockData) => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Please check the form for errors');
        return { success: false, error: 'Validation failed', errors };
      }
      
      // Get user_id from current user or use default
      const userId = user?.id || user?.user_id || '1';
      
      // Prepare data for API
      const payload = {
        productId: parseInt(stockData.productId || formData.productId),
        quantity: parseFloat(stockData.quantity || formData.quantity),
        sellingPrice: parseFloat(stockData.sellingPrice || formData.sellingPrice),
        purchasePrice: stockData.purchasePrice || formData.purchasePrice ? parseFloat(stockData.purchasePrice || formData.purchasePrice) : null,
        unitId: stockData.unitId || formData.unitId ? parseInt(stockData.unitId || formData.unitId) : null,
        productPackageId: stockData.productPackageId || formData.productPackageId,
        userId: userId,
        createdBy: userId,
      };
      
      console.log('Create stock payload:', payload);
      const response = await stocksAPI.create(payload);
      console.log('Create stock response:', response);
      
      // Handle nested response structure
      if (response?.status === true || response?.data?.status === true) {
        const createdStock = response?.data?.data || response?.data || response;
        
        // Navigate back to stocks screen after successful creation
        navigation.navigate('Stocks');
        
        return { 
          success: true, 
          data: createdStock 
        };
      } else {
        throw new Error(response?.message || 'Failed to create stock');
      }
    } catch (err) {
      console.error('Create stock error:', err);
      
      // Handle validation errors
      if (err.response?.status === 422) {
        const errors = err.response?.data?.errors || {};
        setValidationErrors(errors);
        setError('Please check the form for errors');
        return { 
          success: false, 
          error: 'Validation failed',
          errors: errors 
        };
      }
      
      setError(err.message || 'Failed to create stock');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id, stockData) => {
    const updateId = stockId || id;
    
    if (!updateId) {
      setError('Stock ID is required for update');
      return { success: false, error: 'Stock ID is required for update' };
    }
    
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});
      
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Please check the form for errors');
        return { success: false, error: 'Validation failed', errors };
      }
      
      // Prepare data for API
      const payload = {
        quantity: parseFloat(stockData.quantity || formData.quantity),
        sellingPrice: parseFloat(stockData.sellingPrice || formData.sellingPrice),
        purchasePrice: stockData.purchasePrice || formData.purchasePrice ? parseFloat(stockData.purchasePrice || formData.purchasePrice) : null,
        unitId: stockData.unitId || formData.unitId ? parseInt(stockData.unitId || formData.unitId) : null,
        productPackageId: stockData.productPackageId || formData.productPackageId,
      };
      
      console.log('Update stock payload:', payload);
      const response = await stocksAPI.update(updateId, payload);
      console.log('Update stock response:', response);
      
      // Handle nested response structure
      if (response?.status === true || response?.data?.status === true) {
        const newStock = response?.data?.data || response?.data || response;
        
        // Navigate back to stocks screen to show updated data
        navigation.navigate('Stocks');
        
        return { 
          success: true, 
          data: newStock 
        };
      } else {
        throw new Error(response?.message || 'Failed to update stock');
      }
    } catch (err) {
      console.error('Update stock error:', err);
      
      // Handle validation errors
      if (err.response?.status === 422) {
        const errors = err.response?.data?.errors || {};
        setValidationErrors(errors);
        setError('Please check the form for errors');
        return { 
          success: false, 
          error: 'Validation failed',
          errors: errors 
        };
      }
      
      setError(err.message || 'Failed to update stock');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const saveStock = async (stockData) => {
    if (stockId) {
      return await updateStock(stockId, stockData);
    } else {
      return await createStock(stockData);
    }
  };

  const clearError = () => {
    setError(null);
    setValidationErrors({});
  };

  return {
    formData,
    products,
    units,
    loading: loading || loadingStock || loadingProducts,
    error,
    validationErrors,
    handleChange,
    createStock,
    updateStock,
    saveStock,
    setFormData,
    setError,
    clearError,
    getBrandAndCategoryNames,
    fetchProducts
  };
};