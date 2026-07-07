// store/medicineTypeStore.js
import { create } from 'zustand';
import { medicineTypeAPI } from '../api/medicineType';
import { getPaginatedData, getEntityData } from '../api/client';

const useMedicineTypeStore = create((set, get) => ({
  medicineTypes: [],
  totalMedicineTypes: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 15,
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  pagination: null,
  filters: {
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  },

  // ✅ FIXED: Fetch medicine types for a user
  fetchMedicineTypes: async (userId, page = 1, search = "", append = false) => {
    console.log('🔄 fetchMedicineTypes called:', { userId, page, search, append });
    
    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await medicineTypeAPI.getAll(userId, page, search);
      console.log('📦 Medicine Types API Response:', response);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log('📊 Extracted paginated data:', paginatedData);

      let medicineTypesArray = paginatedData.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(medicineTypesArray)) {
        medicineTypesArray = [];
      }
      
      console.log(`📊 Extracted ${medicineTypesArray.length} medicine types`);

      // ✅ Apply client-side sorting
      const { sortBy, sortOrder } = get().filters;
      const sortedTypes = [...medicineTypesArray].sort((a, b) => {
        let valA, valB;
        if (sortBy === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        } else if (sortBy === 'date') {
          valA = new Date(a.created_at || a.updated_at || 0).getTime();
          valB = new Date(b.created_at || b.updated_at || 0).getTime();
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
      
      // ✅ Build pagination info
      const pageData = {
        current_page: paginatedData.current_page || page,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || 15,
        total: paginatedData.total || sortedTypes.length,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };

      // If append is true and page > 1, append to existing types
      const { medicineTypes: existingTypes } = get();
      const finalTypes = append && page > 1 
        ? [...existingTypes, ...sortedTypes]
        : sortedTypes;
      
      const hasMoreData = pageData.current_page < pageData.last_page;

      set({
        medicineTypes: finalTypes,
        totalMedicineTypes: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        perPage: pageData.per_page || 15,
        pagination: pageData,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
        error: null,
      });
      
      console.log(`✅ Medicine types loaded: ${finalTypes.length}, page ${pageData.current_page}/${pageData.last_page}, hasMore: ${hasMoreData}`);
      return { success: true, data: finalTypes, pagination: pageData };
      
    } catch (error) {
      console.error('❌ Failed to fetch medicine types:', error);
      set({
        medicineTypes: append ? get().medicineTypes : [],
        totalMedicineTypes: 0,
        loading: false,
        loadingMore: false,
        error: error.message || 'Failed to fetch medicine types',
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Load more medicine types (for infinite scroll)
  loadMoreMedicineTypes: async (userId, search = "") => {
    const { currentPage, lastPage, hasMore, loading, loadingMore } = get();
    
    if (loading || loadingMore || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    console.log(`📜 loadMoreMedicineTypes - currentPage: ${currentPage}, lastPage: ${lastPage}`);
    set({ loadingMore: true });

    try {
      const nextPage = currentPage + 1;
      await get().fetchMedicineTypes(userId, nextPage, search, true);
    } catch (error) {
      console.error('❌ Failed to load more medicine types:', error);
      set({ loadingMore: false });
    }
  },

  // ✅ Force refresh medicine types
  forceRefreshMedicineTypes: async (userId) => {
    console.log('🔄 forceRefreshMedicineTypes called for user:', userId);
    set({ loading: true, error: null });
    
    try {
      const response = await medicineTypeAPI.getAll(userId, 1, get().filters.search);
      console.log('📦 Force refresh API Response:', response);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log('📊 Force refresh paginated:', paginatedData);

      let medicineTypesArray = paginatedData.data || [];
      
      if (!Array.isArray(medicineTypesArray)) {
        medicineTypesArray = [];
      }
      
      console.log(`📊 Force refresh: ${medicineTypesArray.length} medicine types`);
      
      // ✅ Apply sorting
      const { sortBy, sortOrder } = get().filters;
      const sortedTypes = [...medicineTypesArray].sort((a, b) => {
        let valA, valB;
        if (sortBy === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        } else if (sortBy === 'date') {
          valA = new Date(a.created_at || a.updated_at || 0).getTime();
          valB = new Date(b.created_at || b.updated_at || 0).getTime();
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
      
      const pageData = {
        current_page: paginatedData.current_page || 1,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || 15,
        total: paginatedData.total || sortedTypes.length,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };
      
      const hasMoreData = pageData.current_page < pageData.last_page;

      set({
        medicineTypes: sortedTypes,
        totalMedicineTypes: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        perPage: pageData.per_page || 15,
        pagination: pageData,
        hasMore: hasMoreData,
        loading: false,
        error: null,
      });
      
      return { success: true, data: sortedTypes, pagination: pageData };
      
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      set({
        error: error.message || 'Failed to fetch medicine types',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Get single medicine type
  getMedicineType: async (id) => {
    console.log('🔍 getMedicineType called with:', id);
    set({ loading: true, error: null });
    
    try {
      const response = await medicineTypeAPI.getById(id);
      console.log('📦 getMedicineType response:', response);
      
      // ✅ Use helper to extract entity data
      const medicineType = getEntityData(response);
      console.log('📊 Extracted medicine type:', medicineType);
      
      set({ loading: false, error: null });
      return { success: true, data: medicineType };
      
    } catch (error) {
      console.error('❌ Failed to fetch medicine type:', error);
      set({
        error: error.message || 'Failed to fetch medicine type',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Create medicine type
  createMedicineType: async (medicineTypeData) => {
    console.log('📝 createMedicineType called with:', medicineTypeData);
    set({ loading: true, error: null });
    
    try {
      const response = await medicineTypeAPI.create(medicineTypeData);
      console.log('✅ Medicine type created successfully:', response);
      
      // ✅ Use helper to extract entity data
      const newMedicineType = getEntityData(response);
      console.log('📊 Extracted new medicine type:', newMedicineType);
      
      // Optimistic update
      if (newMedicineType && newMedicineType.id) {
        const { medicineTypes } = get();
        set({
          medicineTypes: [newMedicineType, ...medicineTypes],
          totalMedicineTypes: medicineTypes.length + 1,
          loading: false,
          error: null,
        });
      } else {
        set({ loading: false, error: null });
      }
      
      return { success: true, data: newMedicineType };
      
    } catch (error) {
      console.error('❌ Failed to create medicine type:', error);
      set({
        error: error.message || 'Failed to create medicine type',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Update medicine type
  updateMedicineType: async (id, medicineTypeData) => {
    console.log('✏️ updateMedicineType called:', { id, medicineTypeData });
    set({ loading: true, error: null });
    
    try {
      const response = await medicineTypeAPI.update(id, medicineTypeData);
      console.log('✅ Medicine type updated successfully:', response);
      
      // ✅ Use helper to extract entity data
      const updatedMedicineType = getEntityData(response);
      console.log('📊 Extracted updated medicine type:', updatedMedicineType);
      
      // Optimistic update
      if (updatedMedicineType && updatedMedicineType.id) {
        const { medicineTypes } = get();
        set({
          medicineTypes: medicineTypes.map(type => 
            type.id === id ? updatedMedicineType : type
          ),
          loading: false,
          error: null,
        });
      } else {
        set({ loading: false, error: null });
      }
      
      return { success: true, data: updatedMedicineType };
      
    } catch (error) {
      console.error('❌ Failed to update medicine type:', error);
      set({
        error: error.message || 'Failed to update medicine type',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Delete medicine type
  deleteMedicineType: async (id) => {
    console.log('🗑️ deleteMedicineType called with:', id);
    set({ loading: true, error: null });
    
    try {
      await medicineTypeAPI.delete(id);
      console.log('✅ Medicine type deleted successfully');
      
      // Optimistic update
      const { medicineTypes } = get();
      set({
        medicineTypes: medicineTypes.filter(type => type.id !== id),
        totalMedicineTypes: Math.max(0, medicineTypes.length - 1),
        loading: false,
        error: null,
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to delete medicine type:', error);
      set({
        error: error.message || 'Failed to delete medicine type',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Search medicine types
  searchMedicineTypes: async (userId, query) => {
    console.log('🔍 searchMedicineTypes called with:', query);
    set({ loading: true, error: null });
    
    try {
      const response = await medicineTypeAPI.getAll(userId, 1, query);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log('🔍 Search results paginated:', paginatedData);

      let medicineTypesArray = paginatedData.data || [];
      
      if (!Array.isArray(medicineTypesArray)) {
        medicineTypesArray = [];
      }
      
      // ✅ Apply sorting
      const { sortBy, sortOrder } = get().filters;
      const sortedTypes = [...medicineTypesArray].sort((a, b) => {
        let valA, valB;
        if (sortBy === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
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
      
      const pageData = {
        current_page: paginatedData.current_page || 1,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || 15,
        total: paginatedData.total || sortedTypes.length,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };
      
      const hasMoreData = pageData.current_page < pageData.last_page;

      set({
        medicineTypes: sortedTypes,
        totalMedicineTypes: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        perPage: pageData.per_page || 15,
        pagination: pageData,
        hasMore: hasMoreData,
        loading: false,
        error: null,
      });
      
      return { success: true, data: sortedTypes, pagination: pageData };
      
    } catch (error) {
      console.error('❌ Failed to search medicine types:', error);
      set({
        error: error.message || 'Failed to search medicine types',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Set filters with auto-fetch
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ 
      filters: updatedFilters,
      currentPage: 1,
      hasMore: true,
    });
    
    // Auto-fetch with new filters (debounced)
    setTimeout(() => {
      const { useAuthStore } = require('../store/authStore');
      const user = useAuthStore.getState().user;
      if (user?.id) {
        get().fetchMedicineTypes(user.id, 1, updatedFilters.search, false);
      }
    }, 300);
  },

  // ✅ Set page with auto-fetch
  setPage: (page) => {
    const { lastPage } = get();
    if (page >= 1 && page <= lastPage) {
      set({ currentPage: page });
      const { useAuthStore } = require('../store/authStore');
      const user = useAuthStore.getState().user;
      const { filters } = get();
      if (user?.id) {
        get().fetchMedicineTypes(user.id, page, filters.search, false);
      }
    }
  },

  // ✅ Reset to page 1
  resetToPageOne: async (userId, search = "") => {
    await get().fetchMedicineTypes(userId, 1, search, false);
  },

  // ✅ Reset state
  reset: () => {
    set({
      medicineTypes: [],
      totalMedicineTypes: 0,
      currentPage: 1,
      lastPage: 1,
      perPage: 15,
      loading: false,
      loadingMore: false,
      hasMore: true,
      error: null,
      pagination: null,
      filters: {
        search: '',
        sortBy: 'name',
        sortOrder: 'asc',
      },
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useMedicineTypeStore;