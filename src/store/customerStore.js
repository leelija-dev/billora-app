// store/customerStore.js
import { create } from "zustand";
import { customersAPI } from "../api/customers";
import { useAuthStore } from "./authStore";

const useCustomerStore = create((set, get) => ({
  customers: [],
  totalCustomers: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 15,
  loading: false,
  error: null,
  pagination: {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  },
  filters: {
    search: "",
    status: "",
    city: "",
    dueStatus: "all",
  },

  // Fetch customers
  fetchCustomers: async (page = 1, forceRefresh = false) => {
    const { filters, perPage } = get();
    const { user } = useAuthStore.getState();

    if (!user?.id) {
      console.error("No user authenticated");
      return;
    }

    console.log("🔄 fetchCustomers called with page:", page, "filters:", filters);
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

      set({
        customers: filteredCustomers,
        totalCustomers: pageData.total,
        currentPage: pageData.current_page,
        lastPage: pageData.last_page,
        pagination: pageData,
        loading: false,
      });

      console.log("✅ Customers loaded:", filteredCustomers.length);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch customers:", error);
      set({
        customers: [],
        totalCustomers: 0,
        loading: false,
        error: error.message || "Failed to fetch customers",
      });
    }
  },

  // Get single customer - FIXED for correct API structure
  getCustomer: async (id) => {
    console.log("🔍 getCustomer called with:", id);
    try {
      const response = await customersAPI.getById(id);
      console.log("📦 Raw API Response:", response?.data);
      
      let customerData = null;
      let paymentHistory = [];
      
      // According to your API response structure:
      // response.data.data contains the customer object
      // response.data.bill_payment_history contains the payment history at root level
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
      
      // Get payment history from root level of response
      if (response?.data?.bill_payment_history && Array.isArray(response.data.bill_payment_history)) {
        paymentHistory = response.data.bill_payment_history;
        console.log("✅ Extracted payment history from response.data.bill_payment_history:", paymentHistory.length);
      }
      
      // Attach payment history to customer object (like desktop version)
      if (customerData) {
        customerData.bill_payment_history = paymentHistory;
      }
      
      // Log the extracted data
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

      // Refresh customers to get updated due amount
      await get().fetchCustomers(get().currentPage, true);

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
      
      // Handle different response structures
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
      get().fetchCustomers(1, true);
    }, 100);
  },

  // Change page
  setPage: (page) => {
    if (page >= 1 && page <= get().lastPage) {
      get().fetchCustomers(page, true);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useCustomerStore;