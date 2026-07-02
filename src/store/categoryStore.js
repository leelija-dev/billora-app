// store/categoryStore.js
import { create } from 'zustand';
import { categoriesAPI } from '../api/categories';

const useCategoryStore = create((set, get) => ({
  categories: [],
  totalCategories: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 8,
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 8,
    total: 0,
    next_page_url: null,
    prev_page_url: null,
    first_page_url: null,
    last_page_url: null,
    path: null,
    from: null,
    to: null,
  },
  filters: {
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  },

  fetchCategories: async (page = 1, forceRefresh = false, append = false) => {
    console.log('fetchCategories called with page:', page, 'forceRefresh:', forceRefresh, 'append:', append);
    set({ loading: true, error: null });

    try {
      const { filters, perPage, categories: existingCategories } = get();
      const params = {};
      if (filters.search) params.search = filters.search;
      params.page = page;
      params.per_page = perPage;
      
      const response = await categoriesAPI.getAll(page, params);
      console.log('API Response in store:', response);

      let categoriesArray = [];
      let paginatedData = response;
      
      // Handle paginated response
      if (paginatedData?.data && Array.isArray(paginatedData.data)) {
        categoriesArray = paginatedData.data;
      } else if (Array.isArray(paginatedData)) {
        categoriesArray = paginatedData;
      } else if (paginatedData && typeof paginatedData === 'object') {
        categoriesArray = [paginatedData];
      }

      console.log(`📦 Extracted ${categoriesArray.length} categories`);

      // Combine with existing categories if appending
      const finalCategories = append && !forceRefresh && page > 1
        ? [...existingCategories, ...categoriesArray]
        : categoriesArray;

      // Extract pagination info
      const paginationInfo = {
        current_page: paginatedData?.current_page || page,
        last_page: paginatedData?.last_page || 1,
        per_page: paginatedData?.per_page || perPage,
        total: paginatedData?.total || finalCategories.length,
        next_page_url: paginatedData?.next_page_url || null,
        prev_page_url: paginatedData?.prev_page_url || null,
        first_page_url: paginatedData?.first_page_url || null,
        last_page_url: paginatedData?.last_page_url || null,
        path: paginatedData?.path || null,
        from: paginatedData?.from || null,
        to: paginatedData?.to || null,
      };

      set({
        categories: finalCategories,
        totalCategories: paginationInfo.total,
        currentPage: paginationInfo.current_page,
        lastPage: paginationInfo.last_page,
        pagination: paginationInfo,
        loading: false,
      });

      console.log(`✅ Categories loaded successfully: ${finalCategories.length} categories`);
      return response;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      set({
        categories: [],
        totalCategories: 0,
        loading: false,
        error: error.message || 'Failed to fetch categories',
      });
      // Don't throw error - let the UI handle the empty state
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
      get().fetchCategories(1, true, false);
    }, 100);
  },

  reset: () => {
    set({
      categories: [],
      totalCategories: 0,
      currentPage: 1,
      lastPage: 1,
      perPage: 8,
      loading: false,
      error: null,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 8,
        total: 0,
        next_page_url: null,
        prev_page_url: null,
        first_page_url: null,
        last_page_url: null,
        path: null,
        from: null,
        to: null,
      },
    });
  },

  clearError: () => set({ error: null }),
}));

export default useCategoryStore;