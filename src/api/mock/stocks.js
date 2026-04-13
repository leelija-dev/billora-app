// Import products mock data
import { mockProductsData } from './products';

// Mock stocks data for development
export const mockStocksData = [
  {
    id: 1,
    user_id: 1,
    product_id: 1,
    product: mockProductsData?.find(p => p.id === 1) || { id: 1, name: 'Sample Product 1', sku: 'SKU001' },
    quantity: 150,
    selling_price: 29.99,
    purchase_price: 19.99,
    unit_id: 1,
    unit_code: 'KG',
    product_package_id: null,
    created_by: 1,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    user_id: 1,
    product_id: 2,
    product: mockProductsData?.find(p => p.id === 2) || { id: 2, name: 'Sample Product 2', sku: 'SKU002' },
    quantity: 75,
    selling_price: 49.99,
    purchase_price: 34.99,
    unit_id: 2,
    unit_code: 'L',
    product_package_id: null,
    created_by: 1,
    created_at: '2024-01-15T11:45:00Z',
    updated_at: '2024-01-15T11:45:00Z',
  },
  {
    id: 3,
    user_id: 2,
    product_id: 3,
    product: mockProductsData?.find(p => p.id === 3) || { id: 3, name: 'Sample Product 3', sku: 'SKU003' },
    quantity: 200,
    selling_price: 15.99,
    purchase_price: 9.99,
    unit_id: 3,
    unit_code: 'PC',
    product_package_id: null,
    created_by: 2,
    created_at: '2024-01-16T09:20:00Z',
    updated_at: '2024-01-16T09:20:00Z',
  },
  {
    id: 4,
    user_id: 1,
    product_id: 4,
    product: mockProductsData?.find(p => p.id === 4) || { id: 4, name: 'Sample Product 4', sku: 'SKU004' },
    quantity: 50,
    selling_price: 199.99,
    purchase_price: 149.99,
    unit_id: 4,
    unit_code: 'M',
    product_package_id: null,
    created_by: 1,
    created_at: '2024-01-16T14:30:00Z',
    updated_at: '2024-01-16T14:30:00Z',
  },
  {
    id: 5,
    user_id: 2,
    product_id: 5,
    product: mockProductsData?.find(p => p.id === 5) || { id: 5, name: 'Sample Product 5', sku: 'SKU005' },
    quantity: 0,
    selling_price: 89.99,
    purchase_price: 64.99,
    unit_id: 2,
    unit_code: 'L',
    product_package_id: null,
    created_by: 2,
    created_at: '2024-01-17T10:15:00Z',
    updated_at: '2024-01-17T10:15:00Z',
  },
  {
    id: 6,
    user_id: 1,
    product_id: 6,
    product: mockProductsData?.find(p => p.id === 6) || { id: 6, name: 'Sample Product 6', sku: 'SKU006' },
    quantity: 25,
    selling_price: 299.99,
    purchase_price: 249.99,
    unit_id: 4,
    unit_code: 'M',
    product_package_id: null,
    created_by: 1,
    created_at: '2024-01-17T16:45:00Z',
    updated_at: '2024-01-17T16:45:00Z',
  },
];

export const mockStocks = {
  get: async (url, config = {}) => {
    console.log('Mock Stocks API call:', url, config);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url === '/stocks' || url === '/stocks/') {
      // Handle search
      let filteredStocks = [...mockStocksData];
      
      if (config.params?.search) {
        const searchTerm = config.params.search.toLowerCase();
        filteredStocks = filteredStocks.filter(stock => 
          stock.product?.name?.toLowerCase().includes(searchTerm) ||
          stock.product?.sku?.toLowerCase().includes(searchTerm) ||
          stock.id?.toString().includes(searchTerm)
        );
      }
      
      return {
        data: {
          data: {
            current_page: 1,
            data: filteredStocks,
            first_page_url: "http://10.0.2.2:8000/api/stocks?page=1",
            from: 1,
            last_page: 1,
            last_page_url: "http://10.0.2.2:8000/api/stocks?page=1",
            links: [
              { url: null, label: "&laquo; Previous", active: false },
              { url: "http://10.0.2.2:8000/api/stocks?page=1", label: "1", active: true },
              { url: null, label: "Next &raquo;", active: false }
            ],
            next_page_url: null,
            path: "http://10.0.2.2:8000/api/stocks",
            per_page: 15,
            prev_page_url: null,
            to: filteredStocks.length,
            total: filteredStocks.length
          },
          message: 'Stocks retrieved successfully',
          status: true
        },
        status: 200,
        url: "/stocks"
      };
    }
    
    if (url.startsWith('/stocks/') && !url.includes('/add-stock')) {
      const id = parseInt(url.split('/').pop());
      const stock = mockStocksData.find(s => s.id === id);
      
      if (stock) {
        return {
          data: {
            data: stock,
            message: 'Stock retrieved successfully',
            status: true
          }
        };
      }
    }
    
    if (url.startsWith('/stocks/product/')) {
      const productId = parseInt(url.split('/').pop());
      const stocks = mockStocksData.filter(s => s.product_id === productId);
      
      return {
        data: {
          data: stocks,
          message: 'Stocks retrieved successfully',
          status: true
        }
      };
    }
    
    return { data: { data: null, message: 'Not found', status: false } };
  },
  
  post: async (url, data) => {
    console.log('Mock POST:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url === '/stocks/store') {
      const product = mockProductsData?.find(p => p.id === data.product_id) || { 
        id: data.product_id, 
        name: `Product ${data.product_id}`, 
        sku: `SKU${data.product_id}` 
      };
      const unit = data.unit_id ? { id: data.unit_id, code: 'UNIT' } : null;
      
      const newStock = {
        id: mockStocksData.length + 1,
        user_id: data.user_id,
        product_id: data.product_id,
        product: product,
        quantity: data.quantity,
        selling_price: data.selling_price,
        purchase_price: data.purchase_price,
        unit_id: data.unit_id,
        unit_code: unit?.code || null,
        product_package_id: data.product_package_id,
        created_by: data.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockStocksData.push(newStock);
      
      return {
        data: {
          data: newStock,
          message: 'Stock created successfully',
          status: true
        }
      };
    }
    
    if (url.includes('/add-stock/')) {
      const id = parseInt(url.split('/').pop());
      const index = mockStocksData.findIndex(s => s.id === id);
      
      if (index !== -1) {
        mockStocksData[index].quantity += parseInt(data.quantity) || 0;
        mockStocksData[index].updated_at = new Date().toISOString();
        
        return {
          data: {
            data: mockStocksData[index],
            message: 'Stock added successfully',
            status: true
          }
        };
      }
    }
    
    return { data: { data: null, message: 'Not found', status: false } };
  },
  
  put: async (url, data) => {
    console.log('Mock PUT:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = parseInt(url.split('/').pop());
    const index = mockStocksData.findIndex(s => s.id === id);
    
    if (index !== -1) {
      mockStocksData[index] = {
        ...mockStocksData[index],
        quantity: data.quantity,
        selling_price: data.selling_price,
        purchase_price: data.purchase_price,
        unit_id: data.unit_id,
        product_package_id: data.product_package_id,
        updated_at: new Date().toISOString(),
      };
      
      return {
        data: {
          data: mockStocksData[index],
          message: 'Stock updated successfully',
          status: true
        }
      };
    }
    
    throw { response: { data: { message: 'Stock not found', status: false } } };
  },
  
  delete: async (url) => {
    console.log('Mock DELETE:', url);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = parseInt(url.split('/').pop());
    const index = mockStocksData.findIndex(s => s.id === id);
    
    if (index !== -1) {
      mockStocksData.splice(index, 1);
      
      return {
        data: {
          data: null,
          message: 'Stock deleted successfully',
          status: true
        }
      };
    }
    
    throw { response: { data: { message: 'Stock not found', status: false } } };
  }
};