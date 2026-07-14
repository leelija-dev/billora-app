// store/reportsStore.js - Reports store with infinite scrolling
import { create } from 'zustand';
import { reportsAPI } from '../api';
import Toast from 'react-native-toast-message';

export const useReportsStore = create((set, get) => ({
  // State
  reports: [],
  totalReports: 0,
  currentPage: 1,
  lastPage: 1,
  pageSize: 10,
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  filters: {
    search: '',
    start_date: '',
    end_date: '',
  },
  
  // Summary statistics from API
  summaryStats: {
    totalSalesItems: "0",
    totalSalesAmount: "0",
    totalDue: "0",
    totalProfit: "0",
    customerDues: [],
    productWiseSales: [],
  },

  // Helper to extract customer data from API response
  extractCustomerDataFromResponse: (response, customerId) => {
    try {
      const data = response?.data || response;
      
      if (data && typeof data === 'object' && data.id) {
        return data;
      }
      
      if (data?.data && typeof data.data === 'object' && data.data.id) {
        return data.data;
      }
      
      if (data?.data?.data && typeof data.data.data === 'object' && data.data.data.id) {
        return data.data.data;
      }
      
      if (data?.status === true && data?.data && data.data.id) {
        return data.data;
      }
      
      console.warn(`Could not extract customer data for ID ${customerId}`);
      return null;
    } catch (error) {
      console.error(`Error extracting customer data for ${customerId}:`, error);
      return null;
    }
  },

  // Helper to extract store data from API response
  extractStoreDataFromResponse: (response, storeId) => {
    try {
      const data = response?.data || response;
      
      if (data && typeof data === 'object' && data.id && data.name) {
        return data;
      }
      
      if (data?.data && typeof data.data === 'object' && data.data.id && data.data.name) {
        return data.data;
      }
      
      if (data?.status === true && data?.data) {
        if (data.data.id) {
          return data.data;
        }
      }
      
      if (data?.data?.data && typeof data.data.data === 'object' && data.data.data.id) {
        return data.data.data;
      }
      
      if (Array.isArray(data)) {
        const store = data.find(s => s.id === storeId);
        if (store) {
          return store;
        }
      }
      
      console.warn(`Could not extract store data for ID ${storeId}`);
      return null;
    } catch (error) {
      console.error(`Error extracting store data for ${storeId}:`, error);
      return null;
    }
  },

  // Fetch reports with pagination and date filtering
  fetchReports: async (page = 1, filters = {}, append = false) => {
    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      console.log(`📡 Fetching reports page ${page}`, filters);
      const response = await reportsAPI.getReports(
        filters.start_date || '',
        filters.end_date || '',
        page
      );
      console.log('📦 Reports API response:', response);

      const responseData = response?.data || response;
      
      if (responseData?.salesItem_details) {
        const paginatedData = responseData.salesItem_details;
        const reportsData = paginatedData.data || [];
        
        // Set summary statistics
        set({
          summaryStats: {
            totalSalesItems: responseData.total_sales_items?.toString() || "0",
            totalSalesAmount: responseData.total_sales_amount?.toString() || "0",
            totalDue: responseData.total_due?.toString() || "0",
            totalProfit: responseData.total_profit?.toString() || "0",
            customerDues: responseData.customer_dues || [],
            productWiseSales: responseData.product_wise_sales || [],
          },
        });

        // Batch fetch unique customers and stores
        const uniqueCustomerIds = [
          ...new Set(reportsData.map((report) => report.customer_id).filter(Boolean)),
        ];
        const uniqueStoreIds = [
          ...new Set(reportsData.map((report) => report.store_id).filter(Boolean)),
        ];

        console.log('🔄 Fetching data for customers:', uniqueCustomerIds);
        console.log('🔄 Fetching data for stores:', uniqueStoreIds);

        const [customersResult, storesResult] = await Promise.allSettled([
          Promise.all(
            uniqueCustomerIds.map(async (customerId) => {
              try {
                const response = await reportsAPI.getCustomer(customerId);
                const customerData = get().extractCustomerDataFromResponse(response, customerId);
                if (customerData) {
                  return { id: customerId, data: customerData };
                }
                return { id: customerId, data: null };
              } catch (error) {
                console.error(`Failed to fetch customer ${customerId}:`, error);
                return { id: customerId, data: null };
              }
            }),
          ),
          Promise.all(
            uniqueStoreIds.map(async (storeId) => {
              try {
                const response = await reportsAPI.getStore(storeId);
                const storeData = get().extractStoreDataFromResponse(response, storeId);
                
                if (storeData && storeData.id) {
                  console.log(`✅ Store ${storeId} fetched:`, storeData.name);
                  return { id: storeId, data: storeData };
                } else {
                  console.warn(`⚠️ Store ${storeId} not found, using fallback`);
                  const fallbackStore = {
                    id: storeId,
                    name: `Store Deleted`,
                    is_fallback: true
                  };
                  return { id: storeId, data: fallbackStore };
                }
              } catch (error) {
                console.error(`Failed to fetch store ${storeId}:`, error);
                const fallbackStore = {
                  id: storeId,
                  name: `Store Deleted`,
                  is_fallback: true
                };
                return { id: storeId, data: fallbackStore };
              }
            }),
          ),
        ]);

        const customerMap = {};
        const storeMap = {};

        if (customersResult.status === 'fulfilled') {
          customersResult.value.forEach(({ id, data }) => {
            if (data) customerMap[id] = data;
          });
        }

        if (storesResult.status === 'fulfilled') {
          storesResult.value.forEach(({ id, data }) => {
            if (data) {
              storeMap[id] = data;
            } else {
              storeMap[id] = {
                id: id,
                name: `Store Deleted`,
                is_fallback: true
              };
            }
          });
        }

        // Enrich reports with customer and store data
        const enrichedReports = reportsData.map((report) => {
          const customer = customerMap[report.customer_id] || {};
          const store = storeMap[report.store_id] || {
            id: report.store_id,
            name: `Store Deleted`,
            is_fallback: true
          };

          return {
            ...report,
            customer: customer,
            store: store,
            customer_name: customer.name || customer.customer_name || `Customer #${report.customer_id}`,
            store_name: store.name || store.store_name || `Store Deleted`,
          };
        });

        const currentPage = paginatedData.current_page || 1;
        const lastPage = paginatedData.last_page || 1;
        const total = paginatedData.total || 0;
        const perPage = paginatedData.per_page || 10;
        const hasMore = currentPage < lastPage;

        set((state) => ({
          reports: append ? [...state.reports, ...enrichedReports] : enrichedReports,
          currentPage: currentPage,
          lastPage: lastPage,
          totalReports: total,
          hasMore: hasMore,
          pageSize: perPage,
          loading: false,
          loadingMore: false,
          error: null,
        }));

        console.log(`✅ Reports loaded: ${enrichedReports.length} reports, page ${currentPage}/${lastPage}, hasMore: ${hasMore}`);
        return { success: true, data: enrichedReports };
      } else if (Array.isArray(responseData)) {
        // Fallback for non-paginated response
        const formattedReports = responseData.map((report) => ({
          ...report,
          customer_name: report.customer?.name || `Deleted`,
          store_name: report.store?.name || `Deleted`,
        }));

        set({
          reports: formattedReports,
          totalReports: formattedReports.length,
          currentPage: 1,
          lastPage: 1,
          hasMore: false,
          loading: false,
          loadingMore: false,
        });

        return { success: true, data: formattedReports };
      } else {
        set({
          reports: [],
          totalReports: 0,
          hasMore: false,
          loading: false,
          loadingMore: false,
        });

        return { success: true, data: [] };
      }
    } catch (error) {
      console.error('❌ Failed to fetch reports:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch reports',
      });
      set({ 
        loading: false, 
        loadingMore: false,
        hasMore: false,
        error: error.message 
      });
      return { success: false };
    }
  },

  // Load more reports
  loadMoreReports: async () => {
    const { hasMore, loadingMore, loading, currentPage, lastPage, filters } = get();
    
    console.log(`🔄 Load more reports: hasMore=${hasMore}, loadingMore=${loadingMore}, loading=${loading}, currentPage=${currentPage}, lastPage=${lastPage}`);
    
    if (loadingMore || loading || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    set({ loadingMore: true });
    const nextPage = currentPage + 1;
    console.log(`📡 Fetching next page: ${nextPage}`);

    try {
      const response = await reportsAPI.getReports(
        filters.start_date || '',
        filters.end_date || '',
        nextPage
      );
      
      const responseData = response?.data || response;
      
      if (responseData?.salesItem_details) {
        const paginatedData = responseData.salesItem_details;
        const reportsData = paginatedData.data || [];

        console.log(`✅ Loaded ${reportsData.length} more reports, page ${nextPage}`);

        // Batch fetch customers and stores for new reports
        const uniqueCustomerIds = [
          ...new Set(reportsData.map((report) => report.customer_id).filter(Boolean)),
        ];
        const uniqueStoreIds = [
          ...new Set(reportsData.map((report) => report.store_id).filter(Boolean)),
        ];

        const [customersResult, storesResult] = await Promise.allSettled([
          Promise.all(
            uniqueCustomerIds.map(async (customerId) => {
              try {
                const response = await reportsAPI.getCustomer(customerId);
                const customerData = get().extractCustomerDataFromResponse(response, customerId);
                if (customerData) {
                  return { id: customerId, data: customerData };
                }
                return { id: customerId, data: null };
              } catch (error) {
                return { id: customerId, data: null };
              }
            }),
          ),
          Promise.all(
            uniqueStoreIds.map(async (storeId) => {
              try {
                const response = await reportsAPI.getStore(storeId);
                const storeData = get().extractStoreDataFromResponse(response, storeId);
                if (storeData && storeData.id) {
                  return { id: storeId, data: storeData };
                }
                const fallbackStore = {
                  id: storeId,
                  name: `Store Deleted`,
                  is_fallback: true
                };
                return { id: storeId, data: fallbackStore };
              } catch (error) {
                const fallbackStore = {
                  id: storeId,
                  name: `Store Deleted`,
                  is_fallback: true
                };
                return { id: storeId, data: fallbackStore };
              }
            }),
          ),
        ]);

        const customerMap = {};
        const storeMap = {};

        if (customersResult.status === 'fulfilled') {
          customersResult.value.forEach(({ id, data }) => {
            if (data) customerMap[id] = data;
          });
        }

        if (storesResult.status === 'fulfilled') {
          storesResult.value.forEach(({ id, data }) => {
            if (data) {
              storeMap[id] = data;
            } else {
              storeMap[id] = {
                id: id,
                name: `Store Deleted`,
                is_fallback: true
              };
            }
          });
        }

        const enrichedReports = reportsData.map((report) => {
          const customer = customerMap[report.customer_id] || {};
          const store = storeMap[report.store_id] || {
            id: report.store_id,
            name: `Store Deleted`,
            is_fallback: true
          };

          return {
            ...report,
            customer: customer,
            store: store,
            customer_name: customer.name || customer.customer_name || `Customer #${report.customer_id}`,
            store_name: store.name || store.store_name || `Store Deleted`,
          };
        });

        const currentPage = paginatedData.current_page || 1;
        const lastPage = paginatedData.last_page || 1;
        const total = paginatedData.total || 0;
        const perPage = paginatedData.per_page || 10;
        const hasMore = currentPage < lastPage;

        set((state) => {
          const existingIds = new Set(state.reports.map(rep => rep.id));
          const newReports = enrichedReports.filter(rep => !existingIds.has(rep.id));
          
          return {
            reports: [...state.reports, ...newReports],
            currentPage: currentPage,
            lastPage: lastPage,
            totalReports: total,
            hasMore: hasMore,
            pageSize: perPage,
            loadingMore: false,
          };
        });

        return { success: true, data: enrichedReports };
      } else if (Array.isArray(responseData)) {
        const formattedReports = responseData.map((report) => ({
          ...report,
          customer_name: report.customer?.name || `Deleted`,
          store_name: report.store?.name || `Deleted`,
        }));

        set((state) => {
          const existingIds = new Set(state.reports.map(rep => rep.id));
          const newReports = formattedReports.filter(rep => !existingIds.has(rep.id));
          
          return {
            reports: [...state.reports, ...newReports],
            loadingMore: false,
          };
        });

        return { success: true, data: formattedReports };
      } else {
        set({ loadingMore: false });
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Failed to load more reports:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load more reports',
      });
      set({ loadingMore: false });
      return { success: false };
    }
  },

  // Get single report by ID
  getSingleReport: async (reportId) => {
    set({ loading: true, error: null });
    try {
      const response = await reportsAPI.getSingleReport(reportId);
      const report = response?.data || response;
      set({ loading: false });
      return report;
    } catch (error) {
      console.error('Failed to fetch report:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },

  // Set filters
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  // Reset filters
  resetFilters: () => {
    set({
      filters: {
        search: '',
        start_date: '',
        end_date: '',
      },
      currentPage: 1,
      hasMore: true,
    });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => {
    set({
      reports: [],
      totalReports: 0,
      currentPage: 1,
      lastPage: 1,
      pageSize: 10,
      loading: false,
      loadingMore: false,
      hasMore: true,
      error: null,
      filters: {
        search: '',
        start_date: '',
        end_date: '',
      },
      summaryStats: {
        totalSalesItems: "0",
        totalSalesAmount: "0",
        totalDue: "0",
        totalProfit: "0",
        customerDues: [],
        productWiseSales: [],
      },
    });
  },
}));

export default useReportsStore;
