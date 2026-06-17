// screens/customers/CustomersScreen.js
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
import {
  ConfirmationModal,
  SuccessModal,
} from "../../components/common/CustomModal";
import Header from "../../components/common/Header";
import CustomerFilters from "../../components/customers/CustomerFilters";
import CustomerForm from "../../components/customers/CustomerForm";
import CustomerList from "../../components/customers/CustomerList";
import PaymentModal from "../../components/customers/PaymentModal";
import StatsCard from "../../components/dashboard/StatsCard";
import { useAuthStore } from "../../store/authStore";
import useCustomerStore from "../../store/customerStore";
import { usePermissionStore } from "../../store/permissionStore";
import { useThemeStore } from "../../store/themeStore";

const { width } = Dimensions.get("window");

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
    activeFilterType,
    filteredTotal,
    fetchCustomers,
    fetchDueCustomers,
    fetchCityCustomers,
    resetToAllCustomers,
    clearAllFilters,
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

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  const searchTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Get filtered menu items from permission store
  const menuItems = useMemo(() => {
    const filtered = getFilteredMenuItems();
    return filtered.map((item) => ({
      id: item.id,
      title: item.name,
      screen: item.screen,
      icon: item.icon,
      iconActive: item.iconActive,
      badge: item.badge || null,
    }));
  }, [getFilteredMenuItems]);

  // Get current user ID
  const getUserId = useCallback(() => {
    if (user && user.id) return user.id.toString();
    return "1";
  }, [user]);

  // Get display customers and total based on active filter
  const displayCustomers = useMemo(() => {
    return customers || [];
  }, [customers]);

  const displayTotal = useMemo(() => {
    if (activeFilterType === "all") return totalCustomers;
    return filteredTotal;
  }, [activeFilterType, totalCustomers, filteredTotal]);

  // Get stats for current display with trends
  const displayStats = useMemo(() => {
    const total = displayCustomers.length;
    const totalDue = displayCustomers.reduce(
      (sum, c) => sum + (parseFloat(c?.due_amount) || 0),
      0,
    );
    const withDue = displayCustomers.filter(
      (c) => parseFloat(c.due_amount || 0) > 0,
    ).length;
    const active = displayCustomers.filter(
      (c) => c.status === "active" || !c.deleted_at,
    ).length;
    const avgDue = total > 0 ? totalDue / total : 0;

    // Example trends (you would calculate these based on previous period data)
    // For now, setting to null to not show trends
    const totalTrend = null;
    const dueTrend = null;
    const avgDueTrend = null;

    return {
      total,
      totalDue,
      withDue,
      active,
      avgDue,
      totalTrend,
      dueTrend,
      avgDueTrend,
    };
  }, [displayCustomers]);

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
    searchTimeoutRef.current = setTimeout(() => {
      setFilters({ search: searchQuery });
    }, 500);
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
    }, []),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeFilterType === "due") {
      await fetchDueCustomers(filters.search, currentPage);
    } else if (activeFilterType === "city") {
      await fetchCityCustomers(filters.search, currentPage);
    } else {
      await fetchCustomers(currentPage, true);
    }
    setRefreshing(false);
  };

  // Filter handlers
  const handleDueFilter = async () => {
    console.log("💰 Applying due filter");
    await fetchDueCustomers(searchQuery, 1);
    // setSuccessMessage(`Found ${displayTotal} customer(s) with due amount`);
    // setShowSuccessModal(true);
    // setTimeout(() => setShowSuccessModal(false), 1500);
  };

  const handleCityFilter = async () => {
    console.log("🏙️ Applying city filter");
    await fetchCityCustomers(searchQuery, 1);
    // setSuccessMessage(
    //   `Found ${displayTotal} customer(s) with city information`,
    // );
    // setShowSuccessModal(true);
    // setTimeout(() => setShowSuccessModal(false), 1500);
  };

  const handleClearFilter = async () => {
    console.log("🧹 Clearing all filters");
    clearAllFilters();
    setSearchQuery("");
    await fetchCustomers(1, true);
    setSuccessMessage("All filters cleared");
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 1500);
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
        setSuccessMessage(
          `Payment of ₹${amount.toFixed(2)} processed successfully!`,
        );
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        setShowPaymentModal(false);
        setPaymentCustomer(null);
        // Refresh based on current filter
        if (activeFilterType === "due") {
          await fetchDueCustomers(filters.search, currentPage);
        } else if (activeFilterType === "city") {
          await fetchCityCustomers(filters.search, currentPage);
        } else {
          await fetchCustomers(currentPage, true);
        }
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
      // Refresh based on current filter
      if (activeFilterType === "due") {
        await fetchDueCustomers(filters.search, currentPage);
      } else if (activeFilterType === "city") {
        await fetchCityCustomers(filters.search, currentPage);
      } else {
        await fetchCustomers(currentPage, true);
      }
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
      // Refresh based on current filter
      if (activeFilterType === "due") {
        await fetchDueCustomers(filters.search, currentPage);
      } else if (activeFilterType === "city") {
        await fetchCityCustomers(filters.search, currentPage);
      } else {
        await fetchCustomers(currentPage, true);
      }
      setSuccessMessage("Customer deleted successfully");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error("Delete error:", error);
      setSuccessMessage("Failed to delete customer");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setDeleting(false);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "",
      city: "",
      dueStatus: "all",
    });
    setSearchQuery("");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Quick Filter Button Component
  const QuickFilterButton = ({ label, icon, isActive, onPress, count }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2.5 rounded-xl flex-row items-center mr-2 ${
        isActive
          ? "bg-blue-500 shadow-lg shadow-blue-500/30"
          : isDarkMode
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200 shadow-sm"
      }`}
    >
      <Icon
        name={icon}
        size={18}
        color={isActive ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"}
      />
      <Text
        className={`ml-2 text-sm font-medium ${
          isActive
            ? "text-white"
            : isDarkMode
              ? "text-gray-300"
              : "text-gray-700"
        }`}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          className={`ml-2 px-1.5 py-0.5 rounded-full ${
            isActive
              ? "bg-white/30"
              : isDarkMode
                ? "bg-gray-700"
                : "bg-gray-200"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              isActive
                ? "text-white"
                : isDarkMode
                  ? "text-gray-300"
                  : "text-gray-600"
            }`}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (initialLoading) {
    return (
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text
          className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          Loading customers...
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#111827" : "#ffffff"}
      />

      <Header
        title="Customers"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Customers"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={toggleViewMode}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Icon
                name={viewMode === "grid" ? "view-grid" : "view-list"}
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefresh}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Icon
                name="refresh"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddCustomer}
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md"
              style={{ elevation: 4 }}
            >
              <Icon name="plus" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3b82f6"]}
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          />
        }
      >
        {/* Search Bar */}
        <View className="px-4 pt-4 pb-2">
          <View
            className={`flex-row items-center rounded-2xl px-4 h-12 shadow-sm ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <Icon name="magnify" size={20} color="#9ca3af" />
            <TextInput
              className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
              placeholder="Search customers..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")}>
                <Icon name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              className={`ml-2 pl-2 border-l ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <Icon
                name="tune"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
              {(filters.status !== "all" ||
                filters.city ||
                filters.dueStatus !== "all") && (
                <View className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards - Using imported StatsCard component */}
        <View className="flex-row flex-wrap gap-3 px-4">
          <StatsCard
            title="Total Customers"
            value={displayStats.total}
            icon="account-group"
            color="#3b82f6"
            trend={displayStats.totalTrend}
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Total Due"
            value={`₹${displayStats.totalDue.toFixed(0)}`}
            icon="cash"
            color="#f59e0b"
            trend={displayStats.dueTrend}
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Avg Due"
            value={`₹${displayStats.avgDue.toFixed(0)}`}
            icon="chart-line"
            color="#8b5cf6"
            trend={displayStats.avgDueTrend}
            style={{ width: "48%" }}
          />
        </View>

        {/* Quick Filters - Below Stats Cards */}
        <View className="px-4 py-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center">
              <Text
                className={`text-xs font-medium mr-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Quick Filters:
              </Text>

              <QuickFilterButton
                label="All"
                icon="account-group"
                isActive={activeFilterType === "all"}
                onPress={async () => {
                  await resetToAllCustomers(1, searchQuery);
                }}
                count={totalCustomers}
              />

              <QuickFilterButton
                label="Due"
                icon="cash"
                isActive={activeFilterType === "due"}
                onPress={handleDueFilter}
                count={displayStats.withDue}
              />

              <QuickFilterButton
                label="Has City"
                icon="city"
                isActive={activeFilterType === "city"}
                onPress={handleCityFilter}
                count={displayStats.total}
              />

              {(activeFilterType !== "all" || searchQuery) && (
                <TouchableOpacity
                  onPress={handleClearFilter}
                  className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 flex-row items-center ml-1"
                >
                  <Icon name="close" size={16} color="#ef4444" />
                  <Text className="text-red-600 dark:text-red-400 text-sm ml-1">
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Active Filter Badge */}
        {activeFilterType !== "all" && (
          <View className="px-4 mb-3">
            <View
              className={`rounded-xl p-3 flex-row items-center justify-between ${
                isDarkMode
                  ? "bg-blue-900/20 border border-blue-800"
                  : "bg-blue-50 border border-blue-200"
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className={`p-2 rounded-lg ${
                    isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                  }`}
                >
                  <Icon
                    name={activeFilterType === "due" ? "cash" : "city"}
                    size={16}
                    color={activeFilterType === "due" ? "#f59e0b" : "#10b981"}
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {activeFilterType === "due"
                      ? "Due Customers"
                      : "Customers With City"}
                  </Text>
                  <Text
                    className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {displayTotal} customer(s) found
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClearFilter}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
              >
                <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Customer List */}
        <View className="px-4 pb-24">
          <CustomerList
            customers={displayCustomers}
            viewMode={viewMode}
            loading={loading}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            onPayment={handlePaymentClick}
          />
        </View>

        {/* Pagination */}
        {lastPage > 1 && (
          <View className="flex-row items-center justify-center py-4 mb-20 space-x-3">
            <TouchableOpacity
              onPress={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-10 h-10 rounded-xl items-center justify-center border ${
                currentPage === 1
                  ? "border-gray-200 dark:border-gray-700 opacity-40"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm"
              }`}
            >
              <Icon
                name="chevron-left"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>

            <View
              className={`px-4 py-2 rounded-xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
            >
              <Text
                className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                {currentPage} / {lastPage}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setPage(currentPage + 1)}
              disabled={currentPage === lastPage}
              className={`w-10 h-10 rounded-xl items-center justify-center border ${
                currentPage === lastPage
                  ? "border-gray-200 dark:border-gray-700 opacity-40"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm"
              }`}
            >
              <Icon
                name="chevron-right"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>

      {/* Add/Edit Customer Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelForm}
      >
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <View
            className={`px-4 pt-12 pb-4 flex-row items-center border-b ${
              isDarkMode
                ? "border-gray-800 bg-gray-900"
                : "border-gray-200 bg-white"
            }`}
          >
            <TouchableOpacity onPress={handleCancelForm} className="p-2">
              <Icon
                name="arrow-left"
                size={24}
                color={isDarkMode ? "#FFFFFF" : "#1F2937"}
              />
            </TouchableOpacity>
            <Text
              className={`flex-1 text-center text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
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
