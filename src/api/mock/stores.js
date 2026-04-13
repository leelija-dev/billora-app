export const mockStores = {
  get: async (url, config) => {
    console.log('Mock store API called:', url, config);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock store data
    const mockStoreData = [
      {
        id: 1,
        user_id: 1,
        name: 'Leelija Electronics',
        gst: '27AAAPL1234C1Z5',
        email: 'leelija@example.com',
        logo: 'https://via.placeholder.com/150',
        mobile: '9876543210',
        address: '123 Main Street, Andheri East',
        city: 'Mumbai',
        status: 1,
        created_by: 1,
        created_at: '2024-01-15T10:30:00.000Z',
        updated_at: '2024-01-15T10:30:00.000Z',
      },
      {
        id: 2,
        user_id: 1,
        name: 'Leelija Fashion',
        gst: '29AABCL7894D1Z2',
        email: 'fashion@leelija.com',
        logo: 'https://via.placeholder.com/150',
        mobile: '9876543222',
        address: '45 Linking Road, Bandra West',
        city: 'Mumbai',
        status: 1,
        created_by: 1,
        created_at: '2024-02-20T14:20:00.000Z',
        updated_at: '2024-02-20T14:20:00.000Z',
      },
      {
        id: 3,
        user_id: 1,
        name: 'Leelija Home Appliances',
        gst: '07AAAPL5678C1Z9',
        email: 'home@leelija.com',
        logo: 'https://via.placeholder.com/150',
        mobile: '9876543233',
        address: '78 Commercial Street, Shivaji Nagar',
        city: 'Pune',
        status: 0,
        created_by: 1,
        created_at: '2024-03-05T09:15:00.000Z',
        updated_at: '2024-03-05T09:15:00.000Z',
      },
    ];
    
    // Handle different endpoints
    if (url.includes('/store/store')) {
      return { data: { data: { id: 4, ...config.data }, message: 'Store created successfully', status: true } };
    }
    
    if (url.includes('/store/edit/')) {
      const id = parseInt(url.split('/').pop());
      const store = mockStoreData.find(s => s.id === id);
      return { data: { data: store, message: 'Store found', status: true } };
    }
    
    if (url.match(/\/store\/\d+$/) && config.method === 'put') {
      const id = parseInt(url.split('/').pop());
      return { data: { data: { id, ...config.data }, message: 'Store updated successfully', status: true } };
    }
    
    if (url.match(/\/store\/\d+$/) && config.method === 'delete') {
      return { data: { message: 'Store deleted successfully', status: true } };
    }
    
    // Get all stores for user
    if (url.includes('/store/')) {
      const userId = parseInt(url.split('/').pop());
      let stores = [...mockStoreData];
      
      // Filter by user_id
      stores = stores.filter(s => s.user_id === userId);
      
      // Handle search
      if (config.params?.search) {
        const searchTerm = config.params.search.toLowerCase();
        stores = stores.filter(s => 
          s.name.toLowerCase().includes(searchTerm) ||
          s.gst?.toLowerCase().includes(searchTerm) ||
          s.mobile?.includes(searchTerm) ||
          s.address.toLowerCase().includes(searchTerm) ||
          s.city.toLowerCase().includes(searchTerm)
        );
      }
      
      return { 
        data: { 
          data: stores, 
          message: 'Stores retrieved successfully', 
          status: true 
        } 
      };
    }
    
    return { data: { data: [], message: 'Not found', status: false } };
  },
  
  post: async (url, data) => {
    console.log('Mock store POST:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url.includes('/store/store')) {
      return { 
        data: { 
          data: { id: 4, ...data, created_at: new Date().toISOString() }, 
          message: 'Store created successfully', 
          status: true 
        } 
      };
    }
    
    if (url.includes('/store/edit/')) {
      const id = parseInt(url.split('/').pop());
      return { 
        data: { 
          data: { 
            id, 
            user_id: 1,
            name: 'Sample Store',
            gst: '27AAAPL1234C1Z5',
            email: 'store@example.com',
            logo: null,
            mobile: '9876543210',
            address: '123 Main Street',
            city: 'Mumbai',
            status: 1,
            created_by: 1,
            created_at: '2024-01-15T10:30:00.000Z',
            updated_at: '2024-01-15T10:30:00.000Z',
          }, 
          message: 'Store found', 
          status: true 
        } 
      };
    }
    
    return { data: { data: null, message: 'Not found', status: false } };
  },
  
  put: async (url, data) => {
    console.log('Mock store PUT:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = parseInt(url.split('/').pop());
    return { 
      data: { 
        data: { id, ...data, updated_at: new Date().toISOString() }, 
        message: 'Store updated successfully', 
        status: true 
      } 
    };
  },
  
  delete: async (url) => {
    console.log('Mock store DELETE:', url);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      data: { 
        message: 'Store deleted successfully', 
        status: true 
      } 
    };
  },
};