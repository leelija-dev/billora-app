// store/categoryStore.js
import { create } from "zustand";
import { categoriesAPI } from "../api/categories";
import { getPaginatedData, getEntityData } from "../api/client";

const useCategoryStore = create((set, get) => ({
  categories: [],
  totalCategories: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 8,
  loading: false,
  loadingMore: false,
  hasMore: true,
  error: null,
  pagination: null,
  filters: {
    search: "",
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  },

  // ✅ Fetch categories with pagination
  fetchCategories: async (page = 1, append = false) => {
    const { filters, perPage, categories: existingCategories } = get();
    console.log('🔄 fetchCategories called:', { page, append, filters });

    if (append && page > 1) {
      set({ loadingMore: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const params = {
        page,
        per_page: perPage,
      };
      
      if (filters.search) params.search = filters.search;
      if (filters.status !== "all") {
        params.is_active = filters.status === "active" ? 1 : 0;
      }

      const response = await categoriesAPI.getAll(page, params);
      console.log("📦 API Response in store:", response);

      const paginatedData = getPaginatedData(response);
      console.log("📊 Extracted paginated data:", paginatedData);

      let categoriesArray = paginatedData.data || [];
      
      if (!Array.isArray(categoriesArray)) {
        categoriesArray = [];
      }

      console.log(`📦 Extracted ${categoriesArray.length} categories`);

      // ✅ Apply sorting
      const { sortBy, sortOrder } = filters;
      const sortedCategories = [...categoriesArray].sort((a, b) => {
        let valA, valB;
        if (sortBy === "name") {
          valA = (a.name || "").toLowerCase();
          valB = (b.name || "").toLowerCase();
        } else if (sortBy === "date") {
          valA = new Date(a.updated_at || a.created_at || 0).getTime();
          valB = new Date(b.updated_at || b.created_at || 0).getTime();
        } else if (sortBy === "status") {
          valA = a.is_active === true || a.is_active === 1 ? 1 : 0;
          valB = b.is_active === true || b.is_active === 1 ? 1 : 0;
        } else {
          valA = a.id || 0;
          valB = b.id || 0;
        }

        if (sortOrder === "asc") {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });

      const pageData = {
        current_page: paginatedData.current_page || page,
        last_page: paginatedData.last_page || 1,
        per_page: paginatedData.per_page || perPage,
        total: paginatedData.total || sortedCategories.length,
        next_page_url: paginatedData.next_page_url || null,
        prev_page_url: paginatedData.prev_page_url || null,
        first_page_url: paginatedData.first_page_url || null,
        last_page_url: paginatedData.last_page_url || null,
        path: paginatedData.path || null,
        from: paginatedData.from || null,
        to: paginatedData.to || null,
      };

      const finalCategories = append && page > 1 
        ? [...existingCategories, ...sortedCategories]
        : sortedCategories;

      const hasMoreData = pageData.current_page < pageData.last_page;

      set({
        categories: finalCategories,
        totalCategories: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        perPage: pageData.per_page || perPage,
        pagination: pageData,
        hasMore: hasMoreData,
        loading: false,
        loadingMore: false,
        error: null,
      });

      console.log(`✅ Categories loaded: ${finalCategories.length}, page ${pageData.current_page}/${pageData.last_page}, hasMore: ${hasMoreData}`);
      return { success: true, data: finalCategories, pagination: pageData };
      
    } catch (error) {
      console.error("❌ Failed to fetch categories:", error);
      set({
        categories: append ? get().categories : [],
        totalCategories: append ? get().totalCategories : 0,
        currentPage: 1,
        lastPage: 1,
        pagination: null,
        hasMore: false,
        loading: false,
        loadingMore: false,
        error: error.message || "Failed to fetch categories",
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Load more categories for infinite scrolling
  loadMoreCategories: async () => {
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
      await get().fetchCategories(nextPage, true);
    } catch (error) {
      console.error("❌ Failed to load more categories:", error);
      set({ loadingMore: false });
    }
  },

  // ✅ Get single category
  getCategory: async (id) => {
    console.log("🔍 getCategory called with:", id);
    try {
      const response = await categoriesAPI.getById(id);
      console.log("📦 getCategory response:", response);
      
      const category = getEntityData(response);
      console.log("📊 Extracted category:", category);
      
      return { success: true, data: category };
    } catch (error) {
      console.error("❌ Failed to fetch category:", error);
      return { success: false, error: error.message };
    }
  },

  // ✅ Create category
  createCategory: async (categoryData) => {
    console.log("📝 createCategory called with:", categoryData);
    set({ loading: true, error: null });

    try {
      const payload = {
        user_id: categoryData.user_id || categoryData.userId,
        name: categoryData.name,
        is_active: categoryData.is_active === true || categoryData.is_active === 1 ? 1 : 0,
        created_by: categoryData.created_by || categoryData.user_id || categoryData.userId,
        description: categoryData.description || "",
      };

      console.log("Create Category payload:", payload);
      const response = await categoriesAPI.create(payload);
      console.log("✅ Category created successfully:", response);

      const newCategory = getEntityData(response);
      console.log("📊 Extracted new category:", newCategory);

      if (newCategory && newCategory.id) {
        const { categories } = get();
        set({
          categories: [newCategory, ...categories],
          totalCategories: categories.length + 1,
          loading: false,
          error: null,
        });
      }

      set({ loading: false });
      return { success: true, data: newCategory };
      
    } catch (error) {
      console.error("❌ Failed to create category:", error);
      set({
        error: error.message || "Failed to create category",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Update category
  updateCategory: async (id, categoryData) => {
    console.log("✏️ updateCategory called:", { id, categoryData });
    set({ loading: true, error: null });

    try {
      const payload = {
        name: categoryData.name,
        is_active: categoryData.is_active === true || categoryData.is_active === 1 ? 1 : 0,
        description: categoryData.description || "",
      };

      if (categoryData.user_id) {
        payload.user_id = categoryData.user_id;
      }

      console.log("Update Category payload:", payload);
      const response = await categoriesAPI.update(id, payload);
      console.log("✅ Category updated successfully:", response);

      const updatedCategory = getEntityData(response);
      console.log("📊 Extracted updated category:", updatedCategory);

      if (updatedCategory && updatedCategory.id) {
        const { categories } = get();
        set({
          categories: categories.map(cat => cat.id === id ? updatedCategory : cat),
          loading: false,
          error: null,
        });
      }

      set({ loading: false });
      return { success: true, data: updatedCategory };
      
    } catch (error) {
      console.error("❌ Failed to update category:", error);
      set({
        error: error.message || "Failed to update category",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Delete category
  deleteCategory: async (id) => {
    console.log("🗑️ deleteCategory called with:", id);
    set({ loading: true, error: null });

    try {
      await categoriesAPI.delete(id);
      console.log("✅ Category deleted successfully");

      const { categories } = get();
      set({
        categories: categories.filter(cat => cat.id !== id),
        totalCategories: Math.max(0, categories.length - 1),
        loading: false,
        error: null,
      });

      return { success: true };
      
    } catch (error) {
      console.error("❌ Failed to delete category:", error);
      set({
        error: error.message || "Failed to delete category",
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
      get().fetchCategories(1, false);
    }, 300);
  },

  // ✅ Set page with auto-fetch
  setPage: (page) => {
    const { lastPage } = get();
    if (page >= 1 && page <= lastPage) {
      set({ currentPage: page });
      get().fetchCategories(page, false);
    }
  },

  // ✅ Reset state
  reset: () => {
    set({
      categories: [],
      totalCategories: 0,
      currentPage: 1,
      lastPage: 1,
      perPage: 8,
      loading: false,
      loadingMore: false,
      hasMore: true,
      error: null,
      pagination: null,
      filters: {
        search: "",
        status: "all",
        sortBy: "name",
        sortOrder: "asc",
      },
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useCategoryStore;