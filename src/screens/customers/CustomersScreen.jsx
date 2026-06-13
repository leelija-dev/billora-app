// screens/customers/CustomersScreen.js
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import CustomerFilters from "../../components/customers/CustomerFilters";
import CustomerList from "../../components/customers/CustomerList";
import Header from "../../components/common/Header";
import CustomerForm from "../../components/customers/CustomerForm";
import { SuccessModal, ConfirmationModal } from "../../components/common/CustomModal";
import PaymentModal from "../../components/customers/PaymentModal";
import { useAuthStore } from "../../store/authStore";
import useCustomerStore from "../../store/customerStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";

const CustomersScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  // Get customer store state and actions
  const {
    customers = [],
    totalCustomers,
    loading,
    filters,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    addDuePayment,
    setFilters,
    setPage,
    currentPage,
    lastPage,
  } = useCustomerStore();

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Add/Edit Form Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const searchTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Get filtered menu items from permission store
  const menuItems = useMemo(() => {
    const filtered = getFilteredMenuItems();
    return filtered.map(item => ({
      id: item.id,
      title: item.name,
      screen: item.screen,
      icon: item.icon,
      iconActive: item.iconActive,
      badge: item.badge || null,
    }));
  }, [getFilteredMenuItems]);

  // Get current user ID - same as CategoriesScreen
  const getUserId = useCallback(() => {
    if (user && user.id) return user.id.toString();
    return "1";
  }, [user]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("🔄 Fetching customers for user:", getUserId());
        await fetchCustomers();
        console.log("✅ Customers fetched successfully");
      } catch (error) {
        console.error("❌ Failed to fetch customers:", error);
      } finally {
        if (isMounted.current) setInitialLoading(false);
      }
    };
    loadInitialData();

    return () => {
      isMounted.current = false;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchCustomers, getUserId]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setFilters({ search: searchQuery }), 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, setFilters]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      console.log("Customers screen focused - refreshing data");
      handleRefresh();
      return () => {};
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers(currentPage, true);
    setRefreshing(false);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handlePaymentClick = (customer) => {
    setPaymentCustomer(customer);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (amount) => {
    if (!paymentCustomer) return;
    
    setPaymentProcessing(true);
    try {
      const result = await addDuePayment(paymentCustomer.id, amount);
      if (result && result.success) {
        setSuccessMessage(`Payment of ₹${amount.toFixed(2)} processed successfully!`);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        setShowPaymentModal(false);
        setPaymentCustomer(null);
        // Refresh customers to update due amounts
        await fetchCustomers(currentPage, true);
      } else {
        setSuccessMessage(result?.error || "Failed to process payment");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setSuccessMessage(error.message || "Failed to process payment");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleCancelForm = () => {
    setShowFormModal(false);
    setSelectedCustomer(null);
    setIsEditing(false);
  };

  const handleSubmitCustomer = async (customerData) => {
    setFormSubmitting(true);
    try {
      const userId = getUserId();
      // Add user_id and created_by to payload - like CategoriesScreen
      const payload = {
        ...customerData,
        user_id: userId,
        created_by: userId,
      };

      if (isEditing && selectedCustomer) {
        const result = await updateCustomer(selectedCustomer.id, payload);
        if (result && result.success) {
          setSuccessMessage("Customer updated successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      } else {
        const result = await createCustomer(payload);
        if (result && result.success) {
          setSuccessMessage("Customer created successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      }

      handleCancelForm();
      await fetchCustomers(currentPage, true);
    } catch (error) {
      console.error("Submit error:", error);
      setSuccessMessage(error.message || "An error occurred");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteCustomer = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    try {
      await deleteCustomer(customerToDelete.id);
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
      await fetchCustomers(currentPage, true);
      setSuccessMessage("Customer deleted successfully");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('Delete error:', error);
      setSuccessMessage("Failed to delete customer");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setDeleting(false);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setSortBy(newFilters.sortBy || "name");
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({ search: "", status: "", city: "", dueStatus: "all", sortBy: "name", sortOrder: "asc" });
    setSearchQuery("");
    setSortBy("name");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Calculate stats
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const totalCustomersCount = totalCustomers || safeCustomers.length;
  const hasDueCount = safeCustomers.filter(c => parseFloat(c.due_amount || 0) > 0).length;
  const totalDue = safeCustomers.reduce((sum, c) => sum + (parseFloat(c.due_amount || 0)), 0);
  const activeCount = safeCustomers.filter(c => c.status === "active" || !c.deleted_at).length;

  const latestUpdate = useMemo(() => {
    if (safeCustomers.length === 0) return "N/A";
    const dates = safeCustomers.map(c => c.updated_at ? new Date(c.updated_at).getTime() : (c.created_at ? new Date(c.created_at).getTime() : 0));
    return new Date(Math.max(...dates)).toLocaleDateString();
  }, [safeCustomers]);

  const uniqueCities = useMemo(() => {
    const cities = new Set();
    safeCustomers.forEach(c => {
      if (c.city) cities.add(c.city);
    });
    return cities.size;
  }, [safeCustomers]);

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} pb-16`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      <Header
        title="Customers"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Customers"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity onPress={toggleViewMode} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name={viewMode === "grid" ? "view-grid" : "view-list"} size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name="refresh" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddCustomer} className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30">
              <Icon name="plus" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
            placeholder="Search customers by name, email, phone, address..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowFilters(true)} className={`ml-2 p-2 border-l ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <Icon name="tune" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            {(filters.status !== "all" || filters.city || filters.dueStatus !== "all") && (
              <View className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3b82f6"]} tintColor={isDarkMode ? "#ffffff" : "#3b82f6"} />}
      >
        {/* Stats Cards */}
        <View className="flex-row flex-wrap px-4 py-3">
          <LinearGradient colors={["#3b82f6", "#2563eb"]} className="rounded-xl p-4 flex-1 mr-2" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text className="text-white/80 text-xs">Total Customers</Text>
            <Text className="text-white text-2xl font-bold">{totalCustomersCount}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="account-group" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">All customers</Text>
            </View>
          </LinearGradient>

          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>With Due</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{hasDueCount}</Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-yellow-500 mr-1" />
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {totalCustomersCount > 0 ? ((hasDueCount / totalCustomersCount) * 100).toFixed(0) : 0}% have due
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center">
              <Icon name="cash" size={20} color="#f59e0b" />
              <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Due</Text>
            </View>
            <Text className={`text-xl font-bold mt-1 text-red-500`}>₹{totalDue.toFixed(2)}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Outstanding balance</Text>
          </View>

          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center">
              <Icon name="city" size={20} color="#8b5cf6" />
              <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Cities</Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{uniqueCities}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Unique locations</Text>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center">
              <Icon name="account" size={20} color="#10b981" />
              <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Active Customers</Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {activeCount}
            </Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Active accounts</Text>
          </View>

          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center">
              <Icon name="calendar" size={20} color="#f97316" />
              <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Latest Update</Text>
            </View>
            <Text className={`text-sm font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`} numberOfLines={1}>
              {latestUpdate}
            </Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Recent activity</Text>
          </View>
        </View>

        {/* Filter Chips */}
        {(filters.status !== "all" || filters.city || filters.dueStatus !== "all" || filters.search) && (
          <View className="px-4 mb-3 flex-row flex-wrap">
            {filters.status !== "all" && filters.status && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Status: {filters.status}</Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, status: "" })} className="ml-2">
                  <Icon name="close" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            )}
            {filters.city && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>City: {filters.city}</Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, city: "" })} className="ml-2">
                  <Icon name="close" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            )}
            {filters.dueStatus !== "all" && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Due: {filters.dueStatus === "hasDue" ? "Has Due" : "No Due"}</Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, dueStatus: "all" })} className="ml-2">
                  <Icon name="close" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            )}
            {filters.search && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Search: {filters.search}</Text>
                <TouchableOpacity onPress={() => { setSearchQuery(""); setFilters({ ...filters, search: "" }); }} className="ml-2">
                  <Icon name="close" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Sort Options */}
        <View className="flex-row px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {[
                { id: "name", label: "Name", icon: "sort-alphabetical-ascending" },
                { id: "due", label: "Due Amount", icon: "cash" },
                { id: "date", label: "Date", icon: "calendar" },
                { id: "city", label: "City", icon: "city" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setSortBy(option.id)}
                  className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${sortBy === option.id ? "bg-blue-500 border-blue-500" : isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <Icon name={option.icon} size={16} color={sortBy === option.id ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"} />
                  <Text className={`ml-2 text-sm ${sortBy === option.id ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Customer List */}
        <View className="flex-1 px-4 pb-4">
          <CustomerList
            customers={safeCustomers}
            viewMode={viewMode}
            sortBy={sortBy}
            loading={loading}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            onPayment={handlePaymentClick}
          />
        </View>

        {/* Pagination */}
        {lastPage > 1 && (
          <View className="flex-row items-center justify-center py-4 space-x-2">
            <TouchableOpacity
              onPress={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border ${currentPage === 1 ? "border-gray-200 dark:border-gray-700 opacity-40" : "border-gray-300 dark:border-gray-600"}`}
            >
              <Icon name="chevron-left" size={18} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Page {currentPage} of {lastPage}
            </Text>
            <TouchableOpacity
              onPress={() => setPage(currentPage + 1)}
              disabled={currentPage === lastPage}
              className={`p-2 rounded-lg border ${currentPage === lastPage ? "border-gray-200 dark:border-gray-700 opacity-40" : "border-gray-300 dark:border-gray-600"}`}
            >
              <Icon name="chevron-right" size={18} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Customer Modal */}
      <Modal visible={showFormModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancelForm}>
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <View className={`px-4 pt-12 pb-4 flex-row items-center border-b ${isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
            <TouchableOpacity onPress={handleCancelForm} className="p-2">
              <Icon name="arrow-left" size={24} color={isDarkMode ? "#FFFFFF" : "#1F2937"} />
            </TouchableOpacity>
            <Text className={`flex-1 text-center text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {isEditing ? "Edit Customer" : "Add New Customer"}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView className="flex-1 px-4 pt-4">
            <CustomerForm
              customerId={selectedCustomer?.id}
              onSuccess={handleCancelForm}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        customer={paymentCustomer}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentCustomer(null);
        }}
        onSubmit={handlePaymentSubmit}
        loading={paymentProcessing}
        isDarkMode={isDarkMode}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customerToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={deleting}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />

      {/* Filters Modal */}
      <CustomerFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={filters}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

export default CustomersScreen;