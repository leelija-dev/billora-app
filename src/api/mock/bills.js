import { mockProductsData } from './products';
import { mockStoresData } from './stores';

// Mock customers data
export const mockCustomersData = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    address: '123 Main St, City',
    gst: 'GSTIN12345',
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '9876543211',
    address: '456 Oak Ave, Town',
    gst: 'GSTIN67890',
    created_at: '2024-01-16T11:45:00Z',
  },
  {
    id: 3,
    name: 'Raj Kumar',
    email: 'raj@example.com',
    phone: '9876543212',
    address: '789 Pine Rd, Village',
    gst: '',
    created_at: '2024-01-17T09:20:00Z',
  },
];

// Mock bills data
export const mockBillsData = [
  {
    id: 1,
    invoice_no: 'INV-2024-001',
    user_id: 1,
    customer_id: 1,
    customer: mockCustomersData.find(c => c.id === 1),
    store_id: 1,
    store: mockStoresData?.find(s => s.id === 1) || { id: 1, name: 'Main Store' },
    total_amount: 1299.97,
    paid_amount: 1300,
    change_amount: 0.03,
    items: [
      {
        id: 1,
        product_id: 1,
        product: mockProductsData?.find(p => p.id === 1) || { id: 1, name: 'Product 1', sku: 'SKU001' },
        quantity: 2,
        unit_id: 1,
        unit_code: 'PC',
        price: 499.99,
        gst: 18,
        discount: 0,
        total_price: 999.98,
      },
      {
        id: 2,
        product_id: 3,
        product: mockProductsData?.find(p => p.id === 3) || { id: 3, name: 'Product 3', sku: 'SKU003' },
        quantity: 1,
        unit_id: 1,
        unit_code: 'PC',
        price: 299.99,
        gst: 12,
        discount: 0,
        total_price: 299.99,
      }
    ],
    payment_method: 'cash',
    created_by: 1,
    created_at: '2024-03-15T10:30:00Z',
    updated_at: '2024-03-15T10:30:00Z',
  },
  {
    id: 2,
    invoice_no: 'INV-2024-002',
    user_id: 1,
    customer_id: 2,
    customer: mockCustomersData.find(c => c.id === 2),
    store_id: 1,
    store: mockStoresData?.find(s => s.id === 1) || { id: 1, name: 'Main Store' },
    total_amount: 749.98,
    paid_amount: 750,
    change_amount: 0.02,
    items: [
      {
        id: 3,
        product_id: 2,
        product: mockProductsData?.find(p => p.id === 2) || { id: 2, name: 'Product 2', sku: 'SKU002' },
        quantity: 1,
        unit_id: 1,
        unit_code: 'PC',
        price: 649.99,
        gst: 18,
        discount: 0,
        total_price: 649.99,
      },
      {
        id: 4,
        product_id: 4,
        product: mockProductsData?.find(p => p.id === 4) || { id: 4, name: 'Product 4', sku: 'SKU004' },
        quantity: 2,
        unit_id: 1,
        unit_code: 'PC',
        price: 49.99,
        gst: 12,
        discount: 0,
        total_price: 99.98,
      }
    ],
    payment_method: 'card',
    created_by: 1,
    created_at: '2024-03-16T14:45:00Z',
    updated_at: '2024-03-16T14:45:00Z',
  },
  {
    id: 3,
    invoice_no: 'INV-2024-003',
    user_id: 2,
    customer_id: 3,
    customer: mockCustomersData.find(c => c.id === 3),
    store_id: 2,
    store: mockStoresData?.find(s => s.id === 2) || { id: 2, name: 'Branch Store' },
    total_amount: 189.99,
    paid_amount: 200,
    change_amount: 10.01,
    items: [
      {
        id: 5,
        product_id: 5,
        product: mockProductsData?.find(p => p.id === 5) || { id: 5, name: 'Product 5', sku: 'SKU005' },
        quantity: 3,
        unit_id: 1,
        unit_code: 'PC',
        price: 39.99,
        gst: 12,
        discount: 5,
        total_price: 113.97,
      },
      {
        id: 6,
        product_id: 6,
        product: mockProductsData?.find(p => p.id === 6) || { id: 6, name: 'Product 6', sku: 'SKU006' },
        quantity: 1,
        unit_id: 1,
        unit_code: 'PC',
        price: 79.99,
        gst: 18,
        discount: 0,
        total_price: 79.99,
      }
    ],
    payment_method: 'cash',
    created_by: 2,
    created_at: '2024-03-17T11:20:00Z',
    updated_at: '2024-03-17T11:20:00Z',
  },
];

export const mockBills = {
  get: async (url, config = {}) => {
    console.log('Mock Bills API call:', url, config);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url === '/invoice/bill-history') {
      let filteredBills = [...mockBillsData];
      
      // Handle search
      if (config.params?.search) {
        const searchTerm = config.params.search.toLowerCase();
        filteredBills = filteredBills.filter(bill => 
          bill.invoice_no?.toLowerCase().includes(searchTerm) ||
          bill.customer?.name?.toLowerCase().includes(searchTerm) ||
          bill.total_amount?.toString().includes(searchTerm) ||
          bill.items?.some(item => 
            item.product?.name?.toLowerCase().includes(searchTerm) ||
            item.product?.sku?.toLowerCase().includes(searchTerm)
          )
        );
      }
      
      // Handle date range filter
      if (config.params?.start_date && config.params?.end_date) {
        const startDate = new Date(config.params.start_date);
        const endDate = new Date(config.params.end_date);
        filteredBills = filteredBills.filter(bill => {
          const billDate = new Date(bill.created_at);
          return billDate >= startDate && billDate <= endDate;
        });
      }
      
      return {
        data: {
          data: filteredBills,
          message: 'Bills retrieved successfully',
          status: true
        }
      };
    }
    
    if (url.startsWith('/invoice/')) {
      const id = parseInt(url.split('/').pop());
      const bill = mockBillsData.find(b => b.id === id);
      
      if (bill) {
        return {
          data: {
            data: bill,
            message: 'Bill retrieved successfully',
            status: true
          }
        };
      }
    }
    
    if (url === '/bill-customers') {
      return {
        data: {
          data: mockCustomersData,
          message: 'Customers retrieved successfully',
          status: true
        }
      };
    }
    
    return { data: { data: null, message: 'Not found', status: false } };
  },
  
  post: async (url, data) => {
    console.log('Mock POST:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url === '/invoice/store') {
      const customer = mockCustomersData.find(c => c.id === data.customer_id) || {
        id: data.customer_id,
        name: 'Customer',
      };
      const store = mockStoresData?.find(s => s.id === data.store_id) || {
        id: data.store_id,
        name: 'Store',
      };
      
      const totalAmount = data.items.reduce((sum, item) => sum + item.total_price, 0);
      const changeAmount = data.paid_amount > totalAmount ? data.paid_amount - totalAmount : 0;
      
      const newBill = {
        id: mockBillsData.length + 1,
        invoice_no: `INV-2024-${String(mockBillsData.length + 1).padStart(3, '0')}`,
        user_id: data.user_id,
        customer_id: data.customer_id,
        customer: customer,
        store_id: data.store_id,
        store: store,
        total_amount: totalAmount,
        paid_amount: data.paid_amount,
        change_amount: changeAmount,
        items: data.items.map((item, index) => ({
          id: mockBillsData.length * 10 + index + 1,
          product_id: item.product_id,
          product: mockProductsData?.find(p => p.id === item.product_id) || {
            id: item.product_id,
            name: `Product ${item.product_id}`,
          },
          quantity: item.quantity,
          unit_id: item.unit_id,
          unit_code: 'PC',
          price: item.price,
          gst: item.gst,
          discount: item.discount,
          total_price: item.total_price,
        })),
        payment_method: 'cash',
        created_by: data.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockBillsData.push(newBill);
      
      return {
        data: {
          data: newBill,
          message: 'Bill created successfully',
          status: true
        }
      };
    }
    
    if (url === '/bill-customer/store') {
      const newCustomer = {
        id: mockCustomersData.length + 1,
        ...data,
        created_at: new Date().toISOString(),
      };
      mockCustomersData.push(newCustomer);
      
      return {
        data: {
          data: newCustomer,
          message: 'Customer created successfully',
          status: true
        }
      };
    }
  },
  
  put: async (url, data) => {
    console.log('Mock PUT:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = parseInt(url.split('/').pop());
    const index = mockBillsData.findIndex(b => b.id === id);
    
    if (index !== -1) {
      const totalAmount = data.items.reduce((sum, item) => sum + item.total_price, 0);
      const changeAmount = data.paid_amount > totalAmount ? data.paid_amount - totalAmount : 0;
      
      mockBillsData[index] = {
        ...mockBillsData[index],
        customer_id: data.customer_id,
        store_id: data.store_id,
        total_amount: totalAmount,
        paid_amount: data.paid_amount,
        change_amount: changeAmount,
        items: data.items.map((item, idx) => ({
          id: mockBillsData[index].items?.[idx]?.id || (index * 10 + idx + 1),
          product_id: item.product_id,
          product: mockProductsData?.find(p => p.id === item.product_id) || {
            id: item.product_id,
            name: `Product ${item.product_id}`,
          },
          quantity: item.quantity,
          unit_id: item.unit_id,
          unit_code: 'PC',
          price: item.price,
          gst: item.gst,
          discount: item.discount,
          total_price: item.total_price,
        })),
        updated_at: new Date().toISOString(),
      };
      
      return {
        data: {
          data: mockBillsData[index],
          message: 'Bill updated successfully',
          status: true
        }
      };
    }
    
    throw { response: { data: { message: 'Bill not found', status: false } } };
  },
  
  delete: async (url) => {
    console.log('Mock DELETE:', url);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = parseInt(url.split('/').pop());
    const index = mockBillsData.findIndex(b => b.id === id);
    
    if (index !== -1) {
      mockBillsData.splice(index, 1);
      
      return {
        data: {
          data: null,
          message: 'Bill deleted successfully',
          status: true
        }
      };
    }
    
    throw { response: { data: { message: 'Bill not found', status: false } } };
  }
};