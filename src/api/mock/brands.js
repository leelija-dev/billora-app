export const mockBrands = {
  get: async (url, config) => {
    console.log('Mock brands API called:', url, config);
    
    // Handle different endpoints
    if (url === '/brands') {
      return {
        data: {
          data: [
            {
              id: 1,
              name: 'Nike',
              description: 'Leading athletic footwear and apparel brand',
              slug: 'nike',
              is_active: true,
              user_id: 1,
              created_by: 1,
              created_at: '2024-01-15T10:30:00Z',
              updated_at: '2024-01-15T10:30:00Z'
            },
            {
              id: 2,
              name: 'Apple',
              description: 'Innovative technology products',
              slug: 'apple',
              is_active: true,
              user_id: 1,
              created_by: 1,
              created_at: '2024-01-16T11:20:00Z',
              updated_at: '2024-01-16T11:20:00Z'
            },
            {
              id: 3,
              name: 'Samsung',
              description: 'Electronics and home appliances',
              slug: 'samsung',
              is_active: true,
              user_id: 2,
              created_by: 2,
              created_at: '2024-01-17T09:15:00Z',
              updated_at: '2024-01-17T09:15:00Z'
            },
            {
              id: 4,
              name: 'Sony',
              description: 'Entertainment and electronics',
              slug: 'sony',
              is_active: false,
              user_id: 2,
              created_by: 2,
              created_at: '2024-01-18T14:45:00Z',
              updated_at: '2024-01-18T14:45:00Z'
            }
          ],
          message: 'Brands retrieved successfully',
          status: true
        }
      };
    }
    
    // Handle single brand requests
    const idMatch = url.match(/\/brands\/(\d+)/);
    if (idMatch) {
      const id = parseInt(idMatch[1]);
      const brands = [
        {
          id: 1,
          name: 'Nike',
          description: 'Leading athletic footwear and apparel brand',
          slug: 'nike',
          is_active: true,
          user_id: 1,
          created_by: 1,
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'Apple',
          description: 'Innovative technology products',
          slug: 'apple',
          is_active: true,
          user_id: 1,
          created_by: 1,
          created_at: '2024-01-16T11:20:00Z',
          updated_at: '2024-01-16T11:20:00Z'
        },
        {
          id: 3,
          name: 'Samsung',
          description: 'Electronics and home appliances',
          slug: 'samsung',
          is_active: true,
          user_id: 2,
          created_by: 2,
          created_at: '2024-01-17T09:15:00Z',
          updated_at: '2024-01-17T09:15:00Z'
        },
        {
          id: 4,
          name: 'Sony',
          description: 'Entertainment and electronics',
          slug: 'sony',
          is_active: false,
          user_id: 2,
          created_by: 2,
          created_at: '2024-01-18T14:45:00Z',
          updated_at: '2024-01-18T14:45:00Z'
        }
      ];
      const brand = brands.find(b => b.id === id);
      
      return {
        data: {
          data: brand,
          message: brand ? 'Brand retrieved successfully' : 'Brand not found',
          status: !!brand
        }
      };
    }
    
    return { data: { data: [] } };
  },
  
  post: async (url, data) => {
    console.log('Mock brands POST:', url, data);
    
    if (url === '/brands/store') {
      return {
        data: {
          data: {
            id: Math.floor(Math.random() * 1000),
            ...data,
            slug: data.name.toLowerCase().replace(/\s+/g, '-'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          message: 'Brand created successfully',
          status: true
        }
      };
    }
    
    return { data: { data: null, message: 'Unknown endpoint', status: false } };
  },
  
  put: async (url, data) => {
    console.log('Mock brands PUT:', url, data);
    
    const idMatch = url.match(/\/brands\/(\d+)/);
    if (idMatch) {
      const id = parseInt(idMatch[1]);
      return {
        data: {
          data: {
            id,
            ...data,
            slug: data.name.toLowerCase().replace(/\s+/g, '-'),
            updated_at: new Date().toISOString()
          },
          message: 'Brand updated successfully',
          status: true
        }
      };
    }
    
    return { data: { data: null, message: 'Brand not found', status: false } };
  },
  
  delete: async (url) => {
    console.log('Mock brands DELETE:', url);
    
    const idMatch = url.match(/\/brands\/(\d+)/);
    if (idMatch) {
      return {
        data: {
          data: null,
          message: 'Brand deleted successfully',
          status: true
        }
      };
    }
    
    return { data: { data: null, message: 'Brand not found', status: false } };
  }
};