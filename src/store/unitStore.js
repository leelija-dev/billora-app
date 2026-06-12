// store/unitStore.js
import { create } from 'zustand';
import { unitsAPI } from '../api/units';

const useUnitStore = create((set, get) => ({
  units: [],
  totalUnits: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 15,
  loading: false,
  error: null,
  filters: {
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  },

  // Fetch units with pagination
  fetchUnits: async (page = 1) => {
    const { filters, perPage } = get();
    console.log('🔄 fetchUnits called with page:', page, 'filters:', filters);
    set({ loading: true, error: null });

    try {
      const response = await unitsAPI.getAll(page, perPage, { search: filters.search });
      
      console.log('📦 Units API Response:', response.data);
      
      // Extract units array - handling different response structures
      let unitsArray = [];
      let total = 0;
      let currentPageNum = page;
      let lastPageNum = 1;
      
      // Desktop structure: response.data.data.data
      if (response?.data?.data?.data) {
        unitsArray = response.data.data.data;
        total = response.data.data.total || unitsArray.length;
        currentPageNum = response.data.data.current_page || page;
        lastPageNum = response.data.data.last_page || 1;
      } 
      // Alternative: response.data.data
      else if (response?.data?.data) {
        unitsArray = Array.isArray(response.data.data) ? response.data.data : [];
        total = unitsArray.length;
      }
      // Simple: response.data
      else if (response?.data) {
        unitsArray = Array.isArray(response.data) ? response.data : [];
        total = unitsArray.length;
      }
      
      console.log('📊 Processed units:', unitsArray.length, 'units');

      // Apply sorting
      const { sortBy, sortOrder } = filters;
      const sortedUnits = [...unitsArray].sort((a, b) => {
        let valA, valB;
        if (sortBy === 'name') {
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
        } else if (sortBy === 'code') {
          valA = (a.code || '').toLowerCase();
          valB = (b.code || '').toLowerCase();
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
        units: sortedUnits,
        totalUnits: total,
        currentPage: currentPageNum,
        lastPage: lastPageNum,
        loading: false,
      });

      return response;
    } catch (error) {
      console.error('❌ Failed to fetch units:', error);
      set({
        units: [],
        totalUnits: 0,
        loading: false,
        error: error.message || 'Failed to fetch units',
      });
    }
  },

  // Get single unit
  getUnit: async (id) => {
    console.log('🔍 getUnit called with:', id);
    try {
      const response = await unitsAPI.getById(id);
      return response?.data?.data || response?.data || response;
    } catch (error) {
      console.error('❌ Failed to fetch unit:', error);
      throw error;
    }
  },

  // Create unit
  createUnit: async (unitData) => {
    console.log('📝 createUnit called with:', unitData);
    set({ loading: true, error: null });

    try {
      const response = await unitsAPI.create(unitData);
      console.log('✅ Unit created successfully:', response.data);
      
      const newUnit = response?.data?.data || response?.data || response;
      
      await get().fetchUnits();
      set({ loading: false });
      return { success: true, data: newUnit };
    } catch (error) {
      console.error('❌ Failed to create unit:', error);
      set({
        error: error.message || 'Failed to create unit',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Update unit
  updateUnit: async (id, unitData) => {
    console.log('✏️ updateUnit called with:', id, unitData);
    set({ loading: true, error: null });

    try {
      const response = await unitsAPI.update(id, unitData);
      console.log('✅ Unit updated successfully:', response.data);
      
      const updatedUnit = response?.data?.data || response?.data || response;
      
      await get().fetchUnits();
      set({ loading: false });
      return { success: true, data: updatedUnit };
    } catch (error) {
      console.error('❌ Failed to update unit:', error);
      set({
        error: error.message || 'Failed to update unit',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Delete unit
  deleteUnit: async (id) => {
    console.log('🗑️ deleteUnit called with:', id);
    set({ loading: true, error: null });

    try {
      await unitsAPI.delete(id);
      console.log('✅ Unit deleted successfully');

      await get().fetchUnits();
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete unit:', error);
      set({
        error: error.message || 'Failed to delete unit',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // Set filters
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });

    setTimeout(() => {
      get().fetchUnits(1);
    }, 100);
  },

  // Change page
  setPage: (page) => {
    get().fetchUnits(page);
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useUnitStore;