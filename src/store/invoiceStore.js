// store/invoiceStore.js - COMPLETE FIXED VERSION
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

  // Fetch invoices/bills history with pagination and search
  fetchInvoices: async (page = 1, filters = {}, append = false) => {
    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      console.log(`📡 Fetching invoices page ${page}`);
      const response = await invoiceAPI.getAll(page, filters);
      console.log('📦 Invoices API response:', response);

      // Now response.data has the full structure: { status, data: { current_page, data: [...] } }
      const responseData = response.data;
      
      // Extract paginated data from response.data.data
      const paginatedData = responseData?.data || {};
      let invoicesData = paginatedData?.data || [];

      console.log(`📦 Extracted ${invoicesData.length} invoices from page ${page}`);

      // Batch fetch unique customers and stores
      const uniqueCustomerIds = [
        ...new Set(invoicesData.map((inv) => inv.customer_id).filter(Boolean)),
      ];
      const uniqueStoreIds = [
        ...new Set(invoicesData.map((inv) => inv.store_id).filter(Boolean)),
      ];

      console.log('🔄 Fetching data for customers:', uniqueCustomerIds);
      console.log('🔄 Fetching data for stores:', uniqueStoreIds);

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

      const currentPage = paginatedData.current_page || 1;
      const lastPage = paginatedData.last_page || 1;
      const total = paginatedData.total || 0;
      const perPage = paginatedData.per_page || 8;
      const hasMore = currentPage < lastPage;

      set((state) => ({
        invoices: append ? [...state.invoices, ...enrichedInvoices] : enrichedInvoices,
        currentPage: currentPage,
        lastPage: lastPage,
        totalInvoices: total,
        hasMore: hasMore,
        pageSize: perPage,
        loading: false,
        loadingMore: false,
        error: null,
      }));

      console.log(`✅ Invoices loaded: ${enrichedInvoices.length} invoices, page ${currentPage}/${lastPage}, hasMore: ${hasMore}`);
      return { success: true, data: enrichedInvoices };
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

  // Load more invoices
  loadMoreInvoices: async () => {
    const { hasMore, loadingMore, loading, currentPage, lastPage, filters } = get();
    
    console.log(`🔄 Load more: hasMore=${hasMore}, loadingMore=${loadingMore}, loading=${loading}, currentPage=${currentPage}, lastPage=${lastPage}`);
    
    if (loadingMore || loading || !hasMore || currentPage >= lastPage) {
      console.log('⏭️ Skipping load more - conditions not met');
      return;
    }

    set({ loadingMore: true });
    const nextPage = currentPage + 1;
    console.log(`📡 Fetching next page: ${nextPage}`);

    try {
      const response = await invoiceAPI.getAll(nextPage, filters);
      const responseData = response.data;
      const paginatedData = responseData?.data || {};
      let invoicesData = paginatedData?.data || [];

      console.log(`✅ Loaded ${invoicesData.length} more invoices, page ${nextPage}`);

      const currentPage = paginatedData.current_page || 1;
      const lastPage = paginatedData.last_page || 1;
      const total = paginatedData.total || 0;
      const perPage = paginatedData.per_page || 8;
      const hasMore = currentPage < lastPage;

      set((state) => {
        const existingIds = new Set(state.invoices.map(inv => inv.id));
        const newInvoices = invoicesData.filter(inv => !existingIds.has(inv.id));
        
        return {
          invoices: [...state.invoices, ...newInvoices],
          currentPage: currentPage,
          lastPage: lastPage,
          totalInvoices: total,
          hasMore: hasMore,
          pageSize: perPage,
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

  // ✅ FIXED: Pay invoice due - handles full response with status
  payInvoiceDue: async (id, payload) => {
    console.log('💳 payInvoiceDue called with:', { id, payload });
    set({ loading: true, error: null });
    
    try {
      const response = await invoiceAPI.invoiceDuePay(id, payload);
      console.log('💳 Payment response:', response.data);
      
      // Now response.data has the full structure: { status, message, data }
      const responseData = response.data;
      
      // Check if the response has status true
      if (responseData?.status === true) {
        const message = responseData?.message || 'Payment recorded successfully';
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: message,
        });
        
        // Update the invoice in the store with new payment info
        const paidAmount = parseFloat(payload.paid_amount || 0);
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { 
                  ...inv, 
                  paid_amount: String((parseFloat(inv.paid_amount || 0) + paidAmount))
                }
              : inv,
          ),
          loading: false,
        }));
        
        return { 
          success: true, 
          data: responseData,
          message: message
        };
      } else {
        const errorMsg = responseData?.message || 'Payment failed';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMsg,
        });
        set({ loading: false });
        return { 
          success: false, 
          error: errorMsg 
        };
      }
    } catch (error) {
      console.error('❌ Failed to pay invoice due:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Payment failed';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
      set({ loading: false });
      return { 
        success: false, 
        error: errorMessage 
      };
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

  // Set filters
  setFilters: (filters, userId) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
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

  // Reset store
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