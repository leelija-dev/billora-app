import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { billsAPI } from '../api/bills';
import { productsAPI } from '../api/products';
import { storesAPI } from '../api/stores';
import { customersAPI } from '../api/customers';
import { brandsAPI } from '../api/brands';
import { categoriesAPI } from '../api/categories';
import { stocksAPI } from '../api/stocks';
import { useAuthStore } from '../store/authStore';

export const useBillForm = (billId = null) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Data for dropdowns
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Bill items
  const [items, setItems] = useState([]);
  
  // Get current user from auth store
  const { user } = useAuthStore?.() || { user: null };

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    storeId: '',
    paidAmount: '',
    paymentMethod: 'cash',
  });

  // Helper function to extract data from various API response structures
  const extractDataFromResponse = (response) => {
    if (!response) return [];
    
    // If response has data.data structure (Laravel pagination)
    if (response.data?.data?.data) {
      return response.data.data.data;
    }
    
    // If response has data.data as array
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // If response.data is array
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // If response itself is array
    if (Array.isArray(response)) {
      return response;
    }
    
    // If response has data property that's an object with data array
    if (response.data?.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
      const possibleData = response.data.data.data;
      if (possibleData && Array.isArray(possibleData)) {
        return possibleData;
      }
    }
    
    // If response.data is an object with data array (like from your store API)
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Handle the specific store API response structure you showed
    if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
      return response.data.data.data;
    }
    
    // If response has data that's an object (single item), wrap in array
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return [response.data];
    }
    
    return [];
  };

  // Fetch all required data
  const fetchFormData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch products
      const productsResponse = await productsAPI.getAll();
      const productsData = extractDataFromResponse(productsResponse);
      setProducts(productsData);
      
      // Fetch customers
      const customersResponse = await customersAPI.getAll(user?.id || 1);
      const customersData = extractDataFromResponse(customersResponse);
      setCustomers(customersData);
      
      // Fetch stores
      if (user?.id) {
        const storesResponse = await storesAPI.getAll(user.id);
        const storesData = extractDataFromResponse(storesResponse);
        setStores(storesData);
      }
      
      // Fetch brands
      const brandsResponse = await brandsAPI.getAll();
      const brandsData = extractDataFromResponse(brandsResponse);
      setBrands(brandsData);
      
      // Fetch categories
      const categoriesResponse = await categoriesAPI.getAll();
      const categoriesData = extractDataFromResponse(categoriesResponse);
      setCategories(categoriesData);
      
      // Fetch stocks
      const stocksResponse = await stocksAPI.getAll();
      const stocksData = extractDataFromResponse(stocksResponse);
      setStocks(stocksData);
      
    } catch (err) {
      console.error('Error fetching form data:', err);
      setError('Failed to load form data');
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch bill data if editing
  const fetchBillData = async () => {
    if (!billId) return;
    
    try {
      setLoading(true);
      const response = await billsAPI.getById(billId);
      
      let billData = null;
      if (response?.data?.data) {
        billData = response.data.data;
      } else if (response?.data) {
        billData = response.data;
      } else {
        billData = response;
      }
      
      if (billData) {
        setFormData({
          customerId: billData.customer_id?.toString() || '',
          storeId: billData.store_id?.toString() || '',
          paidAmount: billData.paid_amount?.toString() || '',
          paymentMethod: billData.payment_method || 'cash',
        });
        
        setItems(billData.items?.map(item => ({
          id: item.id || Date.now() + Math.random(),
          productId: item.product_id?.toString() || '',
          productName: item.product?.name || '',
          quantity: item.quantity?.toString() || '1',
          price: item.price?.toString() || '0',
          gst: item.gst?.toString() || '0',
          discount: item.discount?.toString() || '0',
          totalPrice: item.total_price || 0,
          unitId: item.unit_id?.toString() || '',
          unitCode: item.unit_code || 'PC',
          stockId: item.stock_id?.toString() || '',
        })) || []);
      }
    } catch (err) {
      console.error('Error fetching bill:', err);
      setError('Failed to load bill data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormData();
  }, []);

  useEffect(() => {
    if (billId && billId !== 'undefined' && billId !== undefined) {
      fetchBillData();
    }
  }, [billId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addItem = () => {
    const newItem = {
      id: Date.now() + Math.random(),
      productId: '',
      productName: '',
      quantity: '1',
      price: '0',
      gst: '0',
      discount: '0',
      totalPrice: 0,
      unitId: '',
      unitCode: '',
      stockId: '',
      brandName: '',
      categoryName: '',
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    
    // If product is selected, fetch product details
    if (field === 'productId' && value) {
      const selectedProduct = products.find(p => p.id?.toString() === value);
      
      if (selectedProduct) {
        console.log("Selected product", selectedProduct);
        updatedItems[index].productName = selectedProduct.name || '';
        updatedItems[index].price = selectedProduct.selling_price?.toString() || '0';
        updatedItems[index].gst = selectedProduct.gst_percentage?.toString() || '0';
        updatedItems[index].discount = selectedProduct.discount_percentage?.toString() || '0';
        updatedItems[index].unitId = selectedProduct.unit_id?.toString() || '';
        updatedItems[index].unitCode = selectedProduct.unit_code || 'PC';
        
        // Find stock for this product to get stockId
        console.log('Available stocks:', stocks);
        console.log('Selected product ID:', selectedProduct.id);
        const stockForProduct = stocks.find(s => s.product_id === selectedProduct.id);
        console.log('Found stock for product:', stockForProduct);
        updatedItems[index].stockId = stockForProduct?.id?.toString() || '';
        console.log('Set stockId to:', updatedItems[index].stockId);
        
        // Get brand and category names
        const brand = brands.find(b => b.id === selectedProduct.brand_id);
        const category = categories.find(c => c.id === selectedProduct.category_id);
        updatedItems[index].brandName = brand?.name || 'N/A';
        updatedItems[index].categoryName = category?.name || 'N/A';
      }
    }
    
    // Recalculate total price
    const quantity = parseFloat(updatedItems[index].quantity) || 0;
    const price = parseFloat(updatedItems[index].price) || 0;
    const gst = parseFloat(updatedItems[index].gst) || 0;
    const discount = parseFloat(updatedItems[index].discount) || 0;
    
    const subtotal = quantity * price;
    const gstAmount = subtotal * (gst / 100);
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal + gstAmount - discountAmount;
    
    updatedItems[index].totalPrice = total;
    
    setItems(updatedItems);
  };

  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.price) * parseFloat(item.quantity) || 0), 0);
  };

  const calculateTotalGST = () => {
    return items.reduce((sum, item) => {
      const subtotal = parseFloat(item.price) * parseFloat(item.quantity) || 0;
      const gst = parseFloat(item.gst) || 0;
      return sum + (subtotal * (gst / 100));
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return items.reduce((sum, item) => {
      const subtotal = parseFloat(item.price) * parseFloat(item.quantity) || 0;
      const discount = parseFloat(item.discount) || 0;
      return sum + (subtotal * (discount / 100));
    }, 0);
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  const calculateChange = () => {
  const paid = parseFloat(formData.paidAmount) || 0;
  const total = calculateGrandTotal();
  return paid > total ? paid - total : 0;
};

const validateForm = () => {
  const errors = {};
  
  if (!formData.customerId) {
    errors.customerId = 'Customer is required';
  }
  
  if (!formData.storeId) {
    errors.storeId = 'Store is required';
  }
  
  if (formData.paidAmount === '' || formData.paidAmount === null || formData.paidAmount === undefined) {
    errors.paidAmount = 'Paid amount is required';
  } else if (isNaN(parseFloat(formData.paidAmount)) || parseFloat(formData.paidAmount) < 0) {
    errors.paidAmount = 'Valid paid amount is required';
  }
  
  if (items.length === 0) {
    errors.items = 'At least one item is required';
  } else {
    items.forEach((item, index) => {
      if (!item.productId) {
        errors[`item_${index}_product`] = `Item ${index + 1}: Product is required`;
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        errors[`item_${index}_quantity`] = `Item ${index + 1}: Valid quantity is required`;
      }
    });
  }
  
  return errors;
};

const createBill = async (billData) => {
  // Prevent multiple submissions
  if (loading) {
    console.log('Bill creation already in progress, ignoring duplicate call');
    return { success: false, error: 'Bill creation already in progress' };
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
    
    // Get user_id from current user
    const userId = user?.id || user?.user_id || '1';
    
    console.log('Form data before payload creation:', formData);
    console.log('Customer ID:', formData.customerId);
    console.log('Store ID:', formData.storeId);
    
    // Prepare items for API - including stock_id since backend requires it
    const itemsPayload = items.map(item => ({
      product_id: parseInt(item.productId),
      quantity: parseInt(item.quantity),
      item_count: parseInt(item.quantity),
      unit_id: item.unitId ? parseInt(item.unitId) : null,
      price: parseFloat(item.price),
      gst: parseFloat(item.gst) || 0,
      discount: parseFloat(item.discount) || 0,
      total_price: parseFloat(item.totalPrice) || 0,
      status: 'completed',
      stock_id: item.stockId ? parseInt(item.stockId) : null, // Add stock_id here
    }));
    
    
    // Prepare data for API - using snake_case as expected by backend
    const payload = {
      user_id: parseInt(userId),
      customer_id: formData.customerId ? parseInt(formData.customerId) : null,
      store_id: formData.storeId ? parseInt(formData.storeId) : null,
      paid_amount: parseFloat(formData.paidAmount) || 0,
      created_by: parseInt(userId),
      items: itemsPayload,
    };
    
    console.log('Create Bill API payload:', payload);
    
    const response = await billsAPI.create(payload);
    console.log('Create bill response:', response);
    
    if (response?.status === true || response?.data?.status === true) {
      const createdBill = response?.data?.data || response?.data || response;
      
      navigation.navigate('BillDetail', { billId: createdBill.id });
      
      return { 
        success: true, 
        data: createdBill 
      };
    } else {
      throw new Error(response?.message || 'Failed to create bill');
    }
  } catch (err) {
    console.error('Create bill error:', err);
    
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
    
    setError(err.message || 'Failed to create bill');
    return { success: false, error: err.message };
  } finally {
    setLoading(false);
  }
};

const updateBill = async (billData) => {
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
    
    // Get user_id from current user
    const userId = user?.id || user?.user_id || '1';
    
    // Prepare items for API - including stock_id
    const itemsPayload = items.map(item => ({
      product_id: parseInt(item.productId),
      quantity: parseInt(item.quantity),
      item_count: parseInt(item.quantity),
      unit_id: item.unitId ? parseInt(item.unitId) : null,
      price: parseFloat(item.price),
      gst: parseFloat(item.gst) || 0,
      discount: parseFloat(item.discount) || 0,
      total_price: parseFloat(item.totalPrice) || 0,
      status: 'completed',
      stock_id: item.stockId ? parseInt(item.stockId) : null,
    }));
    
    // Prepare data for API
    const payload = {
      customer_id: parseInt(formData.customerId),
      store_id: parseInt(formData.storeId),
      paid_amount: parseFloat(formData.paidAmount) || 0,
      items: itemsPayload,
    };
    
    console.log('Update bill payload:', payload);
    const response = await billsAPI.update(billId, payload);
    console.log('Update bill response:', response);
    
    if (response?.status === true || response?.data?.status === true) {
      const updatedBill = response?.data?.data || response?.data || response;
      
      navigation.navigate('BillDetail', { billId: updatedBill.id });
      
      return { 
        success: true, 
        data: updatedBill 
      };
    } else {
      throw new Error(response?.message || 'Failed to update bill');
    }
  } catch (err) {
    console.error('Update bill error:', err);
    
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
    
    setError(err.message || 'Failed to update bill');
    return { success: false, error: err.message };
  } finally {
    setLoading(false);
  }
};

  const saveBill = async () => {
    if (billId) {
      return await updateBill(formData);
    } else {
      return await createBill(formData);
    }
  };

  const clearError = () => {
    setError(null);
    setValidationErrors({});
  };

  return {
    formData,
    items,
    products,
    customers,
    stores,
    brands,
    categories,
    loading: loading || loadingData,
    error,
    validationErrors,
    handleChange,
    addItem,
    updateItem,
    removeItem,
    calculateSubtotal,
    calculateTotalGST,
    calculateTotalDiscount,
    calculateGrandTotal,
    calculateChange,
    saveBill,
    setFormData,
    setError,
    clearError,
  };
};