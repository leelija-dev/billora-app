// api/invoices.js - Invoice API service (UPDATED WITH QR SCANNING)
import apiClient from './client';

export const invoiceAPI = {
  // Get all invoices/bills history with pagination and search
  getAll: async (page = 1, filters = {}) => {
    const params = new URLSearchParams();
    
    if (page) {
      params.append('page', page);
    }
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    if (filters.start_date) {
      params.append('start_date', filters.start_date);
    }
    
    if (filters.end_date) {
      params.append('end_date', filters.end_date);
    }
    
    if (filters.store) {
      params.append('store', filters.store);
    }
    
    if (filters.due_amount) {
      params.append('due_amount', filters.due_amount);
    }
    
    const response = await apiClient.get(`/invoice/bill-history?${params.toString()}`);
    return response;
  },

  // Get single invoice/bill with payment history filters
  getById: async (id, startDate = '', endDate = '') => {
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    let originalId = id;
    
    // Check if the ID is a string that looks like Base64
    if (typeof id === 'string' && id.length > 0 && !/^\d+$/.test(id)) {
      try {
        // Decode Base64
        const decoded = atob(id);
        // Remove secret key from end if present
        const secretKey = process.env.EXPO_PUBLIC_SECRET_ENCRYPTION_KEY || '';
        originalId = decoded.replace(secretKey, '');
        console.log('Decoded ID from Base64:', originalId);
      } catch (error) {
        console.error('Failed to decode Base64 ID, using original:', id);
        originalId = id;
      }
    } else {
      console.log('Using plain ID:', originalId);
    }
    
    // Ensure we have a valid ID
    if (!originalId || originalId === '×}') {
      console.error('Invalid invoice ID:', originalId);
      throw new Error(`Invalid invoice ID: ${originalId}`);
    }
    
    const response = await apiClient.get(`/invoice/${originalId}?${params.toString()}`);
    return response;
  },

  // Get bill generate page data
  getBillGenerateData: async (userId) => {
    if (!userId) {
      console.error('User ID is required for getBillGenerateData');
      return apiClient.get('/invoice');
    }
    console.log('Fetching bill generate data for user ID:', userId);
    const response = await apiClient.get('/invoice', {
      params: { user_id: userId },
    });
    return response;
  },

  // Get customer details by ID
  getCustomer: async (customerId) => {
    const response = await apiClient.get(`/customer/show/${customerId}`);
    return response;
  },

  // Get store details by ID
  getStore: async (storeId) => {
    const response = await apiClient.get(`/store/edit/${storeId}`);
    return response;
  },

  // Create/store new invoice/bill
  create: async (invoiceData) => {
    console.log('Creating invoice with data:', invoiceData);
    const response = await apiClient.post('/invoice/store', invoiceData);
    return response;
  },

  // Update invoice/bill
  update: async (id, invoiceData) => {
    const response = await apiClient.put(`/invoice/${id}`, invoiceData);
    return response;
  },

  // Delete invoice/bill
  delete: async (id) => {
    const response = await apiClient.delete(`/invoice/${id}`);
    return response;
  },

  // Cancel invoice — restores stock (if permitted), reverses customer due, updates GST rows and status
  updateBillStatus: async (id) => {
    const response = await apiClient.put(`/invoice/update-bill-status/${id}`, {});
    return response;
  },

  // Pay invoice-wise due (partial or full) - FIXED with proper error handling
  invoiceDuePay: async (id, payload) => {
    try {
      console.log('💳 invoiceDuePay called with:', { id, payload });
      const response = await apiClient.put(`/invoice/invoice-due-pay/${id}`, {
        paid_amount: payload.paid_amount,
        payment_method: payload.payment_method,
      });
      console.log('💳 invoiceDuePay response status:', response.status);
      console.log('💳 invoiceDuePay response data:', response.data);
      
      // Ensure we return the full response
      return response;
    } catch (error) {
      console.error('❌ invoiceDuePay error:', error);
      throw error;
    }
  },

  // Get products with stock for invoice creation
  getProductsWithStock: async (searchTerm = '') => {
    const params = new URLSearchParams();
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    const response = await apiClient.get(`/invoice/products?${params.toString()}`);
    return response;
  },

  // ============ QR SCANNING ENDPOINTS ============
  
  /**
   * Get scanned product by ID (from product table)
   * @param {string|number} productId - The product ID
   * @returns {Promise} - Response with product data
   * 
   * Endpoint: GET /api/invoice/scanned/product/{id}
   * Used when QR code type is PRD (Product)
   */
  getScannedProduct: async (productId) => {
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      // Ensure productId is a number
      const id = parseInt(productId, 10);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid product ID');
      }
      
      console.log('🔍 Fetching scanned product with ID:', id);
      const response = await apiClient.get(`/invoice/scanned/product/${id}`);
      console.log('✅ Scanned product response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching scanned product:', error);
      throw error;
    }
  },

  /**
   * Get scanned stock by ID (from stock table)
   * @param {string|number} stockId - The stock ID (parsed from QR, with leading zeros removed)
   * @returns {Promise} - Response with stock data
   * 
   * Endpoint: GET /api/invoice/scanned/stock/{id}
   * Used when QR code type is STK (Stock)
   * Requires stock-management permission
   * 
   * Example: STK0000000089 -> id = 89
   * Example: STK0000200089 -> id = 200089
   */
  getScannedStock: async (stockId) => {
    try {
      if (!stockId) {
        throw new Error('Stock ID is required');
      }
      
      // Ensure stockId is a number (remove any remaining leading zeros)
      const id = parseInt(stockId, 10);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid stock ID');
      }
      
      console.log('🔍 Fetching scanned stock with ID:', id);
      const response = await apiClient.get(`/invoice/scanned/stock/${id}`);
      console.log('✅ Scanned stock response:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error fetching scanned stock:', error);
      throw error;
    }
  },

  /**
   * Generic method to handle QR scan results
   * This method tries to detect the type from the QR data and fetch accordingly
   * @param {string} qrData - The raw QR code data
   * @param {boolean} hasStockPermission - Whether user has stock permission
   * @returns {Promise<Object>} - The product/stock data
   */
  handleQRScan: async (qrData, hasStockPermission = false) => {
    try {
      if (!qrData) {
        throw new Error('QR data is required');
      }

      // Parse the QR data
      let parsedData = null;
      
      // Try to parse as JSON
      try {
        if (qrData.startsWith('{')) {
          const parsed = JSON.parse(qrData);
          parsedData = {
            type: parsed.type || parsed.qrType || null,
            id: parsed.id || parsed.productId || parsed.stockId || null,
            raw: parsed
          };
        }
      } catch (e) {
        // Not JSON, try other formats
      }
      
      // If not parsed yet, try string format "TYPE:ID" or "TYPE-ID"
      if (!parsedData) {
        const typeMatch = qrData.match(/^(PRD|STK)[:\-](\d+)/i);
        if (typeMatch) {
          parsedData = {
            type: typeMatch[1].toUpperCase(),
            id: typeMatch[2],
            raw: qrData
          };
        } else {
          // Try to extract ID from string
          const idMatch = qrData.match(/\d+/);
          if (idMatch) {
            parsedData = {
              type: null,
              id: idMatch[0],
              raw: qrData
            };
          }
        }
      }
      
      if (!parsedData || !parsedData.id) {
        throw new Error('Could not parse QR code data');
      }
      
      let result = null;
      
      // Determine how to fetch based on QR type
      if (parsedData.type === 'PRD') {
        // Fetch from product endpoint
        const response = await invoiceAPI.getScannedProduct(parsedData.id);
        if (response.data?.status === true && response.data?.data) {
          result = {
            type: 'product',
            data: response.data.data,
            qrType: 'PRD'
          };
        } else {
          throw new Error('Product not found');
        }
      } else if (parsedData.type === 'STK') {
        // Check if user has stock permission
        if (!hasStockPermission) {
          throw new Error('You do not have permission to scan stock QR codes');
        }
        
        // Fetch from stock endpoint
        const response = await invoiceAPI.getScannedStock(parsedData.id);
        if (response.data?.status === true && response.data?.data) {
          result = {
            type: 'stock',
            data: response.data.data,
            qrType: 'STK'
          };
        } else {
          throw new Error('Stock not found');
        }
      } else {
        // Unknown type - try both endpoints
        // Try product endpoint first
        try {
          const productResponse = await invoiceAPI.getScannedProduct(parsedData.id);
          if (productResponse.data?.status === true && productResponse.data?.data) {
            result = {
              type: 'product',
              data: productResponse.data.data,
              qrType: 'PRD'
            };
          }
        } catch (e) {
          // Product not found, try stock if permitted
          if (hasStockPermission) {
            try {
              const stockResponse = await invoiceAPI.getScannedStock(parsedData.id);
              if (stockResponse.data?.status === true && stockResponse.data?.data) {
                result = {
                  type: 'stock',
                  data: stockResponse.data.data,
                  qrType: 'STK'
                };
              }
            } catch (e2) {
              // Both failed
            }
          }
        }
        
        if (!result) {
          throw new Error('Could not find product or stock with this ID');
        }
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error handling QR scan:', error);
      throw error;
    }
  }
};

export default invoiceAPI;