// screens/categories/CategoriesScreen.js
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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
import CategoryList from "../../components/categories/CategoryList";
import CategoryForm from "../../components/categories/CategoryForm";
import Header from "../../components/common/Header";
import { SuccessModal, ConfirmationModal } from "../../components/common/CustomModal";
import StatsCard from "../../components/dashboard/StatsCard";
import { useAuthStore } from "../../store/authStore";
import useCategoryStore from "../../store/categoryStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";

const CategoriesScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  // Get category store state and actions
  const {
    categories = [],
    totalCategories,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    lastPage,
    filters,
    fetchCategories,
    loadMoreCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setFilters,
  } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Infinite scroll states
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const searchTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Get safe categories array
  const safeCategories = useMemo(() => Array.isArray(categories) ? categories : [], [categories]);

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
        console.log("🔄 Fetching categories for user:", getUserId());
        await fetchCategories(1, false);
        console.log("✅ Categories fetched successfully");
      } catch (error) {
        console.error("❌ Failed to fetch categories:", error);
      } finally {
        if (isMounted.current) setInitialLoading(false);
      }
    };
    loadInitialData();

    return () => {
      isMounted.current = false;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchCategories, getUserId]);

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
      console.log("Categories screen focused - refreshing data");
      handleRefresh();
      return () => {};
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCategories(1, false);
    setRefreshing(false);
  };

  // ✅ Load more handler
  const handleLoadMore = useCallback(async () => {
    // Check if we have more data to load
    const hasMoreData = safeCategories.length < totalCategories;
    
    // Prevent loading if already loading
    if (isLoadingMore || loadingMore || loading) {
      console.log('⏭️ Skipping - already loading');
      return;
    }
    
    if (!hasMoreData || !hasMore) {
      console.log('⏭️ Skipping - no more data');
      return;
    }

    console.log(`📜 Triggering loadMoreCategories - current: ${safeCategories.length}/${totalCategories}, page: ${currentPage}/${lastPage}`);
    setIsLoadingMore(true);
    await loadMoreCategories();
    setIsLoadingMore(false);
    setHasTriggeredLoadMore(false);
  }, [isLoadingMore, loadingMore, loading, safeCategories.length, totalCategories, hasMore, currentPage, lastPage, loadMoreCategories]);

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
    const hasMoreData = safeCategories.length < totalCategories && hasMore;
    
    // Trigger when scrolled 50% or near bottom
    if ((scrollPercentage >= 50 || isNearBottom) && 
        !hasTriggeredLoadMore && 
        !isLoadingMore && 
        !loadingMore && 
        hasMoreData && 
        !loading) {
      console.log(`🎯 Triggering load more - scroll: ${Math.floor(scrollPercentage)}%, ${safeCategories.length}/${totalCategories}`);
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, loadingMore, loading, safeCategories.length, totalCategories, hasMore, handleLoadMore]);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleCancelForm = () => {
    setShowFormModal(false);
    setSelectedCategory(null);
    setIsEditing(false);
  };

  const handleSubmitCategory = async (categoryData) => {
    setFormSubmitting(true);
    try {
      const userId = getUserId();
      const payload = {
        ...categoryData,
        user_id: userId,
        created_by: userId,
      };

      if (isEditing && selectedCategory) {
        const result = await updateCategory(selectedCategory.id, payload);
        if (result) {
          setSuccessMessage("Category updated successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      } else {
        const result = await createCategory(payload);
        if (result) {
          setSuccessMessage("Category created successfully");
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
        }
      }

      handleCancelForm();
      await fetchCategories(1, false);
    } catch (error) {
      console.error("Submit error:", error);
      setSuccessMessage(error.message || "An error occurred");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      await fetchCategories(1, false);
      setSuccessMessage("Category deleted successfully");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('Delete error:', error);
      setSuccessMessage("Failed to delete category");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (query) => setSearchQuery(query);
  const toggleViewMode = () => setViewMode(viewMode === "grid" ? "list" : "grid");

  // Calculate stats
  const totalCategoriesCount = totalCategories || safeCategories.length;
  const activeCategories = safeCategories.filter(c => c.is_active === true || c.is_active === 1).length;

  const latestUpdate = useMemo(() => {
    if (safeCategories.length === 0) return "N/A";
    const dates = safeCategories.map(c => c.updated_at ? new Date(c.updated_at).getTime() : 0);
    return new Date(Math.max(...dates)).toLocaleDateString();
  }, [safeCategories]);

  const uniqueCreators = useMemo(() => {
    const creators = new Set();
    safeCategories.forEach(c => {
      if (c.created_by) creators.add(c.created_by);
      else if (c.user_id) creators.add(`User ${c.user_id}`);
    });
    return creators.size;
  }, [safeCategories]);

  // Calculate active percentage
  const activePercentage = totalCategoriesCount > 0 ? (activeCategories / totalCategoriesCount) * 100 : 0;

  // Calculate average products per category
  const avgProducts = safeCategories.reduce((sum, c) => sum + (c.products_count || 0), 0) / (totalCategoriesCount || 1);

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      <Header
        title="Categories"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Categories"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={toggleViewMode} 
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon name={viewMode === "grid" ? "view-grid" : "view-list"} size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleRefresh} 
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon name="refresh" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleAddCategory} 
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md"
              style={{ elevation: 4 }}
            >
              <Icon name="plus" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false} 
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={["#3b82f6"]} 
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"} 
          />
        }
        contentContainerStyle={{
          paddingBottom: 20,
          flexGrow: 1,
        }}
      >
        {/* Search Bar */}
        <View className="px-4 pt-4 pb-2">
          <View className={`flex-row items-center rounded-2xl px-4 h-12 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Icon name="magnify" size={20} color="#9ca3af" />
            <TextInput 
              className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`} 
              placeholder="Search categories by name, description..." 
              placeholderTextColor="#9ca3af" 
              value={searchQuery} 
              onChangeText={handleSearch} 
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")}>
                <Icon name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row flex-wrap gap-3 px-4">
          <StatsCard
            title="Total Categories"
            value={totalCategoriesCount}
            icon="shape"
            color="#10b981"
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Active Categories"
            value={activeCategories}
            icon="check-circle"
            color="#3b82f6"
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Active Rate"
            value={`${activePercentage.toFixed(0)}%`}
            icon="percent"
            color="#8b5cf6"
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Creators"
            value={uniqueCreators}
            icon="account-group"
            color="#f59e0b"
            style={{ width: "48%" }}
          />
        </View>

        {/* Additional Info Row - Latest Update */}
        <View className="px-4 mt-2 mb-3">
          <View className={`rounded-xl p-3 flex-row items-center justify-between ${isDarkMode ? "bg-gray-800/50" : "bg-gray-100"}`}>
            <View className="flex-row items-center">
              <Icon name="calendar" size={18} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <Text className={`ml-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Latest Update:
              </Text>
              <Text className={`ml-2 text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {latestUpdate}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Icon name="chart-line" size={18} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <Text className={`ml-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Avg Products: 
              </Text>
              <Text className={`ml-2 text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {avgProducts.toFixed(1)}
              </Text>
            </View>
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
        <View className="px-4 mb-4">
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
                  className={`flex-row items-center mr-2 px-4 py-2.5 rounded-xl border ${
                    sortBy === option.id 
                      ? "bg-blue-500 border-blue-500" 
                      : isDarkMode 
                        ? "bg-gray-800 border-gray-700" 
                        : "bg-white border-gray-200 shadow-sm"
                  }`}
                >
                  <Icon 
                    name={option.icon} 
                    size={16} 
                    color={sortBy === option.id ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"} 
                  />
                  <Text className={`ml-2 text-sm font-medium ${sortBy === option.id ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
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
            {totalCategories > 0 ? `Showing ${safeCategories.length} of ${totalCategories} categories` : `${safeCategories.length} categories`}
          </Text>
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Page {currentPage}/{lastPage}
          </Text>
        </View>

        {/* Category List */}
        <View className="px-4 pb-4">
          <CategoryList 
            categories={safeCategories} 
            viewMode={viewMode} 
            sortBy={sortBy} 
            loading={loading && safeCategories.length === 0} 
            onEdit={handleEditCategory} 
            onDelete={handleDeleteCategory} 
          />
        </View>

        {/* Loading More Indicator */}
        {(isLoadingMore || loadingMore) && (
          <View className="py-6 items-center">
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading more categories...
            </Text>
          </View>
        )}

        {/* No More Categories */}
        {!hasMore && safeCategories.length > 0 && safeCategories.length === totalCategories && (
          <View className="py-4 items-center">
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No more categories to load
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Category Modal */}
      <Modal visible={showFormModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancelForm}>
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <View className={`px-4 pt-12 pb-4 flex-row items-center border-b ${isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
            <TouchableOpacity onPress={handleCancelForm} className="p-2">
              <Icon name="arrow-left" size={24} color={isDarkMode ? "#FFFFFF" : "#1F2937"} />
            </TouchableOpacity>
            <Text className={`flex-1 text-center text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {isEditing ? "Edit Category" : "Add New Category"}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView className="flex-1 px-4 pt-4">
            <CategoryForm
              initialData={selectedCategory}
              mode={isEditing ? "edit" : "add"}
              onSubmit={handleSubmitCategory}
              onCancel={handleCancelForm}
              isSubmitting={formSubmitting}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
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

export default CategoriesScreen;