import { create } from 'zustand';

const useCategoryStore = create((set, get) => ({
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,

  // Actions
  setCategories: (categories) => set({ categories }),
  
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  addCategory: (category) => set((state) => ({
    categories: [...state.categories, category]
  })),
  
  updateCategory: (id, updatedCategory) => set((state) => ({
    categories: state.categories.map(cat => 
      cat.id === id ? { ...cat, ...updatedCategory } : cat
    ),
    selectedCategory: state.selectedCategory?.id === id 
      ? { ...state.selectedCategory, ...updatedCategory }
      : state.selectedCategory
  })),
  
  deleteCategory: (id) => set((state) => ({
    categories: state.categories.filter(cat => cat.id !== id),
    selectedCategory: state.selectedCategory?.id === id ? null : state.selectedCategory
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  // Computed
  getCategoryById: (id) => {
    const state = get();
    return state.categories.find(cat => cat.id === id);
  },
  
  getActiveCategories: () => {
    const state = get();
    return state.categories.filter(cat => cat.is_active);
  },
  
  getCategoryCount: () => {
    const state = get();
    return state.categories.length;
  },
  
  getActiveCategoryCount: () => {
    const state = get();
    return state.categories.filter(cat => cat.is_active).length;
  }
}));

export { useCategoryStore };
