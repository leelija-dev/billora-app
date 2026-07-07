// store/customerStore.js
import { create } from "zustand";
import { customersAPI } from "../api/customers";
import { useAuthStore } from "./authStore";
import { getPaginatedData, getEntityData } from "../api/client";

const useCustomerStore = create((set, get) => ({
  customers: [],
  totalCustomers: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 8,
  loading: false,
  error: null,
  pagination: null,
  filters: {
    search: "",
    status: "",
    city: "",
    dueStatus: "all",
  },
  
  // Filter states
  activeFilterType: "all", // 'all', 'due', 'city'
  filteredCustomers: [],
  filteredTotal: 0,
  availableCities: [],
  citiesLoading: false,
  selectedCity: "",

  // ✅ FIXED: Fetch due customers
  fetchDueCustomers: async (search = "", page = 1, append = false) => {
    console.log("💰 fetchDueCustomers called:", { search, page, append });
    set({ loading: true, error: null, activeFilterType: "due" });

    try {
      const { user } = useAuthStore.getState();
      const { customers: existingCustomers } = get();
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await customersAPI.getDueCustomers(user.id, search, page);
      console.log("📦 Due Customers API Response:", response);

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("💰 Due customers paginated:", paginatedData);

      const customersArray = paginatedData.data || [];
      
      // If append is true and page > 1, append to existing customers
      const finalCustomers = append && page > 1 
        ? [...existingCustomers, ...customersArray]
        : customersArray;

      set({
        customers: finalCustomers,
        filteredCustomers: finalCustomers,
        filteredTotal: paginatedData.total || customersArray.length,
        totalCustomers: paginatedData.total || customersArray.length,
        currentPage: paginatedData.current_page || page,
        lastPage: paginatedData.last_page || 1,
        pagination: paginatedData,
        loading: false,
        error: null,
      });
      
      return { success: true, data: finalCustomers, pagination: paginatedData };
    } catch (error) {
      console.error("❌ Failed to fetch due customers:", error);
      set({
        customers: [],
        filteredCustomers: [],
        filteredTotal: 0,
        totalCustomers: 0,
        loading: false,
        error: error.message || "Failed to fetch due customers",
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Fetch customers with city
  fetchCityCustomers: async (search = "", page = 1, append = false) => {
    console.log("🏙️ fetchCityCustomers called:", { search, page, append });
    set({ loading: true, error: null, activeFilterType: "city" });

    try {
      const { user } = useAuthStore.getState();
      const { customers: existingCustomers } = get();
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await customersAPI.getCustomersByCity(user.id, search, page);
      console.log("📦 City Customers API Response:", response);

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("🏙️ City customers paginated:", paginatedData);

      const customersArray = paginatedData.data || [];

      // If append is true and page > 1, append to existing customers
      const finalCustomers = append && page > 1 
        ? [...existingCustomers, ...customersArray]
        : customersArray;

      set({
        customers: finalCustomers,
        filteredCustomers: finalCustomers,
        filteredTotal: paginatedData.total || customersArray.length,
        totalCustomers: paginatedData.total || customersArray.length,
        currentPage: paginatedData.current_page || page,
        lastPage: paginatedData.last_page || 1,
        pagination: paginatedData,
        loading: false,
        error: null,
      });
      
      return { success: true, data: finalCustomers, pagination: paginatedData };
    } catch (error) {
      console.error("❌ Failed to fetch city customers:", error);
      set({
        customers: [],
        filteredCustomers: [],
        filteredTotal: 0,
        totalCustomers: 0,
        loading: false,
        error: error.message || "Failed to fetch city customers",
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Fetch available cities
  fetchAvailableCities: async () => {
    console.log("🏙️ fetchAvailableCities called");
    set({ citiesLoading: true });

    try {
      const { user } = useAuthStore.getState();
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await customersAPI.getUniqueCities(user.id);
      console.log("📦 Cities API Response:", response);

      // ✅ Use helper to extract entity data (or just get the array)
      const citiesData = getEntityData(response);
      const citiesArray = Array.isArray(citiesData) ? citiesData : [];

      set({ availableCities: citiesArray, citiesLoading: false });
      return citiesArray;
    } catch (error) {
      console.error("❌ Failed to fetch cities:", error);
      set({ availableCities: [], citiesLoading: false });
      return [];
    }
  },

  // ✅ Reset to all customers
  resetToAllCustomers: async (page = 1, search = "") => {
    console.log("🔄 resetToAllCustomers called");
    set({ activeFilterType: "all", selectedCity: "" });
    await get().fetchCustomers(page, false);
  },

  // ✅ Clear all filters
  clearAllFilters: () => {
    console.log("🧹 clearAllFilters called");
    set({
      activeFilterType: "all",
      selectedCity: "",
      filters: {
        search: "",
        status: "",
        city: "",
        dueStatus: "all",
      },
    });
  },

  // ✅ FIXED: Fetch customers
  fetchCustomers: async (page = 1, append = false) => {
    const { filters, perPage, activeFilterType, customers: existingCustomers } = get();
    const { user } = useAuthStore.getState();

    if (!user?.id) {
      console.error("❌ No user authenticated");
      return { success: false, error: "User not authenticated" };
    }

    console.log("🔄 fetchCustomers called:", { page, activeFilterType, append });
    
    // If we're in a filtered mode, use the appropriate API
    if (activeFilterType === "due") {
      return get().fetchDueCustomers(filters.search, page, append);
    } else if (activeFilterType === "city") {
      return get().fetchCityCustomers(filters.search, page, append);
    }

    // Normal all customers fetch
    set({ loading: true, error: null });

    try {
      const response = await customersAPI.getAll(
        user.id,
        page,
        perPage,
        filters.search,
      );
      console.log("📦 Customers API Response:", response);

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("📊 Extracted paginated data:", paginatedData);

      let customersArray = paginatedData.data || [];

      // ✅ Apply local filters
      const { status, city, dueStatus } = filters;

      if (status && status !== "all") {
        customersArray = customersArray.filter((c) => c.status === status);
      }

      if (city && city !== "all") {
        customersArray = customersArray.filter((c) => c.city === city);
      }

      if (dueStatus !== "all") {
        if (dueStatus === "hasDue") {
          customersArray = customersArray.filter(
            (c) => parseFloat(c.due_amount || 0) > 0,
          );
        } else if (dueStatus === "noDue") {
          customersArray = customersArray.filter(
            (c) => parseFloat(c.due_amount || 0) === 0,
          );
        }
      }

      // If append is true and page > 1, append to existing customers
      const finalCustomers = append && page > 1 
        ? [...existingCustomers, ...customersArray]
        : customersArray;

      set({
        customers: finalCustomers,
        filteredCustomers: finalCustomers,
        filteredTotal: paginatedData.total || customersArray.length,
        totalCustomers: paginatedData.total || customersArray.length,
        currentPage: paginatedData.current_page || page,
        lastPage: paginatedData.last_page || 1,
        pagination: paginatedData,
        loading: false,
        error: null,
      });

      console.log(`✅ Customers loaded: ${finalCustomers.length}`);
      return { success: true, data: finalCustomers, pagination: paginatedData };
      
    } catch (error) {
      console.error("❌ Failed to fetch customers:", error);
      set({
        customers: [],
        filteredCustomers: [],
        filteredTotal: 0,
        totalCustomers: 0,
        loading: false,
        error: error.message || "Failed to fetch customers",
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Get current display customers
  getDisplayCustomers: () => {
    const { customers, filteredCustomers, activeFilterType } = get();
    return activeFilterType === "all" ? customers : filteredCustomers;
  },

  // ✅ Get display total
  getDisplayTotal: () => {
    const { totalCustomers, filteredTotal, activeFilterType } = get();
    return activeFilterType === "all" ? totalCustomers : filteredTotal;
  },

  // ✅ Get display stats
  getDisplayStats: () => {
    const displayCustomers = get().getDisplayCustomers();
    return {
      total: displayCustomers.length,
      totalDue: displayCustomers.reduce(
        (sum, c) => sum + (parseFloat(c?.due_amount) || 0),
        0,
      ),
    };
  },

  // ✅ FIXED: Get single customer
  getCustomer: async (id) => {
    console.log("🔍 getCustomer called with:", id);
    try {
      const response = await customersAPI.getById(id);
      console.log("📦 Raw API Response:", response);

      // ✅ Use helper to extract entity data
      const customerData = getEntityData(response);
      console.log("📊 Extracted customer:", customerData);

      // Extract payment history if available
      let paymentHistory = [];
      if (customerData?.bill_payment_history && Array.isArray(customerData.bill_payment_history)) {
        paymentHistory = customerData.bill_payment_history;
      }

      const finalData = {
        ...customerData,
        bill_payment_history: paymentHistory,
      };

      console.log("📊 Final Customer Data:", {
        id: finalData?.id,
        name: finalData?.name,
        due_amount: finalData?.due_amount,
        paymentHistoryCount: paymentHistory.length,
      });

      return { success: true, data: finalData };
    } catch (error) {
      console.error("❌ Failed to fetch customer:", error);
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Create customer
  createCustomer: async (customerData) => {
    console.log("📝 createCustomer called with:", customerData);
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      const payload = {
        user_id: user.id,
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city || null,
        gst_number: customerData.gst_number || null,
        created_by: user.id,
      };

      const response = await customersAPI.create(payload);
      console.log("✅ Customer created:", response);

      // ✅ Use helper to extract entity data
      const newCustomer = getEntityData(response);
      console.log("📊 Extracted new customer:", newCustomer);

      // Optimistic update
      if (newCustomer && newCustomer.id) {
        const { customers } = get();
        set({
          customers: [newCustomer, ...customers],
          totalCustomers: customers.length + 1,
          loading: false,
          error: null,
        });
      }

      set({ loading: false });
      return { success: true, data: newCustomer };
    } catch (error) {
      console.error("❌ Failed to create customer:", error);
      set({
        error: error.message || "Failed to create customer",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Update customer
  updateCustomer: async (id, customerData) => {
    console.log("✏️ updateCustomer called:", { id, customerData });
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      const payload = {
        user_id: user.id,
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city || null,
        gst_number: customerData.gst_number || null,
      };

      const response = await customersAPI.update(id, payload);
      console.log("✅ Customer updated:", response);

      // ✅ Use helper to extract entity data
      const updatedCustomer = getEntityData(response);
      console.log("📊 Extracted updated customer:", updatedCustomer);

      // Optimistic update
      if (updatedCustomer && updatedCustomer.id) {
        const { customers } = get();
        set({
          customers: customers.map(c => c.id === id ? updatedCustomer : c),
          loading: false,
          error: null,
        });
      }

      set({ loading: false });
      return { success: true, data: updatedCustomer };
    } catch (error) {
      console.error("❌ Failed to update customer:", error);
      set({
        error: error.message || "Failed to update customer",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Delete customer
  deleteCustomer: async (id) => {
    console.log("🗑️ deleteCustomer called with:", id);
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      await customersAPI.delete(id, user?.id);

      // Remove from local state
      const { customers } = get();
      set({
        customers: customers.filter(c => c.id !== id),
        totalCustomers: Math.max(0, customers.length - 1),
        loading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Failed to delete customer:", error);
      set({
        error: error.message || "Failed to delete customer",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Fetch trashed customers
  fetchTrashedCustomers: async (page = 1) => {
    console.log("🗑️ fetchTrashedCustomers called with page:", page);
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await customersAPI.getTrashed(user.id, page);
      console.log("📦 Trashed customers response:", response);

      // ✅ Use helper to extract paginated data
      const paginatedData = getPaginatedData(response);
      console.log("🗑️ Trashed customers paginated:", paginatedData);

      const customersArray = paginatedData.data || [];

      set({
        customers: customersArray,
        totalCustomers: paginatedData.total || customersArray.length,
        currentPage: paginatedData.current_page || page,
        lastPage: paginatedData.last_page || 1,
        pagination: paginatedData,
        loading: false,
        error: null,
      });

      return { success: true, data: customersArray, pagination: paginatedData };
    } catch (error) {
      console.error("❌ Failed to fetch trashed customers:", error);
      set({
        loading: false,
        error: error.message || "Failed to fetch trashed customers",
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Restore customer
  restoreCustomer: async (id) => {
    console.log("🔄 restoreCustomer called with:", id);
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      await customersAPI.restore(id, user?.id);

      // Refresh the list
      await get().fetchCustomers(get().currentPage, false);

      set({ loading: false, error: null });
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to restore customer:", error);
      set({
        error: error.message || "Failed to restore customer",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Permanently delete customer
  forceDeleteCustomer: async (id) => {
    console.log("💀 forceDeleteCustomer called with:", id);
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      await customersAPI.forceDelete(id, user?.id);

      // Remove from local state
      const { customers } = get();
      set({
        customers: customers.filter(c => c.id !== id),
        totalCustomers: Math.max(0, customers.length - 1),
        loading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Failed to permanently delete customer:", error);
      set({
        error: error.message || "Failed to permanently delete customer",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Add due payment
  addDuePayment: async (id, amount) => {
    console.log("💰 addDuePayment called:", { id, amount });
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      await customersAPI.addDuePayment(id, user?.id, amount);

      // Refresh based on current filter type
      const { activeFilterType, filters } = get();
      if (activeFilterType === "due") {
        await get().fetchDueCustomers(filters.search, get().currentPage);
      } else if (activeFilterType === "city") {
        await get().fetchCityCustomers(filters.search, get().currentPage);
      } else {
        await get().fetchCustomers(get().currentPage, false);
      }

      set({ loading: false, error: null });
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to add due payment:", error);
      set({
        error: error.message || "Failed to add due payment",
        loading: false,
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ FIXED: Get customer payment history
  getCustomerPaymentHistory: async (id, startDate = "", endDate = "") => {
    console.log("💳 getCustomerPaymentHistory called:", { id, startDate, endDate });
    set({ loading: true, error: null });

    try {
      const response = await customersAPI.getPaymentHistory(id, startDate, endDate);
      console.log("📦 Payment History Response:", response);

      // ✅ Use helper to extract entity data
      const historyData = getEntityData(response);
      const historyArray = Array.isArray(historyData) ? historyData : [];

      console.log("💳 Payment history processed:", historyArray.length, "records");

      set({ loading: false, error: null });
      return { success: true, data: historyArray };
    } catch (error) {
      console.error("❌ Failed to fetch payment history:", error);
      set({
        loading: false,
        error: error.message || "Failed to fetch payment history",
      });
      return { success: false, error: error.message };
    }
  },

  // ✅ Set filters with auto-fetch
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });

    // Auto-fetch with new filters (debounced)
    setTimeout(() => {
      const { activeFilterType } = get();
      if (activeFilterType === "due") {
        get().fetchDueCustomers(updatedFilters.search, 1);
      } else if (activeFilterType === "city") {
        get().fetchCityCustomers(updatedFilters.search, 1);
      } else {
        get().fetchCustomers(1, false);
      }
    }, 300);
  },

  // ✅ Set page with auto-fetch
  setPage: (page) => {
    const { lastPage, activeFilterType, filters } = get();
    if (page >= 1 && page <= lastPage) {
      if (activeFilterType === "due") {
        get().fetchDueCustomers(filters.search, page);
      } else if (activeFilterType === "city") {
        get().fetchCityCustomers(filters.search, page);
      } else {
        get().fetchCustomers(page, false);
      }
    }
  },

  // ✅ Load next page (append for infinite scrolling)
  loadNextPage: async () => {
    const { currentPage, lastPage, loading } = get();
    if (loading || currentPage >= lastPage) {
      console.log('⏭️ No more pages to load or already loading');
      return;
    }
    
    console.log('⏬ Loading next page:', currentPage + 1);
    const { activeFilterType, filters } = get();
    
    if (activeFilterType === "due") {
      await get().fetchDueCustomers(filters.search, currentPage + 1, true);
    } else if (activeFilterType === "city") {
      await get().fetchCityCustomers(filters.search, currentPage + 1, true);
    } else {
      await get().fetchCustomers(currentPage + 1, true);
    }
  },

  // ✅ Reset state
  reset: () => {
    set({
      customers: [],
      totalCustomers: 0,
      currentPage: 1,
      lastPage: 1,
      pagination: null,
      loading: false,
      error: null,
      filteredCustomers: [],
      filteredTotal: 0,
      activeFilterType: "all",
      selectedCity: "",
      filters: {
        search: "",
        status: "",
        city: "",
        dueStatus: "all",
      },
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useCustomerStore;