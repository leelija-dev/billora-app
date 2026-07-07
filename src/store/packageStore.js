// store/packageStore.js
import { create } from 'zustand';
import { packagesAPI } from '../api/packages';
import { getPaginatedData, getEntityData } from '../api/client';

const usePackageStore = create((set, get) => ({
  // State
  packages: [],
  totalPackages: 0,
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
    sortBy: 'package_name',
    sortOrder: 'asc',
  },
  _filterTimeout: null,

  // ✅ FIXED: Fetch packages with pagination
  fetchPackages: async (page = 1, userId, append = false) => {
    const { filters, perPage } = get();
    
    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      if (!userId) {
        throw new Error('User ID is required to fetch packages');
      }

      console.log(`📡 Fetching packages page ${page} for user ${userId}`);
      const response = await packagesAPI.getAll(userId, page, perPage, filters.search);
      console.log('📦 Packages API response:', response);

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log('📊 Extracted paginated data:', paginatedData);

      // Extract packages array
      let packagesData = paginatedData.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(packagesData)) {
        packagesData = [];
      }

      console.log(`✅ Fetched ${packagesData.length} packages, page ${paginatedData.current_page}/${paginatedData.last_page}`);
      console.log(`📊 Total packages: ${paginatedData.total}, Has more: ${paginatedData.current_page < paginatedData.last_page}`);

      const hasMore = paginatedData.current_page < paginatedData.last_page;

      // ✅ Apply client-side sorting
      const { sortBy, sortOrder } = filters;
      const sortedPackages = [...packagesData].sort((a, b) => {
        let valA, valB;
        if (sortBy === 'package_name') {
          valA = (a.package_name || '').toLowerCase();
          valB = (b.package_name || '').toLowerCase();
        } else if (sortBy === 'package_price') {
          valA = parseFloat(a.package_price || 0);
          valB = parseFloat(b.package_price || 0);
        } else if (sortBy === 'package_size') {
          valA = parseInt(a.package_size || 0);
          valB = parseInt(b.package_size || 0);
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

      // Update state
      set((state) => ({
        packages: append ? [...state.packages, ...sortedPackages] : sortedPackages,
        currentPage: paginatedData.current_page || page,
        lastPage: paginatedData.last_page || 1,
        totalPackages: paginatedData.total || sortedPackages.length,
        hasMore: hasMore,
        pagination: paginatedData,
        loading: false,
        loadingMore: false,
        error: null,
      }));

      return { success: true, data: sortedPackages, pagination: paginatedData };
      
    } catch (error) {
      console.error('❌ Failed to fetch packages:', error);
      set({ 
        loading: false, 
        loadingMore: false,
        hasMore: false,
        error: error.message || 'Failed to fetch packages',
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Load more packages for pagination
  loadMorePackages: async (userId) => {
    const { hasMore, loadingMore, loading, currentPage, lastPage, filters, perPage } = get();
    
    console.log(`🔄 Load more: hasMore=${hasMore}, loadingMore=${loadingMore}, loading=${loading}, currentPage=${currentPage}, lastPage=${lastPage}`);
    
    // Prevent loading if already loading, no more packages, or reached last page
    if (loadingMore || loading || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    set({ loadingMore: true });
    const nextPage = currentPage + 1;
    console.log(`📡 Fetching next page: ${nextPage}`);

    try {
      const response = await packagesAPI.getAll(userId, nextPage, perPage, filters.search);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log('📊 Load more paginated:', paginatedData);

      let packagesData = paginatedData.data || [];
      
      if (!Array.isArray(packagesData)) {
        packagesData = [];
      }

      console.log(`✅ Loaded ${packagesData.length} more packages, page ${paginatedData.current_page}/${paginatedData.last_page}`);

      const hasMore = paginatedData.current_page < paginatedData.last_page;

      set((state) => {
        // Create a Set of existing package IDs to avoid duplicates
        const existingIds = new Set(state.packages.map(p => p.id));
        const newPackages = packagesData.filter(p => !existingIds.has(p.id));
        
        return {
          packages: [...state.packages, ...newPackages],
          currentPage: paginatedData.current_page || nextPage,
          lastPage: paginatedData.last_page || 1,
          totalPackages: paginatedData.total || state.totalPackages,
          hasMore: hasMore,
          pagination: paginatedData,
          loadingMore: false,
          error: null,
        };
      });

      return { success: true, data: packagesData };
      
    } catch (error) {
      console.error('❌ Failed to load more packages:', error);
      set({ 
        loadingMore: false, 
        error: error.message || 'Failed to load more packages' 
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Get single package
  getPackage: async (id) => {
    console.log(`🔍 getPackage called with ID: ${id}`);
    set({ loading: true, error: null });
    
    try {
      const response = await packagesAPI.getById(id);
      console.log(`✅ Package ${id} fetched successfully`);
      
      // ✅ Use helper to extract entity data
      const packageData = getEntityData(response);
      console.log('📊 Extracted package:', packageData);
      
      set({ loading: false, error: null });
      return { success: true, data: packageData };
      
    } catch (error) {
      console.error(`❌ Failed to fetch package ${id}:`, error);
      set({
        error: error.message || 'Failed to fetch package',
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Create package
  createPackage: async (userId, packageData) => {
    console.log('📝 createPackage called');
    set({ loading: true, error: null });

    try {
      const response = await packagesAPI.create(userId, packageData);
      console.log('✅ Package created successfully:', response);

      // ✅ Use helper to extract entity data
      const newPackage = getEntityData(response);
      console.log('📊 Extracted new package:', newPackage);

      // Optimistic update
      if (newPackage && newPackage.id) {
        const { packages } = get();
        set({
          packages: [newPackage, ...packages],
          totalPackages: packages.length + 1,
          loading: false,
          error: null,
        });
      }

      // Optionally refresh the list
      // await get().fetchPackages(1, userId, false);

      set({ loading: false, error: null });
      return { success: true, data: newPackage };
      
    } catch (error) {
      console.error('❌ Failed to create package:', error);
      const errorMessage = error.message || 'Failed to create package';
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Update package
  updatePackage: async (id, packageData) => {
    console.log(`✏️ updatePackage called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      const response = await packagesAPI.update(id, packageData);
      console.log(`✅ Package ${id} updated successfully:`, response);

      // ✅ Use helper to extract entity data
      const updatedPackage = getEntityData(response);
      console.log('📊 Extracted updated package:', updatedPackage);

      // Optimistic update
      if (updatedPackage && updatedPackage.id) {
        const { packages } = get();
        set({
          packages: packages.map(pkg => 
            pkg.id === id ? updatedPackage : pkg
          ),
          loading: false,
          error: null,
        });
      }

      // Optionally refresh the list
      // const { useAuthStore } = require('./authStore');
      // const user = useAuthStore.getState().user;
      // if (user?.id) {
      //   await get().fetchPackages(get().currentPage, user.id, false);
      // }

      set({ loading: false, error: null });
      return { success: true, data: updatedPackage };
      
    } catch (error) {
      console.error(`❌ Failed to update package ${id}:`, error);
      const errorMessage = error.message || 'Failed to update package';
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Delete package
  deletePackage: async (id) => {
    console.log(`🗑️ deletePackage called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      await packagesAPI.delete(id);
      console.log(`✅ Package ${id} deleted successfully`);

      // Remove from local state
      const { packages } = get();
      set({
        packages: packages.filter(pkg => pkg.id !== id),
        totalPackages: Math.max(0, packages.length - 1),
        loading: false,
        error: null,
      });

      // Optionally refresh the list
      // const { useAuthStore } = require('./authStore');
      // const user = useAuthStore.getState().user;
      // if (user?.id) {
      //   await get().fetchPackages(get().currentPage, user.id, false);
      // }

      set({ loading: false, error: null });
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Failed to delete package ${id}:`, error);
      const errorMessage = error.message || 'Failed to delete package';
      set({
        error: errorMessage,
        loading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ FIXED: Set filters with auto-fetch
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    console.log('🔍 Setting filters:', updatedFilters);
    
    set({
      filters: updatedFilters,
      currentPage: 1,
      hasMore: true,
    });

    // Debounce the fetch
    if (get()._filterTimeout) {
      clearTimeout(get()._filterTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      const { useAuthStore } = require('./authStore');
      const user = useAuthStore.getState().user;
      if (user?.id) {
        get().fetchPackages(1, user.id, false);
      }
    }, 300);

    set({ _filterTimeout: timeoutId });
  },

  // ✅ FIXED: Search packages
  searchPackages: async (userId, query) => {
    console.log(`🔍 Searching packages with query: "${query}"`);
    set({ loading: true, error: null });

    try {
      const response = await packagesAPI.getAll(userId, 1, get().perPage, query);
      
      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log('🔍 Search results paginated:', paginatedData);

      let packagesData = paginatedData.data || [];
      
      if (!Array.isArray(packagesData)) {
        packagesData = [];
      }

      const hasMoreData = paginatedData.current_page < paginatedData.last_page;

      set({
        packages: packagesData,
        totalPackages: paginatedData.total || packagesData.length,
        currentPage: paginatedData.current_page || 1,
        lastPage: paginatedData.last_page || 1,
        perPage: paginatedData.per_page || get().perPage,
        pagination: paginatedData,
        hasMore: hasMoreData,
        loading: false,
        error: null,
      });

      console.log(`✅ Search completed: ${packagesData.length} packages found`);
      return { success: true, data: packagesData, pagination: paginatedData };
      
    } catch (error) {
      console.error('❌ Failed to search packages:', error);
      const errorMessage = error.message || 'Failed to search packages';
      set({
        loading: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  },

  // ✅ Reset to page 1
  resetToPageOne: async (userId) => {
    await get().fetchPackages(1, userId, false);
  },

  // ✅ Clear error
  clearError: () => set({ error: null }),

  // ✅ Reset store
  reset: () => {
    console.log('🔄 Resetting package store');
    if (get()._filterTimeout) {
      clearTimeout(get()._filterTimeout);
    }
    set({
      packages: [],
      totalPackages: 0,
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
        sortBy: 'package_name',
        sortOrder: 'asc',
      },
      _filterTimeout: null,
    });
  },
}));

export { usePackageStore };
export default usePackageStore;