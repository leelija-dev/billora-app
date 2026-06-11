// store/categoryStore.js
import { create } from 'zustand';
import { categoriesAPI } from '../api/categories';

const useCategoryStore = create((set, get) => ({
  categories: [],
  totalCategories: 0,
  currentPage: 1,
  pageSize: 15,
  loading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  },

  fetchCategories: async (page = 1, filters = {}) => {
    console.log('fetchCategories called with:', page, filters);
    set({ loading: true, error: null });

    try {
      const allFilters = { ...get().filters, ...filters };
      const params = {};
      if (allFilters.search) params.search = allFilters.search;
      
      const response = await categoriesAPI.getAll(page, params);
      console.log('API Response in store:', response);

      let categoriesArray = [];
      if (response?.data?.data) {
        categoriesArray = response.data.data;
      } else if (response?.data) {
        categoriesArray = Array.isArray(response.data) ? response.data : [response.data];
      } else if (Array.isArray(response)) {
        categoriesArray = response;
      }

      let filteredCategories = categoriesArray;
      if (allFilters.status !== 'all') {
        const isActive = allFilters.status === 'active';
        filteredCategories = categoriesArray.filter(
          (c) => (c.is_active === true || c.is_active === 1) === isActive
        );
      }

      const { sortBy, sortOrder } = allFilters;
      filteredCategories.sort((a, b) => {
        let valA, valB;
        if (sortBy === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        } else if (sortBy === 'date') {
          valA = new Date(a.updated_at || a.created_at || 0).getTime();
          valB = new Date(b.updated_at || b.created_at || 0).getTime();
        } else if (sortBy === 'status') {
          valA = (a.is_active === true || a.is_active === 1) ? 1 : 0;
          valB = (b.is_active === true || b.is_active === 1) ? 1 : 0;
        } else {
          valA = a.id || 0;
          valB = b.id || 0;
        }

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });

      set({
        categories: filteredCategories,
        totalCategories: filteredCategories.length,
        currentPage: page,
        loading: false,
      });

      return response;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      set({
        categories: [],
        totalCategories: 0,
        loading: false,
        error: error.message || 'Failed to fetch categories',
      });
    }
  },

  getCategory: async (id) => {
    console.log('getCategory called with:', id);
    try {
      const response = await categoriesAPI.getById(id);
      console.log('✅ Category fetched successfully:', response);
      return response?.data || response;
    } catch (error) {
      console.error('Failed to fetch category:', error);
      throw error;
    }
  },

  createCategory: async (categoryData) => {
    console.log('createCategory called with:', categoryData);
    set({ loading: true, error: null });

    try {
      // Ensure user_id is properly set
      const payload = {
        user_id: categoryData.user_id || categoryData.userId,
        name: categoryData.name,
        is_active: categoryData.is_active === true || categoryData.is_active === 1 ? 1 : 0,
        created_by: categoryData.created_by || categoryData.user_id || categoryData.userId,
        description: categoryData.description || '',
      };
      
      console.log('Create Category API payload:', payload);
      const response = await categoriesAPI.create(payload);
      console.log('✅ Category created successfully:', response);
      await get().fetchCategories();
      set({ loading: false });
      return response?.data || response;
    } catch (error) {
      console.error('Failed to create category:', error);
      set({
        error: error.message || 'Failed to create category',
        loading: false,
      });
      throw error;
    }
  },

  updateCategory: async (id, categoryData) => {
    console.log('updateCategory called with:', id, categoryData);
    set({ loading: true, error: null });

    try {
      const payload = {
        name: categoryData.name,
        is_active: categoryData.is_active === true || categoryData.is_active === 1 ? 1 : 0,
        description: categoryData.description || '',
      };
      
      if (categoryData.user_id) {
        payload.user_id = categoryData.user_id;
      }
      
      console.log('Update Category API payload:', payload);
      const response = await categoriesAPI.update(id, payload);
      console.log('✅ Category updated successfully:', response);
      await get().fetchCategories();
      set({ loading: false });
      return response?.data || response;
    } catch (error) {
      console.error('Failed to update category:', error);
      set({
        error: error.message || 'Failed to update category',
        loading: false,
      });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    console.log('deleteCategory called with:', id);
    set({ loading: true, error: null });

    try {
      await categoriesAPI.delete(id);
      console.log('✅ Category deleted successfully');
      await get().fetchCategories();
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error('Failed to delete category:', error);
      set({
        error: error.message || 'Failed to delete category',
        loading: false,
      });
      throw error;
    }
  },

  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });
    setTimeout(() => {
      get().fetchCategories(1, updatedFilters);
    }, 100);
  },

  clearError: () => set({ error: null }),
}));

export default useCategoryStore;