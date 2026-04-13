// Mock categories data and functions
let mockCategoriesList = [
  { id: 1, user_id: 1, name: 'T-Shirts', is_active: true, description: 'Cotton t-shirts', created_by: 1 },
  { id: 2, user_id: 1, name: 'Jeans', is_active: true, description: 'Denim jeans', created_by: 1 },
  { id: 3, user_id: 1, name: 'Shoes', is_active: true, description: 'Footwear', created_by: 1 },
  { id: 4, user_id: 1, name: 'Electronics', is_active: false, description: 'Electronic devices', created_by: 1 },
];

const mockCategories = {
  get: async (endpoint, params = {}) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (endpoint === '/brands/categories') {
      let filteredCategories = [...mockCategoriesList];
      
      // Apply filters
      if (params.search) {
        filteredCategories = filteredCategories.filter(c => 
          c.name.toLowerCase().includes(params.search.toLowerCase())
        );
      }

      return {
        data: {
          success: true,
          categories: filteredCategories,
        }
      };
    }

    if (endpoint.startsWith('/brands/categories/')) {
      const id = parseInt(endpoint.split('/')[3]);
      const category = mockCategoriesList.find(c => c.id === id);
      
      if (!category) {
        throw {
          response: {
            data: { message: 'Category not found' }
          }
        };
      }

      return {
        data: {
          success: true,
          category: category,
        }
      };
    }

    throw {
      response: {
        data: { message: 'Endpoint not found' }
      }
    };
  },

  post: async (endpoint, data) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (endpoint === '/brands/categories/store') {
      const newCategory = {
        id: mockCategoriesList.length + 1,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockCategoriesList.push(newCategory);

      return {
        data: {
          success: true,
          message: 'Category created successfully',
          category: newCategory,
        }
      };
    }

    throw {
      response: {
        data: { message: 'Endpoint not found' }
      }
    };
  },

  put: async (endpoint, data) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (endpoint.startsWith('/brands/categories/')) {
      const id = parseInt(endpoint.split('/')[3]);
      const categoryIndex = mockCategoriesList.findIndex(c => c.id === id);

      if (categoryIndex === -1) {
        throw {
          response: {
            data: { message: 'Category not found' }
          }
        };
      }

      mockCategoriesList[categoryIndex] = { 
        ...mockCategoriesList[categoryIndex], 
        ...data, 
        updated_at: new Date().toISOString() 
      };

      return {
        data: {
          success: true,
          message: 'Category updated successfully',
          category: mockCategoriesList[categoryIndex],
        }
      };
    }

    throw {
      response: {
        data: { message: 'Endpoint not found' }
      }
    };
  },

  delete: async (endpoint) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (endpoint.startsWith('/brands/categories/')) {
      const id = parseInt(endpoint.split('/')[3]);
      const categoryIndex = mockCategoriesList.findIndex(c => c.id === id);

      if (categoryIndex === -1) {
        throw {
          response: {
            data: { message: 'Category not found' }
          }
        };
      }

      mockCategoriesList.splice(categoryIndex, 1);

      return {
        data: {
          success: true,
          message: 'Category deleted successfully',
        }
      };
    }

    throw {
      response: {
        data: { message: 'Endpoint not found' }
      }
    };
  },
};

export { mockCategories };
