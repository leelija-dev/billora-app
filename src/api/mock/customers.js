// Mock customers data for development
export const mockCustomersData = [
  {
    id: 1,
    admin_id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    address: '123 Main Street, Downtown',
    city: 'New York',
    due_amount: 1500.00,
    total_purchases: 12500.00,
    total_paid: 11000.00,
    created_by: 1,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    deleted_at: null,
  },
  {
    id: 2,
    admin_id: 1,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '9876543211',
    address: '456 Oak Avenue',
    city: 'Los Angeles',
    due_amount: 750.50,
    total_purchases: 8750.50,
    total_paid: 8000.00,
    created_by: 1,
    created_at: '2024-01-16T11:45:00Z',
    updated_at: '2024-01-16T11:45:00Z',
    deleted_at: null,
  },
  {
    id: 3,
    admin_id: 1,
    name: 'Raj Kumar',
    email: 'raj.kumar@example.com',
    phone: '9876543212',
    address: '789 Pine Road',
    city: 'Mumbai',
    due_amount: 0.00,
    total_purchases: 5000.00,
    total_paid: 5000.00,
    created_by: 1,
    created_at: '2024-01-17T09:20:00Z',
    updated_at: '2024-01-17T09:20:00Z',
    deleted_at: null,
  },
  {
    id: 4,
    admin_id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '9876543213',
    address: '321 Elm Street',
    city: 'Chicago',
    due_amount: 2500.00,
    total_purchases: 15000.00,
    total_paid: 12500.00,
    created_by: 2,
    created_at: '2024-01-18T14:30:00Z',
    updated_at: '2024-01-18T14:30:00Z',
    deleted_at: null,
  },
  {
    id: 5,
    admin_id: 1,
    name: 'Mike Wilson',
    email: 'mike.w@example.com',
    phone: '9876543214',
    address: '654 Maple Drive',
    city: 'Houston',
    due_amount: 3200.75,
    total_purchases: 18200.75,
    total_paid: 15000.00,
    created_by: 1,
    created_at: '2024-01-19T16:15:00Z',
    updated_at: '2024-01-19T16:15:00Z',
    deleted_at: null,
  },
  {
    id: 6,
    admin_id: 1,
    name: 'Lisa Chen',
    email: 'lisa.chen@example.com',
    phone: '9876543215',
    address: '987 Cedar Lane',
    city: 'San Francisco',
    due_amount: 0.00,
    total_purchases: 8900.00,
    total_paid: 8900.00,
    created_by: 1,
    created_at: '2024-01-20T10:45:00Z',
    updated_at: '2024-01-20T10:45:00Z',
    deleted_at: null,
  },
  // Soft deleted customer
  {
    id: 7,
    admin_id: 1,
    name: 'Deleted Customer',
    email: 'deleted@example.com',
    phone: '9876543216',
    address: '123 Deleted Street',
    city: 'Nowhere',
    due_amount: 500.00,
    total_purchases: 2500.00,
    total_paid: 2000.00,
    created_by: 1,
    created_at: '2024-01-21T12:00:00Z',
    updated_at: '2024-01-21T12:00:00Z',
    deleted_at: '2024-02-01T10:00:00Z',
  },
];

// Mock payment history
export const mockPaymentHistory = [
  {
    id: 1,
    customer_id: 1,
    amount: 500.00,
    type: 'payment',
    date: '2024-02-15T10:30:00Z',
    description: 'Partial payment',
  },
  {
    id: 2,
    customer_id: 1,
    amount: 1000.00,
    type: 'payment',
    date: '2024-02-01T14:20:00Z',
    description: 'Payment received',
  },
  {
    id: 3,
    customer_id: 1,
    amount: 1500.00,
    type: 'purchase',
    date: '2024-01-15T11:45:00Z',
    description: 'Invoice #INV-001',
  },
];

export const mockCustomers = {
  get: async (url, config = {}) => {
    console.log('Mock Customers API call:', url, config);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Handle /customer/{userId} pattern
    if (url.match(/^\/customer\/\d+$/)) {
      const userId = parseInt(url.split('/').pop());
      let filteredCustomers = mockCustomersData.filter(c => c.admin_id === userId && !c.deleted_at);
      
      // Handle search
      if (config.params?.search) {
        const searchTerm = config.params.search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(c => 
          c.name?.toLowerCase().includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm) ||
          c.phone?.toLowerCase().includes(searchTerm) ||
          c.address?.toLowerCase().includes(searchTerm) ||
          c.city?.toLowerCase().includes(searchTerm) ||
          c.due_amount?.toString().includes(searchTerm)
        );
      }
      
      return {
        data: {
          data: filteredCustomers,
          message: 'Customers retrieved successfully',
          status: true
        }
      };
    }
    
    // Handle /customer/show/{id} pattern
    if (url.match(/^\/customer\/show\/\d+$/)) {
      const id = parseInt(url.split('/').pop());
      const customer = mockCustomersData.find(c => c.id === id);
      
      if (customer) {
        // Filter payment history by date if provided
        let paymentHistory = [...mockPaymentHistory].filter(p => p.customer_id === id);
        
        if (config.params?.start_date && config.params?.end_date) {
          const startDate = new Date(config.params.start_date);
          const endDate = new Date(config.params.end_date);
          paymentHistory = paymentHistory.filter(p => {
            const pDate = new Date(p.date);
            return pDate >= startDate && pDate <= endDate;
          });
        }
        
        return {
          data: {
            data: {
              ...customer,
              payment_history: paymentHistory
            },
            message: 'Customer retrieved successfully',
            status: true
          }
        };
      }
    }
    
    // Handle /customer/trashed
    if (url === '/customer/trashed') {
      const trashedCustomers = mockCustomersData.filter(c => c.deleted_at);
      return {
        data: {
          data: trashedCustomers,
          message: 'Trashed customers retrieved successfully',
          status: true
        }
      };
    }
    
    return { data: { data: null, message: 'Not found', status: false } };
  },
  
  post: async (url, data) => {
    console.log('Mock POST:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url === '/customer/store') {
      const newCustomer = {
        id: mockCustomersData.length + 1,
        admin_id: data.admin_id,
        name: data.name,
        email: data.email || '',
        phone: data.phone,
        address: data.address,
        city: data.city || '',
        due_amount: 0,
        total_purchases: 0,
        total_paid: 0,
        created_by: data.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
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
    
    return { data: { data: null, message: 'Not found', status: false } };
  },
  
  put: async (url, data) => {
    console.log('Mock PUT:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Handle due payment
    if (url.includes('/due-payment/')) {
      const id = parseInt(url.split('/').pop());
      const index = mockCustomersData.findIndex(c => c.id === id);
      
      if (index !== -1) {
        mockCustomersData[index].due_amount += parseFloat(data.due_payment) || 0;
        mockCustomersData[index].updated_at = new Date().toISOString();
        
        // Add to payment history
        mockPaymentHistory.push({
          id: mockPaymentHistory.length + 1,
          customer_id: id,
          amount: parseFloat(data.due_payment),
          type: 'due_added',
          date: new Date().toISOString(),
          description: 'Due payment added',
        });
        
        return {
          data: {
            data: mockCustomersData[index],
            message: 'Due payment added successfully',
            status: true
          }
        };
      }
    }
    
    // Handle regular update
    const id = parseInt(url.split('/').pop());
    const index = mockCustomersData.findIndex(c => c.id === id);
    
    if (index !== -1) {
      mockCustomersData[index] = {
        ...mockCustomersData[index],
        name: data.name,
        email: data.email || '',
        phone: data.phone,
        address: data.address,
        city: data.city || '',
        updated_at: new Date().toISOString(),
      };
      
      return {
        data: {
          data: mockCustomersData[index],
          message: 'Customer updated successfully',
          status: true
        }
      };
    }
    
    throw { response: { data: { message: 'Customer not found', status: false } } };
  },
  
  patch: async (url) => {
    console.log('Mock PATCH:', url);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Handle restore
    const id = parseInt(url.split('/').pop());
    const index = mockCustomersData.findIndex(c => c.id === id);
    
    if (index !== -1) {
      mockCustomersData[index].deleted_at = null;
      mockCustomersData[index].updated_at = new Date().toISOString();
      
      return {
        data: {
          data: mockCustomersData[index],
          message: 'Customer restored successfully',
          status: true
        }
      };
    }
    
    throw { response: { data: { message: 'Customer not found', status: false } } };
  },
  
  delete: async (url) => {
    console.log('Mock DELETE:', url);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Handle force delete
    if (url.includes('/force')) {
      const id = parseInt(url.split('/').slice(-2)[0]);
      const index = mockCustomersData.findIndex(c => c.id === id);
      
      if (index !== -1) {
        mockCustomersData.splice(index, 1);
        
        return {
          data: {
            data: null,
            message: 'Customer permanently deleted',
            status: true
          }
        };
      }
    }
    
    // Handle soft delete
    const id = parseInt(url.split('/').pop());
    const index = mockCustomersData.findIndex(c => c.id === id);
    
    if (index !== -1) {
      mockCustomersData[index].deleted_at = new Date().toISOString();
      
      return {
        data: {
          data: null,
          message: 'Customer deleted successfully',
          status: true
        }
      };
    }
    
    throw { response: { data: { message: 'Customer not found', status: false } } };
  }
};