// screens/stores/StoresScreen.js
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
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/common/Header";
import StoreFilters from "../../components/stores/StoreFilters";
import StoreList from "../../components/stores/StoreList";
import StoreForm from "../../components/stores/StoreForm";
import { ConfirmationModal, SuccessModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useStoreStore from "../../store/storeStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const StoresScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  const {
    stores = [],
    totalStores,
    loading,
    filters,
    fetchStores,
    createStore,
    updateStore,
    deleteStore,
    setFilters,
  } = useStoreStore();

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  // Get current user ID
  const getUserId = useCallback(() => {
    if (user && user.id) return user.id.toString();
    return "1";
  }, [user]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("🔄 Fetching stores for user:", getUserId());
        const result = await fetchStores(getUserId(), 1, { search: searchQuery, start_date: startDate, end_date: endDate, status: filters.status });
        if (result?.data) {
          setCurrentPage(result.data.current_page || 1);
          setLastPage(result.data.last_page || 1);
        }
        console.log("✅ Stores fetched successfully");
      } catch (error) {
        console.error("❌ Failed to fetch stores:", error);
      } finally {
        if (isMounted.current) setInitialLoading(false);
      }
    };
    loadInitialData();

    return () => {
      isMounted.current = false;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchStores, getUserId]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters({ search: searchQuery });
      setCurrentPage(1);
      fetchStores(getUserId(), 1, { search: searchQuery, start_date: startDate, end_date: endDate, status: filters.status });
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, setFilters, fetchStores, getUserId, startDate, endDate, filters.status]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      console.log("Stores screen focused - refreshing data");
      handleRefresh();
      return () => {};
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await fetchStores(getUserId(), 1, { search: searchQuery, start_date: startDate, end_date: endDate, status: filters.status });
    if (result?.data) {
      setCurrentPage(result.data.current_page || 1);
      setLastPage(result.data.last_page || 1);
    }
    setRefreshing(false);
  };

  // Load more stores for infinite scroll
  const loadMoreStores = useCallback(async () => {
    if (currentPage < lastPage && !loading) {
      const nextPage = currentPage + 1;
      const result = await fetchStores(getUserId(), nextPage, { search: searchQuery, start_date: startDate, end_date: endDate, status: filters.status }, true);
      if (result?.data) {
        setCurrentPage(result.data.current_page || nextPage);
        setLastPage(result.data.last_page || lastPage);
      }
    }
  }, [currentPage, lastPage, loading, getUserId, searchQuery, startDate, endDate, filters.status, fetchStores]);

  // Infinite scroll hook
  const { handleScroll, isFetchingMore } = useInfiniteScroll(loadMoreStores, {
    threshold: 500,
    hasMore: currentPage < lastPage,
    loading: loading,
  });

  const handleAddStore = () => {
    setSelectedStore(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditStore = (store) => {
    setSelectedStore(store);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleCancelForm = () => {
    setShowFormModal(false);
    setSelectedStore(null);
    setIsEditing(false);
  };

  const handleSubmitStore = async (storeData) => {
    setFormSubmitting(true);
    try {
      const userId = getUserId();
      const payload = {
        ...storeData,
        user_id: userId,
        created_by: userId,
      };

      if (isEditing && selectedStore) {
        const result = await updateStore(selectedStore.id, payload);
        if (result && result.success) {
          setSuccessMessage("Store updated successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      } else {
        const result = await createStore(payload);
        if (result && result.success) {
          setSuccessMessage("Store created successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      }

      handleCancelForm();
      await fetchStores(getUserId());
    } catch (error) {
      console.error("Submit error:", error);
      setSuccessMessage(error.message || "An error occurred");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClick = (store) => {
    setStoreToDelete(store);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!storeToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteStore(storeToDelete.id);
      if (result.success) {
        setSuccessMessage("Store deleted successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        await fetchStores(getUserId());
      } else {
        setSuccessMessage(result.error || "Failed to delete store");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setSuccessMessage(error.message || "Failed to delete store");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setStoreToDelete(null);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setSortBy(newFilters.sortBy || "name");
    setStartDate(newFilters.startDate || "");
    setEndDate(newFilters.endDate || "");
    setShowFilters(false);
    setCurrentPage(1);
    fetchStores(getUserId(), 1, { ...newFilters, search: searchQuery, start_date: newFilters.startDate, end_date: newFilters.endDate });
  };

  const handleResetFilters = () => {
    setFilters({ search: "", status: "all", sortBy: "name", sortOrder: "asc" });
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setSortBy("name");
    setCurrentPage(1);
    fetchStores(getUserId(), 1, { search: "", start_date: "", end_date: "", status: "all" });
  };


  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const safeStores = Array.isArray(stores) ? stores : [];
  
  // Calculate stats
  const totalStoresCount = totalStores || safeStores.length;
  const activeStores = safeStores.filter(s => s.status === true || s.status === "active").length;
  const uniqueCities = useMemo(() => {
    const cities = new Set();
    safeStores.forEach(s => {
      if (s.city) cities.add(s.city);
    });
    return cities.size;
  }, [safeStores]);

  const latestUpdate = useMemo(() => {
    if (safeStores.length === 0) return "N/A";
    const dates = safeStores.map(s => s.updated_at ? new Date(s.updated_at).getTime() : (s.created_at ? new Date(s.created_at).getTime() : 0));
    return new Date(Math.max(...dates)).toLocaleDateString();
  }, [safeStores]);

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading stores...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} pb-16`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      <Header
        title="Stores"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Stores"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity onPress={toggleViewMode} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name={viewMode === "grid" ? "view-grid" : "view-list"} size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name="refresh" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddStore} className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30">
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
            placeholder="Search stores by name, email, or city..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowFilters(true)} className={`ml-2 p-2 border-l ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <Icon name="tune" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            {(filters.status !== "all" || filters.city) && (
              <View className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3b82f6"]} tintColor={isDarkMode ? "#ffffff" : "#3b82f6"} />}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {/* Stats Cards */}
        <View className="flex-row flex-wrap px-4 py-3">
          <LinearGradient style={{borderRadius:8}} colors={["#3b82f6", "#2563eb"]} className="rounded-xl p-4 flex-1 mr-2" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text className="text-white/80 text-xs">Total Stores</Text>
            <Text className="text-white text-2xl font-bold">{totalStoresCount}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="store" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">All stores</Text>
            </View>
          </LinearGradient>

          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Active Stores</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{activeStores}</Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {totalStoresCount > 0 ? ((activeStores / totalStoresCount) * 100).toFixed(0) : 0}% active
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center">
              <Icon name="city" size={20} color="#8b5cf6" />
              <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Cities</Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{uniqueCities}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Unique locations</Text>
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
        {(filters.status !== "all" || filters.city || filters.search) && (
          <View className="px-4 mb-3 flex-row flex-wrap">
            {filters.status !== "all" && filters.status && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Status: {filters.status}</Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, status: "all" })} className="ml-2">
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
                { id: "date", label: "Date", icon: "calendar" },
                { id: "city", label: "City", icon: "city" },
                { id: "status", label: "Status", icon: "checkbox-marked-circle-outline" },
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

        {/* Store List */}
        <View className="flex-1 px-4 pb-4">
          <StoreList
            stores={safeStores}
            viewMode={viewMode}
            sortBy={sortBy}
            loading={loading}
            searchQuery={searchQuery}
            filters={filters}
            onEdit={handleEditStore}
            onDelete={handleDeleteClick}
            onRefresh={handleRefresh}
          />

          {/* Loading indicator for infinite scroll */}
          {isFetchingMore && currentPage < lastPage && (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Loading more stores...
              </Text>
            </View>
          )}

          {/* End of list indicator */}
          {currentPage >= lastPage && safeStores.length > 0 && (
            <View className="py-4 items-center">
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Showing all {safeStores.length} stores
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Store Modal */}
      <Modal visible={showFormModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancelForm}>
        <StoreForm
          store={selectedStore}
          onSubmit={handleSubmitStore}
          onCancel={handleCancelForm}
          isSubmitting={formSubmitting}
          isEdit={isEditing}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Store"
        message={`Are you sure you want to delete "${storeToDelete?.name}"? This action cannot be undone.`}
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
      <StoreFilters
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

export default StoresScreen;