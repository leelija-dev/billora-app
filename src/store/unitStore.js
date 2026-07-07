// store/unitStore.js
import { create } from 'zustand';
import { unitsAPI } from '../api/units';
import { getPaginatedData, getEntityData } from '../api/client';

const useUnitStore = create((set, get) => ({
  units: [],
  totalUnits: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 8,
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

  // ✅ Fetch units with pagination
  fetchUnits: async (page = 1, append = false) => {
    const { filters, perPage, units: existingUnits } = get();
    console.log('🔄 fetchUnits called:', { page, append, filters });

    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await unitsAPI.getAll(page, perPage, { 
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      console.log('📦 Units API Response:', response);
      
      const paginatedData = getPaginatedData(response);
      console.log('📊 Extracted paginated data:', paginatedData);

      let unitsArray = paginatedData.data || [];
      
      if (!Array.isArray(unitsArray)) {
        unitsArray = [];
      }

      console.log('📊 Processed units:', unitsArray.length, 'units');

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

      const pageData = {
        current_page: paginatedData.current_page || page,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || perPage,
        total: paginatedData.total || sortedUnits.length,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };

      const finalUnits = append && page > 1 
        ? [...existingUnits, ...sortedUnits]
        : sortedUnits;

      const hasMoreData = pageData.current_page < pageData.last_page;

      set({
        units: finalUnits,
        totalUnits: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Loaded ${finalUnits.length} units (Page ${pageData.current_page}/${pageData.last_page})`);
      return { success: true, data: finalUnits, pagination: pageData };
      
    } catch (error) {
      console.error('❌ Failed to fetch units:', error);
      set({
        units: append ? get().units : [],
        totalUnits: 0,
        currentPage: 1,
        lastPage: 1,
        pagination: null,
        hasMore: false,
        loading: false,
        loadingMore: false,
        error: error.message || 'Failed to fetch units',
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Load next page (append for infinite scroll)
  loadNextPage: async () => {
    const { hasMore, loadingMore, loading, currentPage, lastPage } = get();
    
    console.log(`🔄 Load more: hasMore=${hasMore}, loadingMore=${loadingMore}, loading=${loading}, currentPage=${currentPage}, lastPage=${lastPage}`);
    
    if (loadingMore || loading || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    set({ loadingMore: true });
    const nextPage = currentPage + 1;
    console.log(`📡 Fetching next page: ${nextPage}`);

    try {
      await get().fetchUnits(nextPage, true);
    } catch (error) {
      console.error("❌ Failed to load more units:", error);
      set({ loadingMore: false });
    }
  },

  // ✅ Get single unit
  getUnit: async (id) => {
    console.log('🔍 getUnit called with:', id);
    try {
      const response = await unitsAPI.getById(id);
      console.log('📦 getUnit response:', response);
      
      const unit = getEntityData(response);
      console.log('📊 Extracted unit:', unit);
      
      return { success: true, data: unit };
    } catch (error) {
      console.error('❌ Failed to fetch unit:', error);
      return { success: false, error: error.message };
    }
  },

  // ✅ Create unit
  createUnit: async (unitData) => {
    console.log('📝 createUnit called with:', unitData);
    set({ loading: true, error: null });

    try {
      const response = await unitsAPI.create(unitData);
      console.log('✅ Unit creation API response:', response);
      
      let newUnit = getEntityData(response);
      console.log('📊 Extracted new unit:', newUnit);
      
      if (!newUnit || !newUnit.id) {
        const paginatedData = getPaginatedData(response);
        const allUnits = paginatedData.data || [];
        if (Array.isArray(allUnits) && allUnits.length > 0) {
          newUnit = allUnits[allUnits.length - 1];
          console.log('📊 Extracted new unit from array (last item):', newUnit);
        }
      }
      
      if (newUnit && newUnit.id) {
        console.log('✅ New unit extracted successfully:', newUnit);
        await get().fetchUnits(1, false);
        set({ loading: false, error: null });
        return { success: true, data: newUnit };
      } else {
        console.error('❌ Could not extract new unit from response');
        await get().fetchUnits(1, false);
        set({ loading: false });
        return { 
          success: true, 
          data: null,
          message: "Unit created but couldn't extract data. List refreshed." 
        };
      }
      
    } catch (error) {
      console.error('❌ Failed to create unit:', error);
      set({
        error: error.message || 'Failed to create unit',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Update unit
  updateUnit: async (id, unitData) => {
    console.log('✏️ updateUnit called:', { id, unitData });
    set({ loading: true, error: null });

    try {
      const response = await unitsAPI.update(id, unitData);
      console.log('✅ Unit updated successfully:', response);
      
      const updatedUnit = getEntityData(response);
      console.log('📊 Extracted updated unit:', updatedUnit);

      if (!updatedUnit || !updatedUnit.id) {
        throw new Error('No unit data returned from API');
      }

      const { units } = get();
      set({
        units: units.map(unit => unit.id === id ? updatedUnit : unit),
        loading: false,
        error: null,
      });

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

  // ✅ Delete unit
  deleteUnit: async (id) => {
    console.log('🗑️ deleteUnit called with:', id);
    set({ loading: true, error: null });

    try {
      await unitsAPI.delete(id);
      console.log('✅ Unit deleted successfully');

      const { units } = get();
      set({
        units: units.filter(unit => unit.id !== id),
        totalUnits: Math.max(0, (units?.length || 0) - 1),
        loading: false,
        error: null,
      });

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

  // ✅ Set filters with auto-fetch
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ 
      filters: updatedFilters,
      currentPage: 1,
      hasMore: true,
    });

    setTimeout(() => {
      get().fetchUnits(1, false);
    }, 300);
  },

  // ✅ Set page with auto-fetch
  setPage: (page) => {
    const { lastPage } = get();
    if (page >= 1 && page <= lastPage) {
      set({ currentPage: page });
      get().fetchUnits(page, false);
    }
  },

  // ✅ Reset state
  resetUnits: () => {
    set({
      units: [],
      totalUnits: 0,
      currentPage: 1,
      lastPage: 1,
      pagination: null,
      hasMore: true,
      loading: false,
      loadingMore: false,
      error: null,
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useUnitStore;