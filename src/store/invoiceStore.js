// store/invoiceStore.js - COMPLETE FIXED VERSION (matching order store pattern)
import { create } from 'zustand';
import { invoiceAPI } from '../api';
import Toast from 'react-native-toast-message';

export const useInvoiceStore = create((set, get) => ({
  // State
  invoices: [],
  totalInvoices: 0,
  currentPage: 1,
  lastPage: 1,
  pageSize: 8,
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  filters: {
    search: '',
    status: '',
    start_date: '',
    end_date: '',
    store: '',
    due_amount: '',
  },
  billGenerateData: {},

  // Helper to extract store data from API response
  extractStoreDataFromResponse: (response, storeId) => {
    try {
      const data = response?.data || response;
      
      // If data is the store object directly
      if (data && typeof data === 'object' && data.id && data.name) {
        return data;
      }
      
      // If data.data is the store object
      if (data?.data && typeof data.data === 'object' && data.data.id && data.data.name) {
        return data.data;
      }
      
      // If data has status and data property (API response format)
      if (data?.status === true && data?.data) {
        if (data.data.id) {
          return data.data;
        }
      }
      
      // Check if data.data.data exists (nested response)
      if (data?.data?.data && typeof data.data.data === 'object' && data.data.data.id) {
        return data.data.data;
      }
      
      // If data is an array, find the store
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

  // Helper to extract customer data from API response
  extractCustomerDataFromResponse: (response, customerId) => {
    try {
      const data = response?.data || response;
      
      // Check if data is the customer directly
      if (data && typeof data === 'object' && data.id) {
        return data;
      }
      
      // Check if data.data is the customer
      if (data?.data && typeof data.data === 'object' && data.data.id) {
        return data.data;
      }
      
      // Check if data.data.data is the customer
      if (data?.data?.data && typeof data.data.data === 'object' && data.data.data.id) {
        return data.data.data;
      }
      
      // Check API response format
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

  // Fetch invoices/bills history with pagination and search - MATCHING ORDER STORE PATTERN
  fetchInvoices: async (page = 1, filters = {}, append = false) => {
    // If not appending, set loading; if appending, use loadingMore
    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      console.log(`📡 Fetching invoices page ${page}`);
      const response = await invoiceAPI.getAll(page, filters);
      console.log('📦 Invoices API response:', response);

      const responseData = response.data || response;
      
      // Parse the paginated response - handle the nested structure (same as order store)
      let invoicesData = [];
      let paginationInfo = {
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 8,
        nextPageUrl: null,
      };

      // The API returns: { status: true, data: { current_page, data: [...], last_page, ... } }
      // OR directly: { data: { current_page, data: [...], last_page, ... } }
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        // Nested structure: response.data.data.data
        invoicesData = responseData.data.data;
        paginationInfo = {
          currentPage: responseData.data.current_page || 1,
          lastPage: responseData.data.last_page || 1,
          total: responseData.data.total || 0,
          perPage: responseData.data.per_page || 8,
          nextPageUrl: responseData.data.next_page_url || null,
        };
        console.log('📦 Extracted from responseData.data.data');
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        // response.data.data is the array
        invoicesData = responseData.data;
        paginationInfo = {
          currentPage: responseData.current_page || 1,
          lastPage: responseData.last_page || 1,
          total: responseData.total || invoicesData.length,
          perPage: responseData.per_page || 8,
          nextPageUrl: responseData.next_page_url || null,
        };
        console.log('📦 Extracted from responseData.data');
      } else if (responseData?.data && responseData?.data?.data && Array.isArray(responseData.data.data)) {
        // Another nested structure
        invoicesData = responseData.data.data;
        paginationInfo = {
          currentPage: responseData.data.current_page || 1,
          lastPage: responseData.data.last_page || 1,
          total: responseData.data.total || 0,
          perPage: responseData.data.per_page || 8,
          nextPageUrl: responseData.data.next_page_url || null,
        };
        console.log('📦 Extracted from responseData.data.data (alternate)');
      } else if (Array.isArray(responseData)) {
        invoicesData = responseData;
        console.log('📦 Extracted from responseData (array)');
      }

      console.log(`✅ Fetched ${invoicesData.length} invoices, page ${paginationInfo.currentPage}/${paginationInfo.lastPage}`);
      console.log(`📊 Total invoices: ${paginationInfo.total}, Has more: ${paginationInfo.currentPage < paginationInfo.lastPage}`);

      // Batch fetch unique customers and stores
      const uniqueCustomerIds = [
        ...new Set(invoicesData.map((inv) => inv.customer_id).filter(Boolean)),
      ];
      const uniqueStoreIds = [
        ...new Set(invoicesData.map((inv) => inv.store_id).filter(Boolean)),
      ];

      console.log('🔄 Fetching data for customers:', uniqueCustomerIds);
      console.log('🔄 Fetching data for stores:', uniqueStoreIds);

      // Use Promise.allSettled to prevent one failure from blocking others
      const [customersResult, storesResult] = await Promise.allSettled([
        Promise.all(
          uniqueCustomerIds.map(async (customerId) => {
            try {
              const response = await invoiceAPI.getCustomer(customerId);
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
              const response = await invoiceAPI.getStore(storeId);
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

      // Create lookup maps from successful results
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

      // Enrich invoices with customer and store data
      const enrichedInvoices = invoicesData.map((invoice) => {
        const customer = customerMap[invoice.customer_id] || {};
        const store = storeMap[invoice.store_id] || {
          id: invoice.store_id,
          name: `Store Deleted`,
          is_fallback: true
        };

        return {
          ...invoice,
          customer: customer,
          store: store,
          customer_name: customer.name || customer.customer_name || `Customer #${invoice.customer_id}`,
          store_name: store.name || store.store_name || `Store Deleted`,
        };
      });

      const hasMore = paginationInfo.currentPage < paginationInfo.lastPage;

      // Update state - matching order store pattern
      set((state) => ({
        invoices: append ? [...state.invoices, ...enrichedInvoices] : enrichedInvoices,
        currentPage: paginationInfo.currentPage,
        lastPage: paginationInfo.lastPage,
        totalInvoices: paginationInfo.total,
        hasMore: hasMore,
        pageSize: paginationInfo.perPage || 8,
        loading: false,
        loadingMore: false,
        error: null,
      }));

      console.log(`✅ Invoices loaded: ${enrichedInvoices.length} invoices, page ${paginationInfo.currentPage}/${paginationInfo.lastPage}, hasMore: ${hasMore}`);
      return { success: true, data: enrichedInvoices, pagination: paginationInfo };
    } catch (error) {
      console.error('❌ Failed to fetch invoices:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch invoices',
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

  // Load more invoices - matching order store pattern
  loadMoreInvoices: async () => {
    const { hasMore, loadingMore, loading, currentPage, lastPage, filters } = get();
    
    console.log(`🔄 Load more: hasMore=${hasMore}, loadingMore=${loadingMore}, loading=${loading}, currentPage=${currentPage}, lastPage=${lastPage}`);
    
    // Prevent loading if already loading, no more invoices, or reached last page
    if (loadingMore || loading || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    set({ loadingMore: true });
    const nextPage = currentPage + 1;
    console.log(`📡 Fetching next page: ${nextPage}`);

    try {
      const response = await invoiceAPI.getAll(nextPage, filters);
      
      const responseData = response.data || response;
      let invoicesData = [];
      let paginationInfo = {
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 8,
        nextPageUrl: null,
      };

      // Parse the paginated response - handle the nested structure
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        invoicesData = responseData.data.data;
        paginationInfo = {
          currentPage: responseData.data.current_page || 1,
          lastPage: responseData.data.last_page || 1,
          total: responseData.data.total || 0,
          perPage: responseData.data.per_page || 8,
          nextPageUrl: responseData.data.next_page_url || null,
        };
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        invoicesData = responseData.data;
        paginationInfo = {
          currentPage: responseData.current_page || 1,
          lastPage: responseData.last_page || 1,
          total: responseData.total || invoicesData.length,
          perPage: responseData.per_page || 8,
          nextPageUrl: responseData.next_page_url || null,
        };
      } else if (Array.isArray(responseData)) {
        invoicesData = responseData;
      }

      console.log(`✅ Loaded ${invoicesData.length} more invoices, page ${paginationInfo.currentPage}/${paginationInfo.lastPage}`);
      console.log(`📊 Total invoices: ${paginationInfo.total}, Has more: ${paginationInfo.currentPage < paginationInfo.lastPage}`);

      const hasMore = paginationInfo.currentPage < paginationInfo.lastPage;

      set((state) => {
        // Create a Set of existing invoice IDs to avoid duplicates
        const existingIds = new Set(state.invoices.map(inv => inv.id));
        const newInvoices = invoicesData.filter(inv => !existingIds.has(inv.id));
        
        return {
          invoices: [...state.invoices, ...newInvoices],
          currentPage: paginationInfo.currentPage,
          lastPage: paginationInfo.lastPage,
          totalInvoices: paginationInfo.total,
          hasMore: hasMore,
          pageSize: paginationInfo.per_page || 8,
          loadingMore: false,
        };
      });

      return { success: true, data: invoicesData };
    } catch (error) {
      console.error('❌ Failed to load more invoices:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to load more invoices',
      });
      set({ loadingMore: false });
      return { success: false };
    }
  },

  // Get bill generate page data
  fetchBillGenerateData: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await invoiceAPI.getBillGenerateData(userId);
      const data = response.data?.data || {};

      set({
        billGenerateData: data,
        loading: false,
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch bill generate data:', error);
      set({
        error: error.message || 'Failed to fetch bill generate data',
        loading: false,
      });
      return {};
    }
  },

  // Create/store new invoice/bill with items
  createInvoice: async (invoiceData) => {
    set({ loading: true, error: null });
    try {
      const response = await invoiceAPI.create(invoiceData);
      console.log('Invoice store API response:', response);

      const responseData = response.data;
      if (responseData?.status === true) {
        set({ loading: false });
        // Refresh invoices after creation - reset to page 1
        await get().fetchInvoices(1, get().filters, false);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Invoice created successfully',
        });
        return { success: true, data: responseData };
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: responseData?.message || 'Failed to create invoice',
        });
        set({ loading: false });
        return { success: false, error: responseData };
      }
    } catch (error) {
      console.error('Invoice store error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create invoice',
      });
      set({ loading: false });
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update invoice/bill
  updateInvoice: async (id, invoiceData) => {
    set({ loading: true, error: null });
    try {
      const response = await invoiceAPI.update(id, invoiceData);
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, ...response.data } : inv,
        ),
        loading: false,
      }));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Invoice updated successfully',
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to update invoice:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update invoice',
      });
      set({ loading: false });
      return { success: false, error: error.response?.data };
    }
  },

  // Cancel invoice (bill status)
  cancelInvoice: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await invoiceAPI.updateBillStatus(id);
      const ok = response.data?.status === true;
      if (ok) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data?.message || 'Invoice cancelled',
        });
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === Number(id) || inv.id === id
              ? { ...inv, status: 'cancelled' }
              : inv,
          ),
          loading: false,
        }));
        return { success: true, data: response.data };
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: response.data?.message || 'Failed to cancel invoice',
      });
      set({ loading: false });
      return { success: false, error: response.data };
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to cancel invoice',
      });
      set({ loading: false });
      return { success: false, error: error.response?.data };
    }
  },

  // Delete invoice/bill
  deleteInvoice: async (id) => {
    set({ loading: true, error: null });
    try {
      await invoiceAPI.delete(id);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        totalInvoices: state.totalInvoices - 1,
        loading: false,
      }));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Invoice deleted successfully',
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete invoice',
      });
      set({ loading: false });
      return { success: false };
    }
  },

  // Pay invoice due
  payInvoiceDue: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const response = await invoiceAPI.invoiceDuePay(id, payload);
      if (response.data?.status === true) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.data?.message || 'Payment recorded successfully',
        });
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, paid_amount: (parseFloat(inv.paid_amount) || 0) + parseFloat(payload.paid_amount) }
              : inv,
          ),
          loading: false,
        }));
        return { success: true, data: response.data };
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data?.message || 'Payment failed',
        });
        set({ loading: false });
        return { success: false, error: response.data };
      }
    } catch (error) {
      console.error('Failed to pay invoice due:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Payment failed',
      });
      set({ loading: false });
      return { success: false, error: error.response?.data };
    }
  },

  // Get invoice by ID
  getInvoiceById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await invoiceAPI.getById(id);
      const invoice = response.data?.data || response.data;
      set({ loading: false });
      return invoice;
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      set({ loading: false, error: error.message });
      return null;
    }
  },

  // Set filters - matching order store pattern
  setFilters: (filters, userId) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
    // Reset to page 1 and fetch
    get().fetchInvoices(1, get().filters, false);
  },

  // Reset filters
  resetFilters: () => {
    set({
      filters: {
        search: '',
        status: '',
        start_date: '',
        end_date: '',
        store: '',
        due_amount: '',
      },
      currentPage: 1,
      hasMore: true,
    });
    get().fetchInvoices(1, {}, false);
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store - matching order store pattern
  reset: () => {
    set({
      invoices: [],
      totalInvoices: 0,
      currentPage: 1,
      lastPage: 1,
      pageSize: 8,
      loading: false,
      loadingMore: false,
      hasMore: true,
      error: null,
      filters: {
        search: '',
        status: '',
        start_date: '',
        end_date: '',
        store: '',
        due_amount: '',
      },
      billGenerateData: {},
    });
  },
}));

export default useInvoiceStore;