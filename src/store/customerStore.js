// store/customerStore.js
import { create } from "zustand";
import { customersAPI } from "../api/customers";
import { useAuthStore } from "./authStore";

const useCustomerStore = create((set, get) => ({
  customers: [],
  totalCustomers: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 8,
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 8,
    total: 0,
  },
  filters: {
    search: "",
    status: "",
    city: "",
    dueStatus: "all",
  },
  
  // New filter states (like web version)
  activeFilterType: "all", // 'all', 'due', 'city'
  filteredCustomers: [],
  filteredTotal: 0,
  availableCities: [],
  citiesLoading: false,
  selectedCity: "",

  // Fetch due customers (like web version)
  fetchDueCustomers: async (search = "", page = 1, append = false) => {
    console.log("💰 fetchDueCustomers called with search:", search, "page:", page, "append:", append);
    set({ loading: true, error: null, activeFilterType: "due" });

    try {
      const { user } = useAuthStore.getState();
      const { customers: existingCustomers } = get();
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await customersAPI.getDueCustomers(user.id, search, page);
      console.log("📦 Due Customers API Response:", response);

      let customersArray = [];
      let total = 0;
      let paginationData = {};

      // Handle nested response structure (same as web version)
      if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
        customersArray = response.data.data.data;
        total = response.data.data.total || customersArray.length;
        paginationData = response.data.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        customersArray = response.data.data;
        total = response.data.data.total || customersArray.length;
        paginationData = response.data;
      } else if (Array.isArray(response?.data)) {
        customersArray = response.data;
        total = customersArray.length;
      } else if (response?.data && typeof response.data === "object") {
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            customersArray = response.data[key];
            total = customersArray.length;
            break;
          }
        }
      }

      if (!Array.isArray(customersArray)) {
        customersArray = [];
        total = 0;
      }

      console.log("💰 Due customers extracted:", customersArray.length);

      // If append is true and page > 1, append to existing customers
      const finalCustomers = append && page > 1 
        ? [...existingCustomers, ...customersArray]
        : customersArray;

      set({
        customers: finalCustomers,
        filteredCustomers: finalCustomers,
        filteredTotal: total,
        totalCustomers: total,
        currentPage: paginationData.current_page || page,
        lastPage: paginationData.last_page || 1,
        loading: false,
      });
      
      return { success: true, data: finalCustomers, total };
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

  // Fetch customers with city (like web version)
  fetchCityCustomers: async (search = "", page = 1, append = false) => {
    console.log("🏙️ fetchCityCustomers called with search:", search, "page:", page, "append:", append);
    set({ loading: true, error: null, activeFilterType: "city" });

    try {
      const { user } = useAuthStore.getState();
      const { customers: existingCustomers } = get();
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const response = await customersAPI.getCustomersByCity(user.id, search, page);
      console.log("📦 City Customers API Response:", response);

      let customersArray = [];
      let total = 0;
      let paginationData = {};

      // Handle nested response structure (same as web version)
      if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
        customersArray = response.data.data.data;
        total = response.data.data.total || customersArray.length;
        paginationData = response.data.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        customersArray = response.data.data;
        total = response.data.data.total || customersArray.length;
        paginationData = response.data;
      } else if (Array.isArray(response?.data)) {
        customersArray = response.data;
        total = customersArray.length;
      } else if (response?.data && typeof response.data === "object") {
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            customersArray = response.data[key];
            total = customersArray.length;
            break;
          }
        }
      }

      if (!Array.isArray(customersArray)) {
        customersArray = [];
        total = 0;
      }

      console.log("🏙️ City customers extracted:", customersArray.length);

      // If append is true and page > 1, append to existing customers
      const finalCustomers = append && page > 1 
        ? [...existingCustomers, ...customersArray]
        : customersArray;

      set({
        customers: finalCustomers,
        filteredCustomers: finalCustomers,
        filteredTotal: total,
        totalCustomers: total,
        currentPage: paginationData.current_page || page,
        lastPage: paginationData.last_page || 1,
        loading: false,
      });
      
      return { success: true, data: finalCustomers, total };
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

  // Fetch unique cities (like web version)
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

      let citiesArray = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        citiesArray = response.data.data;
      } else if (Array.isArray(response?.data)) {
        citiesArray = response.data;
      } else if (response?.data && typeof response.data === "object") {
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            citiesArray = response.data[key];
            break;
          }
        }
      }

      set({ availableCities: citiesArray, citiesLoading: false });
      return citiesArray;
    } catch (error) {
      console.error("❌ Failed to fetch cities:", error);
      set({ availableCities: [], citiesLoading: false });
      return [];
    }
  },

  // Reset to all customers (like web version)
  resetToAllCustomers: async (page = 1, search = "") => {
    console.log("🔄 resetToAllCustomers called");
    set({ activeFilterType: "all", selectedCity: "" });
    await get().fetchCustomers(page, true);
  },

  // Clear all filters (like web version)
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

  // Fetch customers (updated to handle filter type)
  fetchCustomers: async (page = 1, forceRefresh = false, append = false) => {
    const { filters, perPage, activeFilterType, customers: existingCustomers } = get();
    const { user } = useAuthStore.getState();

    if (!user?.id) {
      console.error("No user authenticated");
      return;
    }

    console.log("🔄 fetchCustomers called with page:", page, "activeFilterType:", activeFilterType, "append:", append);
    
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

      let customersArray = [];
      let paginationData = {};

      if (response?.data?.data?.data) {
        customersArray = response.data.data.data;
        paginationData = response.data.data;
      } else if (response?.data?.data) {
        customersArray = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        paginationData = response.data;
      } else if (response?.data) {
        customersArray = Array.isArray(response.data) ? response.data : [];
      }

      if (!Array.isArray(customersArray)) {
        customersArray = [];
      }

      // Apply local filters
      let filteredCustomers = [...customersArray];
      const { status, city, dueStatus } = filters;

      if (status && status !== "all") {
        filteredCustomers = filteredCustomers.filter(
          (c) => c.status === status,
        );
      }

      if (city && city !== "all") {
        filteredCustomers = filteredCustomers.filter((c) => c.city === city);
      }

      if (dueStatus !== "all") {
        if (dueStatus === "hasDue") {
          filteredCustomers = filteredCustomers.filter(
            (c) => parseFloat(c.due_amount || 0) > 0,
          );
        } else if (dueStatus === "noDue") {
          filteredCustomers = filteredCustomers.filter(
            (c) => parseFloat(c.due_amount || 0) === 0,
          );
        }
      }

      const pageData = {
        current_page: paginationData.current_page || page,
        last_page: paginationData.last_page || 1,
        per_page: paginationData.per_page || perPage,
        total: paginationData.total || filteredCustomers.length,
      };

      // If append is true and not force refresh and page > 1, append to existing customers
      const finalCustomers = append && !forceRefresh && page > 1 
        ? [...existingCustomers, ...filteredCustomers]
        : filteredCustomers;

      set({
        customers: finalCustomers,
        filteredCustomers: finalCustomers,
        filteredTotal: pageData.total,
        totalCustomers: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        loading: false,
      });

      console.log("✅ Customers loaded:", finalCustomers.length);
      return response;
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
    }
  },

  // Get current display customers (like web version)
  getDisplayCustomers: () => {
    const { customers, filteredCustomers, activeFilterType } = get();
    return activeFilterType === "all" ? customers : filteredCustomers;
  },

  // Get display total (like web version)
  getDisplayTotal: () => {
    const { totalCustomers, filteredTotal, activeFilterType } = get();
    return activeFilterType === "all" ? totalCustomers : filteredTotal;
  },

  // Get stats for display (like web version)
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

  // Get single customer - FIXED for correct API structure
  getCustomer: async (id) => {
    console.log("🔍 getCustomer called with:", id);
    try {
      const response = await customersAPI.getById(id);
      console.log("📦 Raw API Response:", response?.data);
      
      let customerData = null;
      let paymentHistory = [];
      
      if (response?.data?.data) {
        customerData = response.data.data;
        console.log("✅ Extracted customer from response.data.data");
      } else if (response?.data) {
        customerData = response.data;
        console.log("✅ Extracted customer from response.data");
      } else {
        customerData = response;
        console.log("✅ Extracted customer from response");
      }
      
      if (response?.data?.bill_payment_history && Array.isArray(response.data.bill_payment_history)) {
        paymentHistory = response.data.bill_payment_history;
        console.log("✅ Extracted payment history:", paymentHistory.length);
      }
      
      if (customerData) {
        customerData.bill_payment_history = paymentHistory;
      }
      
      console.log("📊 Final Customer Data:", {
        id: customerData?.id,
        name: customerData?.name,
        due_amount: customerData?.due_amount,
        paymentHistoryCount: customerData?.bill_payment_history?.length || 0
      });
      
      return customerData;
    } catch (error) {
      console.error("❌ Failed to fetch customer:", error);
      throw error;
    }
  },

  // Create customer
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

      let newCustomer = null;
      if (response?.data?.data) {
        newCustomer = response.data.data;
      } else if (response?.data) {
        newCustomer = response.data;
      } else {
        newCustomer = response;
      }

      await get().fetchCustomers(get().currentPage, true);

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

  // Update customer
  updateCustomer: async (id, customerData) => {
    console.log("✏️ updateCustomer called with:", id, customerData);
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

      let updatedCustomer = null;
      if (response?.data?.data) {
        updatedCustomer = response.data.data;
      } else if (response?.data) {
        updatedCustomer = response.data;
      } else {
        updatedCustomer = response;
      }

      await get().fetchCustomers(get().currentPage, true);

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

  // Delete customer (soft delete)
  deleteCustomer: async (id) => {
    console.log("🗑️ deleteCustomer called with:", id);
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      await customersAPI.delete(id, user?.id);

      await get().fetchCustomers(get().currentPage, true);

      set({ loading: false });
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

  // Fetch trashed customers
  fetchTrashedCustomers: async (page = 1) => {
    console.log("🗑️ fetchTrashedCustomers called with page:", page);
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      const response = await customersAPI.getTrashed(user?.id, page);

      let customersArray = [];
      let paginationData = {};

      if (response?.data?.data?.data) {
        customersArray = response.data.data.data;
        paginationData = response.data.data;
      } else if (response?.data?.data) {
        customersArray = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        paginationData = response.data;
      } else if (response?.data) {
        customersArray = Array.isArray(response.data) ? response.data : [];
      }

      set({
        customers: customersArray,
        totalCustomers: paginationData.total || customersArray.length,
        currentPage: paginationData.current_page || page,
        lastPage: paginationData.last_page || 1,
        loading: false,
      });

      return { success: true, data: customersArray };
    } catch (error) {
      console.error("❌ Failed to fetch trashed customers:", error);
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Restore customer
  restoreCustomer: async (id) => {
    console.log("🔄 restoreCustomer called with:", id);
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      await customersAPI.restore(id, user?.id);

      await get().fetchCustomers(get().currentPage, true);

      set({ loading: false });
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

  // Permanently delete customer
  forceDeleteCustomer: async (id) => {
    console.log("💀 forceDeleteCustomer called with:", id);
    set({ loading: true, error: null });

    try {
      const { user } = useAuthStore.getState();
      await customersAPI.forceDelete(id, user?.id);

      await get().fetchCustomers(get().currentPage, true);

      set({ loading: false });
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

  // Add due payment
  addDuePayment: async (id, amount) => {
    console.log("💰 addDuePayment called with:", id, amount);
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
        await get().fetchCustomers(get().currentPage, true);
      }

      set({ loading: false });
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

  // Get customer payment history with date filters
  getCustomerPaymentHistory: async (id, startDate = "", endDate = "") => {
    console.log("💳 getCustomerPaymentHistory called with:", id, startDate, endDate);
    set({ loading: true, error: null });

    try {
      const response = await customersAPI.getPaymentHistory(id, startDate, endDate);
      console.log("📦 Payment History Response:", response?.data);
      
      let historyArray = [];
      
      if (response?.data?.bill_payment_history && Array.isArray(response.data.bill_payment_history)) {
        historyArray = response.data.bill_payment_history;
      } else if (response?.data?.data?.bill_payment_history && Array.isArray(response.data.data.bill_payment_history)) {
        historyArray = response.data.data.bill_payment_history;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        historyArray = response.data.data;
      } else if (Array.isArray(response?.data)) {
        historyArray = response.data;
      }
      
      console.log("💳 Payment history processed:", historyArray.length, "records");
      
      set({ loading: false });
      return { success: true, data: historyArray };
    } catch (error) {
      console.error("❌ Failed to fetch payment history:", error);
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Set filters
  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    set({ filters: updatedFilters });

    setTimeout(() => {
      const { activeFilterType } = get();
      if (activeFilterType === "due") {
        get().fetchDueCustomers(updatedFilters.search, 1);
      } else if (activeFilterType === "city") {
        get().fetchCityCustomers(updatedFilters.search, 1);
      } else {
        get().fetchCustomers(1, true);
      }
    }, 100);
  },

  // Change page
  setPage: (page) => {
    const { lastPage, activeFilterType, filters } = get();
    if (page >= 1 && page <= lastPage) {
      if (activeFilterType === "due") {
        get().fetchDueCustomers(filters.search, page);
      } else if (activeFilterType === "city") {
        get().fetchCityCustomers(filters.search, page);
      } else {
        get().fetchCustomers(page, true);
      }
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useCustomerStore;