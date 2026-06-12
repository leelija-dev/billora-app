import { create } from 'zustand';
import { medicineTypeAPI } from '../api/medicineType';

const useMedicineTypeStore = create((set, get) => ({
  medicineTypes: [],
  totalMedicineTypes: 0,
  loading: false,
  error: null,
  filters: {
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
  },

  // Fetch medicine types for a user
  fetchMedicineTypes: async (userId) => {
    console.log('🔄 fetchMedicineTypes called with userId:', userId);
    set({ loading: true, error: null });

    try {
      const response = await medicineTypeAPI.getAll(userId);
      console.log('📦 Medicine Types API Response:', response);
      
      // Extract medicine types array from response
      let medicineTypesArray = [];
      
      // Handle different response structures
      if (response?.data?.data?.data) {
        medicineTypesArray = response.data.data.data;
      } else if (response?.data?.data) {
        if (Array.isArray(response.data.data)) {
          medicineTypesArray = response.data.data;
        } else if (typeof response.data.data === 'object' && response.data.data !== null) {
          medicineTypesArray = Object.values(response.data.data);
        }
      } else if (Array.isArray(response?.data)) {
        medicineTypesArray = response.data;
      } else if (response?.data && typeof response.data === 'object') {
        medicineTypesArray = Object.values(response.data);
      } else if (Array.isArray(response)) {
        medicineTypesArray = response;
      }
      
      console.log('📊 Processed medicine types:', medicineTypesArray.length);
      
      // Apply search filter
      const { search } = get().filters;
      let filteredTypes = [...medicineTypesArray];
      if (search) {
        const searchLower = search.toLowerCase();
        filteredTypes = filteredTypes.filter(type => 
          type.name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply sorting
      const { sortBy, sortOrder } = get().filters;
      filteredTypes.sort((a, b) => {
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
      
      set({
        medicineTypes: filteredTypes,
        totalMedicineTypes: filteredTypes.length,
        loading: false,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch medicine types:', error);
      set({
        medicineTypes: [],
        totalMedicineTypes: 0,
        loading: false,
        error: error.message || 'Failed to fetch medicine types',
      });
      throw error;
    }
  },

  // Force refresh medicine types
  forceRefreshMedicineTypes: async (userId) => {
    console.log('🔄 forceRefreshMedicineTypes called for user:', userId);
    set({ loading: true, error: null });
    
    try {
      const response = await medicineTypeAPI.getAll(userId);
      console.log('📦 Force refresh API Response:', response);
      
      // Extract medicine types array from response
      let medicineTypesArray = [];
      
      if (response?.data?.data?.data) {
        medicineTypesArray = response.data.data.data;
      } else if (response?.data?.data) {
        if (Array.isArray(response.data.data)) {
          medicineTypesArray = response.data.data;
        } else if (typeof response.data.data === 'object' && response.data.data !== null) {
          medicineTypesArray = Object.values(response.data.data);
        }
      } else if (Array.isArray(response?.data)) {
        medicineTypesArray = response.data;
      } else if (response?.data && typeof response.data === 'object') {
        medicineTypesArray = Object.values(response.data);
      } else if (Array.isArray(response)) {
        medicineTypesArray = response;
      }
      
      console.log('📊 Force refresh medicine types:', medicineTypesArray.length);
      
      // Apply search filter
      const { search } = get().filters;
      let filteredTypes = [...medicineTypesArray];
      if (search) {
        const searchLower = search.toLowerCase();
        filteredTypes = filteredTypes.filter(type => 
          type.name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply sorting
      const { sortBy, sortOrder } = get().filters;
      filteredTypes.sort((a, b) => {
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
      
      set({
        medicineTypes: filteredTypes,
        totalMedicineTypes: filteredTypes.length,
        loading: false,
      });
      
      return response;
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      set({
        error: error.message || 'Failed to fetch medicine types',
        loading: false,
      });
      throw error;
    }
  },

  // Get single medicine type
  getMedicineType: async (id) => {
    console.log('🔍 getMedicineType called with:', id);
    set({ loading: true, error: null });
    
    try {
      const response = await medicineTypeAPI.getById(id);
      console.log('✅ Medicine type fetched successfully:', response);
      
      let medicineType = null;
      if (response?.data?.data) {
        medicineType = response.data.data;
      } else if (response?.data) {
        medicineType = response.data;
      } else {
        medicineType = response;
      }
      
      set({ loading: false });
      return medicineType;
    } catch (error) {
      console.error('❌ Failed to fetch medicine type:', error);
      set({
        error: error.message || 'Failed to fetch medicine type',
        loading: false,
      });
      throw error;
    }
  },

  // Create medicine type
  createMedicineType: async (medicineTypeData) => {
    console.log('📝 createMedicineType called with:', medicineTypeData);
    set({ loading: true, error: null });
    
    try {
      const response = await medicineTypeAPI.create(medicineTypeData);
      console.log('✅ Medicine type created successfully:', response);
      
      let newMedicineType = null;
      if (response?.data?.data) {
        newMedicineType = response.data.data;
      } else if (response?.data) {
        newMedicineType = response.data;
      } else {
        newMedicineType = response;
      }
      
      // Update local state immediately for better UX
      const { medicineTypes } = get();
      set({
        medicineTypes: [newMedicineType, ...medicineTypes],
        totalMedicineTypes: medicineTypes.length + 1,
        loading: false,
      });
      
      return newMedicineType;
    } catch (error) {
      console.error('❌ Failed to create medicine type:', error);
      set({
        error: error.message || 'Failed to create medicine type',
        loading: false,
      });
      throw error;
    }
  },

  // Update medicine type
  updateMedicineType: async (id, medicineTypeData) => {
    console.log('✏️ updateMedicineType called with:', id, medicineTypeData);
    set({ loading: true, error: null });
    
    try {
      const response = await medicineTypeAPI.update(id, medicineTypeData);
      console.log('✅ Medicine type updated successfully:', response);
      
      let updatedMedicineType = null;
      if (response?.data?.data) {
        updatedMedicineType = response.data.data;
      } else if (response?.data) {
        updatedMedicineType = response.data;
      } else {
        updatedMedicineType = response;
      }
      
      // Update local state immediately for better UX
      const { medicineTypes } = get();
      set({
        medicineTypes: medicineTypes.map(type => 
          type.id === id ? updatedMedicineType : type
        ),
        loading: false,
      });
      
      return updatedMedicineType;
    } catch (error) {
      console.error('❌ Failed to update medicine type:', error);
      set({
        error: error.message || 'Failed to update medicine type',
        loading: false,
      });
      throw error;
    }
  },

  // Delete medicine type
  deleteMedicineType: async (id) => {
    console.log('🗑️ deleteMedicineType called with:', id);
    set({ loading: true, error: null });
    
    try {
      await medicineTypeAPI.delete(id);
      console.log('✅ Medicine type deleted successfully');
      
      // Update local state immediately for better UX
      const { medicineTypes } = get();
      set({
        medicineTypes: medicineTypes.filter(type => type.id !== id),
        totalMedicineTypes: medicineTypes.length - 1,
        loading: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete medicine type:', error);
      set({
        error: error.message || 'Failed to delete medicine type',
        loading: false,
      });
      throw error;
    }
  },

  // Search medicine types
  searchMedicineTypes: async (userId, query) => {
    console.log('🔍 searchMedicineTypes called with:', query);
    set({ loading: true, error: null });
    
    try {
      const response = await medicineTypeAPI.getAll(userId);
      
      let medicineTypesArray = [];
      if (response?.data?.data?.data) {
        medicineTypesArray = response.data.data.data;
      } else if (response?.data?.data) {
        if (Array.isArray(response.data.data)) {
          medicineTypesArray = response.data.data;
        } else if (typeof response.data.data === 'object' && response.data.data !== null) {
          medicineTypesArray = Object.values(response.data.data);
        }
      } else if (Array.isArray(response?.data)) {
        medicineTypesArray = response.data;
      } else if (response?.data && typeof response.data === 'object') {
        medicineTypesArray = Object.values(response.data);
      } else if (Array.isArray(response)) {
        medicineTypesArray = response;
      }
      
      // Filter by search query
      const searchLower = query.toLowerCase();
      const filteredTypes = medicineTypesArray.filter(type => 
        type.name?.toLowerCase().includes(searchLower)
      );
      
      // Apply sorting
      const { sortBy, sortOrder } = get().filters;
      filteredTypes.sort((a, b) => {
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
      
      set({
        medicineTypes: filteredTypes,
        totalMedicineTypes: filteredTypes.length,
        loading: false,
      });
      
      return filteredTypes;
    } catch (error) {
      console.error('❌ Failed to search medicine types:', error);
      set({
        error: error.message || 'Failed to search medicine types',
        loading: false,
      });
      throw error;
    }
  },

  // Set filters
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });
    
    // Refetch with new filters
    setTimeout(() => {
      const { useAuthStore } = require('../store/authStore');
      const user = useAuthStore.getState().user;
      if (user?.id) {
        get().fetchMedicineTypes(user.id);
      }
    }, 100);
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useMedicineTypeStore;