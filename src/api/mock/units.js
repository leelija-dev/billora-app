// Mock units data for development
export const mockUnits = {
  get: async (url, config = {}) => {
    console.log('Mock API call:', url, config);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url === '/units') {
      return {
        data: {
          data: mockUnitsData,
          message: 'Units retrieved successfully',
          status: true
        }
      };
    }
    
    if (url.startsWith('/units/') && !url.includes('/store')) {
      const id = url.split('/').pop();
      const unit = mockUnitsData.find(u => u.id === parseInt(id));
      
      if (unit) {
        return {
          data: {
            data: unit,
            message: 'Unit retrieved successfully',
            status: true
          }
        };
      }
    }
    
    return { data: { data: null, message: 'Not found', status: false } };
  },
  
  post: async (url, data) => {
    console.log('Mock POST:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url === '/units/store') {
      const newUnit = {
        id: mockUnitsData.length + 1,
        code: data.code,
        name: data.name,
        user_id: data.user_id,
        created_by: data.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      mockUnitsData.push(newUnit);
      
      return {
        data: {
          data: newUnit,
          message: 'Unit created successfully',
          status: true
        }
      };
    }
  },
  
  put: async (url, data) => {
    console.log('Mock PUT:', url, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = url.split('/').pop();
    const index = mockUnitsData.findIndex(u => u.id === parseInt(id));
    
    if (index !== -1) {
      mockUnitsData[index] = {
        ...mockUnitsData[index],
        code: data.code,
        name: data.name,
        updated_at: new Date().toISOString(),
      };
      
      return {
        data: {
          data: mockUnitsData[index],
          message: 'Unit updated successfully',
          status: true
        }
      };
    }
    
    throw { response: { data: { message: 'Unit not found', status: false } } };
  },
  
  delete: async (url) => {
    console.log('Mock DELETE:', url);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const id = url.split('/').pop();
    const index = mockUnitsData.findIndex(u => u.id === parseInt(id));
    
    if (index !== -1) {
      mockUnitsData.splice(index, 1);
      
      return {
        data: {
          data: null,
          message: 'Unit deleted successfully',
          status: true
        }
      };
    }
    
    throw { response: { data: { message: 'Unit not found', status: false } } };
  }
};

// Mock units data
export const mockUnitsData = [
  {
    id: 1,
    code: 'KG',
    name: 'Kilogram',
    user_id: 1,
    created_by: 1,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    code: 'G',
    name: 'Gram',
    user_id: 1,
    created_by: 1,
    created_at: '2024-01-15T10:31:00Z',
    updated_at: '2024-01-15T10:31:00Z',
  },
  {
    id: 3,
    code: 'L',
    name: 'Liter',
    user_id: 1,
    created_by: 1,
    created_at: '2024-01-15T10:32:00Z',
    updated_at: '2024-01-15T10:32:00Z',
  },
  {
    id: 4,
    code: 'ML',
    name: 'Milliliter',
    user_id: 1,
    created_by: 1,
    created_at: '2024-01-15T10:33:00Z',
    updated_at: '2024-01-15T10:33:00Z',
  },
  {
    id: 5,
    code: 'PC',
    name: 'Piece',
    user_id: 2,
    created_by: 2,
    created_at: '2024-01-16T09:15:00Z',
    updated_at: '2024-01-16T09:15:00Z',
  },
  {
    id: 6,
    code: 'BX',
    name: 'Box',
    user_id: 2,
    created_by: 2,
    created_at: '2024-01-16T09:16:00Z',
    updated_at: '2024-01-16T09:16:00Z',
  },
  {
    id: 7,
    code: 'PK',
    name: 'Pack',
    user_id: 2,
    created_by: 2,
    created_at: '2024-01-16T09:17:00Z',
    updated_at: '2024-01-16T09:17:00Z',
  },
  {
    id: 8,
    code: 'M',
    name: 'Meter',
    user_id: 1,
    created_by: 1,
    created_at: '2024-01-17T14:20:00Z',
    updated_at: '2024-01-17T14:20:00Z',
  },
  {
    id: 9,
    code: 'CM',
    name: 'Centimeter',
    user_id: 1,
    created_by: 1,
    created_at: '2024-01-17T14:21:00Z',
    updated_at: '2024-01-17T14:21:00Z',
  },
  {
    id: 10,
    code: 'DOZ',
    name: 'Dozen',
    user_id: 3,
    created_by: 3,
    created_at: '2024-01-18T11:45:00Z',
    updated_at: '2024-01-18T11:45:00Z',
  }
];