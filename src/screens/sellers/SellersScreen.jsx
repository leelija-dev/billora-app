// screens/sellers/SellersScreen.js
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
import { ConfirmationModal, SuccessModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useSellerStore from "../../store/sellerStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import SellerForm from "../../components/sellers/SellerForm";
import SellerList from "../../components/sellers/SellerList";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const SellersScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  const {
    sellers = [],
    totalSellers,
    loading,
    filters,
    fetchSellers,
    createSeller,
    updateSeller,
    deleteSeller,
    setFilters,
  } = useSellerStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState(null);
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
        console.log("🔄 Fetching sellers for user:", getUserId());
        const result = await fetchSellers(getUserId(), 1, searchQuery);
        if (result?.sellers) {
          setCurrentPage(result.sellers.current_page || 1);
          setLastPage(result.sellers.last_page || 1);
        }
        console.log("✅ Sellers fetched successfully");
      } catch (error) {
        console.error("❌ Failed to fetch sellers:", error);
      } finally {
        if (isMounted.current) setInitialLoading(false);
      }
    };
    loadInitialData();

    return () => {
      isMounted.current = false;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchSellers, getUserId]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters({ search: searchQuery });
      setCurrentPage(1);
      fetchSellers(getUserId(), 1, searchQuery);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, setFilters, fetchSellers, getUserId]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      console.log("Sellers screen focused - refreshing data");
      handleRefresh();
      return () => {};
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await fetchSellers(getUserId(), 1, searchQuery);
    if (result?.sellers) {
      setCurrentPage(result.sellers.current_page || 1);
      setLastPage(result.sellers.last_page || 1);
    }
    setRefreshing(false);
  };

  // Load more sellers for infinite scroll
  const loadMoreSellers = useCallback(async () => {
    if (currentPage < lastPage && !loading) {
      const nextPage = currentPage + 1;
      const result = await fetchSellers(getUserId(), nextPage, searchQuery, true);
      if (result?.sellers) {
        setCurrentPage(result.sellers.current_page || nextPage);
        setLastPage(result.sellers.last_page || lastPage);
      }
    }
  }, [currentPage, lastPage, loading, getUserId, searchQuery, fetchSellers]);

  // Infinite scroll hook
  const { handleScroll, isFetchingMore } = useInfiniteScroll(loadMoreSellers, {
    threshold: 500,
    hasMore: currentPage < lastPage,
    loading: loading,
  });

  const handleAddSeller = () => {
    setSelectedSeller(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditSeller = (seller) => {
    setSelectedSeller(seller);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleCancelForm = () => {
    setShowFormModal(false);
    setSelectedSeller(null);
    setIsEditing(false);
  };

  const handleSubmitSeller = async (sellerData) => {
    setFormSubmitting(true);
    try {
      const userId = getUserId();
      const payload = {
        ...sellerData,
        user_id: userId,
      };

      if (isEditing && selectedSeller) {
        const result = await updateSeller(selectedSeller.id, payload);
        if (result && result.success) {
          setSuccessMessage("Seller updated successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      } else {
        const result = await createSeller(payload);
        if (result && result.success) {
          setSuccessMessage("Seller created successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      }

      handleCancelForm();
      await fetchSellers(getUserId(), currentPage, searchQuery);
    } catch (error) {
      console.error("Submit error:", error);
      setSuccessMessage(error.message || "An error occurred");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClick = (seller) => {
    setSellerToDelete(seller);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!sellerToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteSeller(sellerToDelete.id);
      if (result.success) {
        setSuccessMessage("Seller deleted successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        await fetchSellers(getUserId(), currentPage, searchQuery);
      } else {
        setSuccessMessage(result.error || "Failed to delete seller");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setSuccessMessage(error.message || "Failed to delete seller");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setSellerToDelete(null);
    }
  };


  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const safeSellers = Array.isArray(sellers) ? sellers : [];
  
  // Calculate stats
  const totalSellersCount = totalSellers || safeSellers.length;
  const totalDueAmount = useMemo(() => {
    return safeSellers.reduce((sum, seller) => sum + (parseFloat(seller.due_amount) || 0), 0);
  }, [safeSellers]);
  const uniqueCities = useMemo(() => {
    const cities = new Set();
    safeSellers.forEach(s => {
      if (s.city) cities.add(s.city);
    });
    return cities.size;
  }, [safeSellers]);

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading sellers...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} pb-16`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      <Header
        title="Sellers"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Sellers"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity onPress={toggleViewMode} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name={viewMode === "grid" ? "view-grid" : "view-list"} size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name="refresh" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddSeller} className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30">
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
            placeholder="Search sellers by name, phone, city, or GST..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
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
            <Text className="text-white/80 text-xs">Total Sellers</Text>
            <Text className="text-white text-2xl font-bold">{totalSellersCount}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="account-group" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">All sellers</Text>
            </View>
          </LinearGradient>

          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Due Amount</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹{totalDueAmount.toLocaleString()}</Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-orange-500 mr-1" />
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Pending payments
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
              <Icon name="account" size={20} color="#f97316" />
              <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Active Sellers</Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{totalSellersCount}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Registered</Text>
          </View>
        </View>

        {/* Sort Options */}
        <View className="flex-row px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {[
                { id: "name", label: "Name", icon: "sort-alphabetical-ascending" },
                { id: "city", label: "City", icon: "city" },
                { id: "due", label: "Due Amount", icon: "currency-inr" },
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

        {/* Seller List */}
        <View className="flex-1 px-4 pb-4">
          <SellerList
            sellers={safeSellers}
            viewMode={viewMode}
            sortBy={sortBy}
            loading={loading}
            searchQuery={searchQuery}
            onEdit={handleEditSeller}
            onDelete={handleDeleteClick}
            onRefresh={handleRefresh}
          />

          {/* Loading indicator for infinite scroll */}
          {isFetchingMore && currentPage < lastPage && (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Loading more sellers...
              </Text>
            </View>
          )}

          {/* End of list indicator */}
          {currentPage >= lastPage && safeSellers.length > 0 && (
            <View className="py-4 items-center">
              <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Showing all {safeSellers.length} sellers
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Seller Modal */}
      <Modal visible={showFormModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancelForm}>
        <SellerForm
          seller={selectedSeller}
          onSubmit={handleSubmitSeller}
          onCancel={handleCancelForm}
          isSubmitting={formSubmitting}
          isEdit={isEditing}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Seller"
        message={`Are you sure you want to delete "${sellerToDelete?.name}"? This action cannot be undone.`}
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
    </View>
  );
};

export default SellersScreen;
