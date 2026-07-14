// store/gstStore.js - GST store with state management (NO CACHE)
import { create } from 'zustand';
import { gstAPI } from '../api/gst';
import Toast from 'react-native-toast-message';

export const useGstStore = create((set, get) => ({
  collections: [],
  gstInData: [],
  gstOutData: [],
  allProducts: [],
  pagination: null,
  gstInPagination: null,
  gstOutPagination: null,
  allProductsPagination: null,
  loading: false,
  loadingMore: false,
  hasMore: true,
  currentPage: 1,
  lastPage: 1,
  updatingStatus: false,
  filters: {
    month: '',
    year: '',
  },
  summary: {
    gstOut: 0,
    gstIn: 0,
    dateFrom: '',
    dateTo: '',
  },

  fetchGstCollections: async (userId, params = {}, isLoadMore = false) => {
    if (!isLoadMore) {
      set({ loading: true });
    }

    try {
      console.log('📊 Fetching GST collections with params:', params);
      
      const response = await gstAPI.getGstCollection(userId, params);
      const data = response.data;

      if (!data.status) {
        throw new Error(data.message || 'Failed to fetch GST collections');
      }

      // Handle search=all response (returns array directly instead of paginated object)
      const isSearchAll = params.search === 'all';
      
      // Extract GST In data with unique IDs - handle both array and paginated structure
      const gstInRawData = isSearchAll ? data.gst_in_data : data.gst_in_data?.data;
      const newGstInData = Array.isArray(gstInRawData) ? gstInRawData.map((item, index) => ({
        ...item,
        _uniqueId: `gst_in_${item.id}_${Date.now()}_${index}`,
        _originalId: item.id,
        _type: 'gst_in',
      })) : [];

      // Extract GST Out data with unique IDs - handle both array and paginated structure
      const gstOutRawData = isSearchAll ? data.gst_out_data : data.gst_out_data?.data;
      const newGstOutData = Array.isArray(gstOutRawData) ? gstOutRawData.map((item, index) => ({
        ...item,
        _uniqueId: `gst_out_${item.id}_${Date.now()}_${index}`,
        _originalId: item.id,
        _type: 'gst_out',
      })) : [];

      // Extract all products data - handle both array and paginated structure
      const allProductsRawData = isSearchAll ? data.all_products : data.all_products?.data;
      const newAllProductsData = Array.isArray(allProductsRawData) ? allProductsRawData.map((item, index) => ({
        ...item,
        _uniqueId: `prod_${item.product_id}_${Date.now()}_${index}`,
        _originalId: item.product_id,
      })) : [];

      // If loading more, append to existing data; otherwise replace
      const { gstInData: existingGstInData, gstOutData: existingGstOutData, allProducts: existingAllProducts } = get();
      
      const gstInData = isLoadMore ? [...existingGstInData, ...newGstInData] : newGstInData;
      const gstOutData = isLoadMore ? [...existingGstOutData, ...newGstOutData] : newGstOutData;
      const allProductsData = isLoadMore ? [...existingAllProducts, ...newAllProductsData] : newAllProductsData;

      // Combine all collections for backward compatibility
      const allCollections = [...gstInData, ...gstOutData];

      // Pagination for GST In (null when search=all)
      const gstInPagination = isSearchAll ? null : (data.gst_in_data ? {
        current_page: data.gst_in_data.current_page,
        first_page_url: data.gst_in_data.first_page_url,
        from: data.gst_in_data.from,
        last_page: data.gst_in_data.last_page,
        last_page_url: data.gst_in_data.last_page_url,
        links: data.gst_in_data.links,
        next_page_url: data.gst_in_data.next_page_url,
        path: data.gst_in_data.path,
        per_page: data.gst_in_data.per_page,
        prev_page_url: data.gst_in_data.prev_page_url,
        to: data.gst_in_data.to,
        total: data.gst_in_data.total,
      } : null);

      // Pagination for GST Out (null when search=all)
      const gstOutPagination = isSearchAll ? null : (data.gst_out_data ? {
        current_page: data.gst_out_data.current_page,
        first_page_url: data.gst_out_data.first_page_url,
        from: data.gst_out_data.from,
        last_page: data.gst_out_data.last_page,
        last_page_url: data.gst_out_data.last_page_url,
        links: data.gst_out_data.links,
        next_page_url: data.gst_out_data.next_page_url,
        path: data.gst_out_data.path,
        per_page: data.gst_out_data.per_page,
        prev_page_url: data.gst_out_data.prev_page_url,
        to: data.gst_out_data.to,
        total: data.gst_out_data.total,
      } : null);

      const allProductsPagination = isSearchAll ? null : (data.all_products ? {
        current_page: data.all_products.current_page,
        first_page_url: data.all_products.first_page_url,
        from: data.all_products.from,
        last_page: data.all_products.last_page,
        last_page_url: data.all_products.last_page_url,
        links: data.allProducts.links,
        next_page_url: data.allProducts.next_page_url,
        path: data.allProducts.path,
        per_page: data.allProducts.per_page,
        prev_page_url: data.allProducts.prev_page_url,
        to: data.allProducts.to,
        total: data.allProducts.total,
      } : null);

      const result = {
        collections: allCollections,
        gstInData: gstInData,
        gstOutData: gstOutData,
        allProducts: allProductsData,
        pagination: gstInPagination,
        gstInPagination: gstInPagination,
        gstOutPagination: gstOutPagination,
        allProductsPagination: allProductsPagination,
        summary: {
          gstOut: parseFloat(data.gst_out) || 0,
          gstIn: parseFloat(data.gst_in) || 0,
          dateFrom: data.date_from || '',
          dateTo: data.date_to || '',
        },
      };

      // Update pagination state
      if (gstInPagination && !isSearchAll) {
        set({
          currentPage: gstInPagination.current_page,
          lastPage: gstInPagination.last_page,
          hasMore: gstInPagination.current_page < gstInPagination.last_page,
        });
      }

      set({
        ...result,
        loading: false,
        loadingMore: false,
      });

      return result;
    } catch (error) {
      console.error('Failed to fetch GST collections:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch GST collections',
      });
      set({ loading: false, loadingMore: false });
      throw error;
    }
  },

  loadMoreGstCollections: async (userId) => {
    const { currentPage, lastPage, filters } = get();
    
    if (currentPage >= lastPage) {
      console.log('No more pages to load');
      return;
    }

    set({ loadingMore: true });

    try {
      const nextPage = currentPage + 1;
      const params = { ...filters, page: nextPage };
      
      await get().fetchGstCollections(userId, params, true);
    } catch (error) {
      console.error('Failed to load more GST collections:', error);
      set({ loadingMore: false });
    }
  },

  updatePaymentStatus: async (collectionId, statusData) => {
    set({ updatingStatus: true });

    try {
      const response = await gstAPI.updateGstPaymentStatus(collectionId, statusData);
      const data = response.data;

      if (data.status) {
        const { gstInData, gstOutData } = get();
        
        // Update in both GST In and GST Out data
        const updatedGstIn = gstInData.map(item =>
          item._originalId === collectionId || item.id === collectionId
            ? { ...item, govt_pay_status: statusData.govt_gst_pay_status }
            : item
        );
        
        const updatedGstOut = gstOutData.map(item =>
          item._originalId === collectionId || item.id === collectionId
            ? { ...item, govt_pay_status: statusData.govt_gst_pay_status }
            : item
        );

        set({
          gstInData: updatedGstIn,
          gstOutData: updatedGstOut,
          updatingStatus: false,
        });

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Payment status updated successfully',
        });
        return data;
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update GST payment status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update payment status',
      });
      set({ updatingStatus: false });
      throw error;
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        month: '',
        year: '',
      },
    });
  },

  resetStore: () => {
    set({
      collections: [],
      gstInData: [],
      gstOutData: [],
      allProducts: [],
      pagination: null,
      gstInPagination: null,
      gstOutPagination: null,
      allProductsPagination: null,
      loading: false,
      loadingMore: false,
      hasMore: true,
      currentPage: 1,
      lastPage: 1,
      updatingStatus: false,
      filters: {
        month: '',
        year: '',
      },
      summary: {
        gstOut: 0,
        gstIn: 0,
        dateFrom: '',
        dateTo: '',
      },
    });
  },
}));

export default useGstStore;