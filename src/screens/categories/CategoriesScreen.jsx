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
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

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
    filters,
    currentPage,
    lastPage,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setFilters,
  } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  
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

  // Load more categories function for infinite scroll
  const loadMoreCategories = useCallback(async () => {
    if (currentPage < lastPage && !loading) {
      await fetchCategories(currentPage + 1, false, true);
    }
  }, [currentPage, lastPage, loading, fetchCategories]);

  // Infinite scroll hook
  const { handleScroll, isFetchingMore } = useInfiniteScroll(loadMoreCategories, {
    threshold: 500,
    hasMore: currentPage < lastPage,
    loading: loading,
  });

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

  // Get stats for display
  const displayStats = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const total = totalCategories || safeCategories.length;
    const active = safeCategories.filter(c => c.is_active === true || c.is_active === 1).length;
    const inactive = total - active;
    
    // Calculate unique creators
    const creators = new Set();
    safeCategories.forEach(c => creators.add(c.created_by || c.user_id));
    const uniqueCreators = creators.size;
    
    // Get latest update date
    let latestUpdate = "N/A";
    if (safeCategories.length > 0) {
      const dates = safeCategories.map(c => c.updated_at ? new Date(c.updated_at).getTime() : 0);
      const maxDate = Math.max(...dates);
      if (maxDate > 0) {
        latestUpdate = new Date(maxDate).toLocaleDateString();
      }
    }
    
    // Calculate average products per category (if you have product count)
    const avgProducts = safeCategories.reduce((sum, c) => sum + (c.products_count || 0), 0) / (total || 1);
    
    // Example trends (you would calculate these based on previous period data)
    const totalTrend = null;
    const activeTrend = null;
    const creatorsTrend = null;

    return {
      total,
      active,
      inactive,
      uniqueCreators,
      latestUpdate,
      avgProducts,
      totalTrend,
      activeTrend,
      creatorsTrend,
      activePercentage: total > 0 ? (active / total) * 100 : 0,
    };
  }, [categories, totalCategories]);

  // Initial data load
  useFocusEffect(
    useCallback(() => {
      const loadInitialData = async () => {
        try {
          await fetchCategories(1, false, false);
        } catch (error) {
          console.error("Failed to fetch categories:", error);
        }
      };
      loadInitialData();
      return () => {
        isMounted.current = false;
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      };
    }, [fetchCategories])
  );

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setFilters({ search: searchQuery }), 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, setFilters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCategories(1, true, false);
    setRefreshing(false);
  };

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
      await fetchCategories(1, true, false);
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
      await fetchCategories(1, true, false);
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
        showsVerticalScrollIndicator={false} 
        onScroll={handleScroll}
        scrollEventThrottle={400}
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

        {/* Stats Cards - Using StatsCard component like CustomersScreen */}
        <View className="flex-row flex-wrap gap-3 px-4">
          <StatsCard
            title="Total Categories"
            value={displayStats.total}
            icon="shape"
            color="#10b981"
            trend={displayStats.totalTrend}
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Active Categories"
            value={displayStats.active}
            icon="check-circle"
            color="#3b82f6"
            trend={displayStats.activeTrend}
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Active Rate"
            value={`${displayStats.activePercentage.toFixed(0)}%`}
            icon="percent"
            color="#8b5cf6"
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Creators"
            value={displayStats.uniqueCreators}
            icon="account-group"
            color="#f59e0b"
            trend={displayStats.creatorsTrend}
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
                {displayStats.latestUpdate}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Icon name="chart-line" size={18} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <Text className={`ml-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Avg Products: 
              </Text>
              <Text className={`ml-2 text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {displayStats.avgProducts.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

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

        {/* Category List */}
        <View className="px-4 pb-24">
          <CategoryList 
            categories={categories} 
            viewMode={viewMode} 
            sortBy={sortBy} 
            loading={loading} 
            onEdit={handleEditCategory} 
            onDelete={handleDeleteCategory} 
          />
        </View>

        {/* End of list indicator */}
        {currentPage >= lastPage && categories.length > 0 && (
          <View className="py-4 items-center">
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Showing all {categories.length} categories
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