import { create } from 'zustand';
import { packagesAPI } from '../api/packages';

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
    sortBy: 'package_name',
    sortOrder: 'asc',
  },
  _filterTimeout: null,

  // Fetch packages with pagination
  fetchPackages: async (userId, page = 1, forceRefresh = false, append = false) => {
    const { filters, perPage, packages: existingPackages } = get();

    console.log('🔄 fetchPackages called with page:', page, 'forceRefresh:', forceRefresh, 'append:', append);
    
    // If not appending, set loading; if appending, use loadingMore
    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const response = await packagesAPI.getAll(userId, page, perPage, filters.search);
      console.log('📦 Packages API Response received');

      const paginatedData = response.data || {};
      const packagesData = paginatedData.data || [];
      const newPackages = Array.isArray(packagesData) ? packagesData : [];

      console.log(`📦 Extracted ${newPackages.length} packages`);

      const pagination = {
        current_page: paginatedData.current_page || 1,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || perPage,
        total: paginatedData.total || 0,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };

      const hasMoreData = pagination.current_page < pagination.last_page;

      // If append is true, append to existing packages (with duplicate prevention)
      let finalPackages;
      if (append && page > 1 && !forceRefresh) {
        const existingIds = new Set(existingPackages.map(p => p.id));
        const uniqueNewPackages = newPackages.filter(p => !existingIds.has(p.id));
        finalPackages = [...existingPackages, ...uniqueNewPackages];
        console.log(`📦 Appended ${uniqueNewPackages.length} new packages, total: ${finalPackages.length}`);
      } else {
        finalPackages = newPackages;
      }

      set({
        packages: finalPackages,
        totalPackages: pagination.total,
        currentPage: pagination.current_page,
        lastPage: pagination.last_page,
        perPage: pagination.per_page,
        pagination: pagination,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Packages loaded successfully: ${finalPackages.length} packages, hasMore: ${hasMoreData}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch packages:', error);
      
      const errorMessage = error.message || 'Failed to fetch packages';
      set({
        packages: append ? get().packages : [],
        totalPackages: append ? get().totalPackages : 0,
        loading: false,
        loadingMore: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // Load more packages for pagination
  loadMorePackages: async (userId) => {
    const { filters, perPage, packages: existingPackages, hasMore, loading, loadingMore, currentPage, lastPage } = get();

    // Prevent loading if already loading or no more data
    if (loading || loadingMore || !hasMore) {
      console.log('⏭️ Skipping load more - already loading or no more data');
      return;
    }

    if (currentPage >= lastPage) {
      console.log('⏭️ Skipping - reached last page');
      return;
    }

    console.log(`🔄 loadMorePackages called with page: ${currentPage + 1}`);
    set({ loadingMore: true, error: null });

    try {
      const nextPage = currentPage + 1;
      const response = await packagesAPI.getAll(userId, nextPage, perPage, filters.search);
      console.log('📦 Packages API Response received for page:', nextPage);

      const paginatedData = response.data || {};
      const packagesData = paginatedData.data || [];
      const newPackages = Array.isArray(packagesData) ? packagesData : [];

      console.log(`📦 Extracted ${newPackages.length} packages from page ${nextPage}`);

      // Create a Set of existing package IDs to avoid duplicates
      const existingIds = new Set(existingPackages.map(p => p.id));
      const uniqueNewPackages = newPackages.filter(p => !existingIds.has(p.id));

      const pagination = {
        current_page: paginatedData.current_page || 1,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || perPage,
        total: paginatedData.total || 0,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };

      const hasMoreData = pagination.current_page < pagination.last_page;

      set({
        packages: [...existingPackages, ...uniqueNewPackages],
        totalPackages: pagination.total,
        currentPage: pagination.current_page,
        lastPage: pagination.last_page,
        perPage: pagination.per_page,
        pagination: pagination,
        hasMore: hasMoreData,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Load more completed: ${uniqueNewPackages.length} new packages, total: ${get().packages.length}, hasMore: ${hasMoreData}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to load more packages:', error);
      
      const errorMessage = error.message || 'Failed to load more packages';
      set({
        loadingMore: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // Get single package
  getPackage: async (id) => {
    console.log(`🔍 getPackage called with ID: ${id}`);
    set({ loading: true, error: null });
    
    try {
      const response = await packagesAPI.getById(id);
      console.log(`✅ Package ${id} fetched successfully`);
      
      let packageData = null;
      if (response?.data?.data) {
        packageData = response.data.data;
      } else if (response?.data) {
        packageData = response.data;
      } else {
        packageData = response;
      }
      
      set({ loading: false });
      return packageData;
    } catch (error) {
      console.error(`❌ Failed to fetch package ${id}:`, error);
      set({
        error: error.message || 'Failed to fetch package',
        loading: false,
      });
      throw error;
    }
  },

  // Create package
  createPackage: async (userId, packageData) => {
    console.log('📝 createPackage called');
    set({ loading: true, error: null });

    try {
      const response = await packagesAPI.create(userId, packageData);
      console.log('✅ Package created successfully');

      const newPackage = response.data?.data || response.data || response;

      // Refresh packages list - reset to page 1
      await get().fetchPackages(userId, 1, true, false);

      set({ loading: false });
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

  // Update package
  updatePackage: async (id, packageData) => {
    console.log(`✏️ updatePackage called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      const response = await packagesAPI.update(id, packageData);
      console.log(`✅ Package ${id} updated successfully`);

      const updatedPackage = response.data?.data || response.data || response;

      // Refresh packages list at current page
      const { useAuthStore } = require('./authStore');
      const user = useAuthStore.getState().user;
      if (user?.id) {
        await get().fetchPackages(user.id, get().currentPage, true, false);
      }

      set({ loading: false });
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

  // Delete package
  deletePackage: async (id) => {
    console.log(`🗑️ deletePackage called for ID: ${id}`);
    set({ loading: true, error: null });

    try {
      await packagesAPI.delete(id);
      console.log(`✅ Package ${id} deleted successfully`);

      // Refresh packages list at current page
      const { useAuthStore } = require('./authStore');
      const user = useAuthStore.getState().user;
      if (user?.id) {
        await get().fetchPackages(user.id, get().currentPage, true, false);
      }

      set({ loading: false });
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

  // Set filters
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
        get().fetchPackages(user.id, 1, true, false);
      }
    }, 300);

    set({ _filterTimeout: timeoutId });
  },

  // Search packages
  searchPackages: async (userId, query) => {
    console.log(`🔍 Searching packages with query: "${query}"`);
    set({ loading: true, error: null });

    try {
      const response = await packagesAPI.getAll(userId, 1, get().perPage, query);
      
      const paginatedData = response.data || {};
      const packagesData = paginatedData.data || [];
      const newPackages = Array.isArray(packagesData) ? packagesData : [];

      const pagination = {
        current_page: paginatedData.current_page || 1,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || get().perPage,
        total: paginatedData.total || 0,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };

      const hasMoreData = pagination.current_page < pagination.last_page;

      set({
        packages: newPackages,
        totalPackages: pagination.total,
        currentPage: pagination.current_page,
        lastPage: pagination.last_page,
        perPage: pagination.per_page,
        pagination: pagination,
        hasMore: hasMoreData,
        loading: false,
        error: null,
      });

      console.log(`✅ Search completed: ${newPackages.length} packages found`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to search packages:', error);
      
      const errorMessage = error.message || 'Failed to search packages';
      set({
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
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
        sortBy: 'package_name',
        sortOrder: 'asc',
      },
      _filterTimeout: null,
    });
  },
}));

export { usePackageStore };
export default usePackageStore;
