// screens/brands/BrandsScreen.js
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
import BrandFilters from "../../components/brands/BrandFilters";
import BrandList from "../../components/brands/BrandList";
import Header from "../../components/common/Header";
import BrandForm from "../../components/brands/BrandForm";
import { SuccessModal, ConfirmationModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useBrandStore from "../../store/brandStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";

const BrandsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  // Get brand store state and actions
  const {
    brands = [],
    totalBrands,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    lastPage,
    filters,
    fetchBrands,
    loadMoreBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    setFilters,
  } = useBrandStore();

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Infinite scroll states
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Add/Edit Form Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const searchTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Get safe brands array
  const safeBrands = useMemo(() => Array.isArray(brands) ? brands : [], [brands]);

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

  // Reset trigger flag when new data is loaded or when conditions change
  useEffect(() => {
    if (!isLoadingMore && !loadingMore) {
      setHasTriggeredLoadMore(false);
    }
  }, [isLoadingMore, loadingMore]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("🔄 Fetching brands for user:", getUserId());
        await fetchBrands(1, false);
        console.log("✅ Brands fetched successfully");
      } catch (error) {
        console.error("❌ Failed to fetch brands:", error);
      } finally {
        if (isMounted.current) setInitialLoading(false);
      }
    };
    loadInitialData();

    return () => {
      isMounted.current = false;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchBrands, getUserId]);

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
      console.log("Brands screen focused - refreshing data");
      handleRefresh();
      return () => {};
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBrands(1, false);
    setRefreshing(false);
  };

  // ✅ FIXED: Load more handler
  const handleLoadMore = useCallback(async () => {
    // Check if we have more data to load
    const hasMoreData = safeBrands.length < totalBrands;
    
    // Prevent loading if already loading
    if (isLoadingMore || loadingMore || loading) {
      console.log('⏭️ Skipping - already loading');
      return;
    }
    
    if (!hasMoreData || !hasMore) {
      console.log('⏭️ Skipping - no more data');
      return;
    }

    console.log(`📜 Triggering loadMoreBrands - current: ${safeBrands.length}/${totalBrands}, page: ${currentPage}/${lastPage}`);
    setIsLoadingMore(true);
    await loadMoreBrands();
    setIsLoadingMore(false);
    setHasTriggeredLoadMore(false);
  }, [isLoadingMore, loadingMore, loading, safeBrands.length, totalBrands, hasMore, currentPage, lastPage, loadMoreBrands]);

  // ✅ Scroll handler for infinite scroll
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollPosition = contentOffset.y;
    const scrollViewHeight = layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    
    // Calculate scroll percentage
    const maxScroll = totalContentHeight - scrollViewHeight;
    const scrollPercentage = maxScroll > 0 ? (currentScrollPosition / maxScroll) * 100 : 0;
    
    // Check distance from bottom
    const distanceFromBottom = totalContentHeight - currentScrollPosition - scrollViewHeight;
    const isNearBottom = distanceFromBottom < 300;
    
    // Check if we have more data
    const hasMoreData = safeBrands.length < totalBrands && hasMore;
    
    // Trigger when scrolled 50% or near bottom
    if ((scrollPercentage >= 50 || isNearBottom) && 
        !hasTriggeredLoadMore && 
        !isLoadingMore && 
        !loadingMore && 
        hasMoreData && 
        !loading) {
      console.log(`🎯 Triggering load more - scroll: ${Math.floor(scrollPercentage)}%, ${safeBrands.length}/${totalBrands}`);
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, loadingMore, loading, safeBrands.length, totalBrands, hasMore, handleLoadMore]);

  const handleAddBrand = () => {
    setSelectedBrand(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditBrand = (brand) => {
    setSelectedBrand(brand);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleCancelForm = () => {
    setShowFormModal(false);
    setSelectedBrand(null);
    setIsEditing(false);
  };

  const handleSubmitBrand = async (brandData) => {
    setFormSubmitting(true);
    try {
      const userId = getUserId();
      const payload = {
        ...brandData,
        user_id: userId,
        created_by: userId,
      };

      if (isEditing && selectedBrand) {
        const result = await updateBrand(selectedBrand.id, payload);
        if (result) {
          setSuccessMessage("Brand updated successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      } else {
        const result = await createBrand(payload);
        if (result) {
          setSuccessMessage("Brand created successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      }

      handleCancelForm();
      await fetchBrands(1, false);
    } catch (error) {
      console.error("Submit error:", error);
      setSuccessMessage(error.message || "An error occurred");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete brand function
  const handleDeleteBrand = (brand) => {
    setBrandToDelete(brand);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!brandToDelete) return;
    setDeleting(true);
    try {
      await deleteBrand(brandToDelete.id);
      setShowDeleteConfirm(false);
      setBrandToDelete(null);
      await fetchBrands(1, false);
      setSuccessMessage("Brand deleted successfully");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('Delete error:', error);
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
    setFilters({ search: "", status: "all", sortBy: "name", sortOrder: "asc" });
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
  const totalBrandsCount = totalBrands || safeBrands.length;
  const activeBrands = safeBrands.filter(b => b.is_active === true || b.is_active === 1).length;

  const latestUpdate = useMemo(() => {
    if (safeBrands.length === 0) return "N/A";
    const dates = safeBrands.map(b => b.updated_at ? new Date(b.updated_at).getTime() : 0);
    return new Date(Math.max(...dates)).toLocaleDateString();
  }, [safeBrands]);

  const uniqueCreators = useMemo(() => {
    const creators = new Set();
    safeBrands.forEach(b => {
      if (b.created_by) creators.add(b.created_by);
      else if (b.user_id) creators.add(`User ${b.user_id}`);
    });
    return creators.size;
  }, [safeBrands]);

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading brands...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} pb-16`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      <Header
        title="Brands"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Brands"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity onPress={toggleViewMode} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name={viewMode === "grid" ? "view-grid" : "view-list"} size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name="refresh" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddBrand} className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30">
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
            placeholder="Search brands by name, description..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ScrollView with infinite scroll */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={["#3b82f6"]} 
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"} 
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: 20,
          flexGrow: 1,
        }}
      >
        {/* Stats Cards */}
        <View className="flex-row flex-wrap px-4 py-3">
          <LinearGradient colors={["#3b82f6", "#2563eb"]} className="rounded-xl p-4 flex-1 mr-2" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text className="text-white/80 text-xs">Total Brands</Text>
            <Text className="text-white text-2xl font-bold">{totalBrandsCount}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="trademark" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">All brands</Text>
            </View>
          </LinearGradient>

          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Active Brands</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{activeBrands}</Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {totalBrandsCount > 0 ? ((activeBrands / totalBrandsCount) * 100).toFixed(0) : 0}% active
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center">
              <Icon name="account" size={20} color="#8b5cf6" />
              <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Creators</Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{uniqueCreators}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Unique users</Text>
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
        {(filters.status !== "all" || filters.search) && (
          <View className="px-4 mb-3 flex-row flex-wrap">
            {filters.status !== "all" && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Status: {filters.status}</Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, status: "all" })} className="ml-2">
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

        {/* Page Indicator */}
        <View className="px-4 py-2 flex-row justify-between items-center">
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {totalBrands > 0 ? `Showing ${safeBrands.length} of ${totalBrands} brands` : `${safeBrands.length} brands`}
          </Text>
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Page {currentPage}/{lastPage}
          </Text>
        </View>

        {/* Brand List */}
        <View className="flex-1 px-4 pb-4">
          <BrandList
            brands={safeBrands}
            viewMode={viewMode}
            sortBy={sortBy}
            loading={loading && safeBrands.length === 0}
            onEdit={handleEditBrand}
            onDelete={handleDeleteBrand}
          />
        </View>

        {/* Loading More Indicator */}
        {(isLoadingMore || loadingMore) && (
          <View className="py-6 items-center">
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading more brands...
            </Text>
          </View>
        )}

        {/* No More Brands */}
        {!hasMore && safeBrands.length > 0 && safeBrands.length === totalBrands && (
          <View className="py-4 items-center">
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No more brands to load
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Brand Modal */}
      <Modal visible={showFormModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancelForm}>
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <View className={`px-4 pt-12 pb-4 flex-row items-center border-b ${isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
            <TouchableOpacity onPress={handleCancelForm} className="p-2">
              <Icon name="arrow-left" size={24} color={isDarkMode ? "#FFFFFF" : "#1F2937"} />
            </TouchableOpacity>
            <Text className={`flex-1 text-center text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {isEditing ? "Edit Brand" : "Add New Brand"}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView className="flex-1 px-4 pt-4">
            <BrandForm
              initialData={selectedBrand}
              mode={isEditing ? "edit" : "add"}
              onSubmit={handleSubmitBrand}
              onCancel={handleCancelForm}
              isSubmitting={formSubmitting}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Brand"
        message={`Are you sure you want to delete "${brandToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={deleting}
      />

      {/* Success Modal */}
      <SuccessModal visible={showSuccessModal} message={successMessage} onClose={() => setShowSuccessModal(false)} autoClose={true} autoCloseDelay={2000} />

      {/* Filters Modal */}
      <BrandFilters
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

export default BrandsScreen;