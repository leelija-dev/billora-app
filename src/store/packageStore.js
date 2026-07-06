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

  // Fetch packages with pagination - match orders pattern
  fetchPackages: async (page = 1, userId, append = false) => {
    const { filters, perPage } = get();
    set({ loading: true });
    try {
      if (!userId) {
        throw new Error('User ID is required to fetch packages');
      }

      console.log(`📡 Fetching packages page ${page} for user ${userId}`);
      const response = await packagesAPI.getAll(userId, page, perPage, filters.search);
      console.log('📦 Packages API response:', response);

      const responseData = response.data || response;
      
      // Parse the paginated response - handle the nested structure like orders
      let packagesData = [];
      let paginationInfo = {
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 8,
        nextPageUrl: null,
      };

      // The API returns: { data: { status: true, data: { current_page, data: [...], last_page, ... } } }
      // OR directly: { data: { current_page, data: [...], last_page, ... } }
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        // Nested structure: response.data.data.data
        packagesData = responseData.data.data;
        paginationInfo = {
          currentPage: responseData.data.current_page || 1,
          lastPage: responseData.data.last_page || 1,
          total: responseData.data.total || 0,
          perPage: responseData.data.per_page || 8,
          nextPageUrl: responseData.data.next_page_url || null,
        };
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        // response.data.data is the array
        packagesData = responseData.data;
        // Check if there's pagination info at the root level
        paginationInfo = {
          currentPage: responseData.current_page || 1,
          lastPage: responseData.last_page || 1,
          total: responseData.total || packagesData.length,
          perPage: responseData.per_page || 8,
          nextPageUrl: responseData.next_post_url || null,
        };
      } else if (Array.isArray(responseData)) {
        packagesData = responseData;
      }

      console.log(`✅ Fetched ${packagesData.length} packages, page ${paginationInfo.currentPage}/${paginationInfo.lastPage}`);
      console.log(`📊 Total packages: ${paginationInfo.total}, Has more: ${paginationInfo.currentPage < paginationInfo.lastPage}`);

      const hasMore = paginationInfo.currentPage < paginationInfo.lastPage;

      // Update state
      set((state) => ({
        packages: append ? [...state.packages, ...packagesData] : packagesData,
        currentPage: paginationInfo.currentPage,
        lastPage: paginationInfo.lastPage,
        totalPackages: paginationInfo.total,
        hasMore: hasMore,
        pagination: {
          current_page: paginationInfo.currentPage,
          last_page: paginationInfo.lastPage,
          per_page: paginationInfo.perPage || 8,
          total: paginationInfo.total,
          next_page_url: paginationInfo.nextPageUrl || null,
          prev_page_url: null,
          first_page_url: null,
          last_page_url: null,
          path: null,
          from: null,
          to: null,
        },
        loading: false,
        loadingMore: false,
      }));

      return { success: true, data: packagesData, pagination: paginationInfo };
    } catch (error) {
      console.error('❌ Failed to fetch packages:', error);
      set({ 
        loading: false, 
        loadingMore: false,
        hasMore: false,
        error: error.message || 'Failed to fetch packages',
      });
      return { success: false };
    }
  },

  // Load more packages for pagination - match orders pattern
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
    console.log(`� Fetching next page: ${nextPage}`);

    try {
      const response = await packagesAPI.getAll(userId, nextPage, perPage, filters.search);
      
      const responseData = response.data || response;
      let packagesData = [];
      let paginationInfo = {
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 8,
        nextPageUrl: null,
      };

      // Parse the paginated response - handle the nested structure like orders
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        packagesData = responseData.data.data;
        paginationInfo = {
          currentPage: responseData.data.current_page || 1,
          lastPage: responseData.data.last_page || 1,
          total: responseData.data.total || 0,
          perPage: responseData.data.per_page || 8,
          nextPageUrl: responseData.data.next_page_url || null,
        };
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        packagesData = responseData.data;
        paginationInfo = {
          currentPage: responseData.current_page || 1,
          lastPage: responseData.last_page || 1,
          total: responseData.total || packagesData.length,
          perPage: responseData.per_page || 8,
          nextPageUrl: responseData.next_page_url || null,
        };
      } else if (Array.isArray(responseData)) {
        packagesData = responseData;
      }

      console.log(`✅ Loaded ${packagesData.length} more packages, page ${paginationInfo.currentPage}/${paginationInfo.lastPage}`);
      console.log(`📊 Total packages: ${paginationInfo.total}, Has more: ${paginationInfo.currentPage < paginationInfo.lastPage}`);

      const hasMore = paginationInfo.currentPage < paginationInfo.lastPage;

      set((state) => {
        // Create a Set of existing package IDs to avoid duplicates
        const existingIds = new Set(state.packages.map(p => p.id));
        const newPackages = packagesData.filter(p => !existingIds.has(p.id));
        
        return {
          packages: [...state.packages, ...newPackages],
          currentPage: paginationInfo.currentPage,
          lastPage: paginationInfo.lastPage,
          totalPackages: paginationInfo.total,
          hasMore: hasMore,
          pagination: {
            current_page: paginationInfo.currentPage,
            last_page: paginationInfo.lastPage,
            per_page: paginationInfo.perPage || 8,
            total: paginationInfo.total,
            next_page_url: paginationInfo.nextPageUrl || null,
            prev_page_url: null,
            first_page_url: null,
            last_page_url: null,
            path: null,
            from: null,
            to: null,
          },
          loadingMore: false,
        };
      });

      return { success: true, data: packagesData };
    } catch (error) {
      console.error('❌ Failed to load more packages:', error);
      set({ loadingMore: false, error: error.message || 'Failed to load more packages' });
      return { success: false };
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
      await get().fetchPackages(1, userId, false);

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
        await get().fetchPackages(get().currentPage, user.id, false);
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
        await get().fetchPackages(get().currentPage, user.id, false);
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
        get().fetchPackages(1, user.id, false);
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
