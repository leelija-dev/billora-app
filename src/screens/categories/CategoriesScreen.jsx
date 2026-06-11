// screens/categories/CategoriesScreen.js
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
import CategoryList from "../../components/categories/CategoryList";
import Header from "../../components/common/Header";
import { SuccessModal, ConfirmationModal } from "../../components/common/CustomModal";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems";
import { useAuthStore } from "../../store/authStore";
import useCategoryStore from "../../store/categoryStore";
import { useThemeStore } from "../../store/themeStore";

const CategoriesScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const {
    categories = [],
    totalCategories,
    loading,
    filters,
    fetchCategories,
    deleteCategory,
    setFilters,
  } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const searchTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  const getUserId = useCallback(() => (user && user.id) ? user.id.toString() : "1", [user]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchCategories();
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        if (isMounted.current) setInitialLoading(false);
      }
    };
    loadInitialData();
    return () => { isMounted.current = false; if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [fetchCategories, getUserId]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setFilters({ search: searchQuery }), 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, setFilters]);

  useFocusEffect(useCallback(() => { handleRefresh(); return () => {}; }, []));

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const handleAddCategory = () => navigation.navigate("AddCategory", {});
  const handleEditCategory = (category) => navigation.navigate("AddCategory", { categoryId: category.id, category });

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
      await fetchCategories();
      setSuccessMessage("Category deleted successfully");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = (query) => setSearchQuery(query);
  const toggleViewMode = () => setViewMode(viewMode === "grid" ? "list" : "grid");

  const safeCategories = Array.isArray(categories) ? categories : [];
  const totalCategoriesCount = totalCategories || safeCategories.length;
  const activeCategories = safeCategories.filter(c => c.is_active === true || c.is_active === 1).length;

  const latestUpdate = useMemo(() => {
    if (safeCategories.length === 0) return "N/A";
    const dates = safeCategories.map(c => c.updated_at ? new Date(c.updated_at).getTime() : 0);
    return new Date(Math.max(...dates)).toLocaleDateString();
  }, [safeCategories]);

  const uniqueCreators = useMemo(() => {
    const creators = new Set();
    safeCategories.forEach(c => creators.add(c.created_by || `User ${c.user_id}`));
    return creators.size;
  }, [safeCategories]);

  const navigationItems = useMemo(() => {
    const badges = { categories: totalCategoriesCount.toString() };
    return getNavigationItemsWithBadges(badges);
  }, [totalCategoriesCount]);

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} pb-16`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      <Header
        title="Categories"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Categories"
        navigationItems={navigationItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity onPress={toggleViewMode} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name={viewMode === "grid" ? "view-grid" : "view-list"} size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name="refresh" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddCategory} className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30">
              <Icon name="plus" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`} placeholder="Search categories by name, description..." placeholderTextColor="#9ca3af" value={searchQuery} onChangeText={handleSearch} />
          {searchQuery.length > 0 && (<TouchableOpacity onPress={() => handleSearch("")}><Icon name="close-circle" size={20} color="#9ca3af" /></TouchableOpacity>)}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3b82f6"]} tintColor={isDarkMode ? "#ffffff" : "#3b82f6"} />}>
        <View className="flex-row flex-wrap px-4 py-3">
          <LinearGradient colors={["#10b981", "#047857"]} className="rounded-xl p-4 flex-1 mr-2" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text className="text-white/80 text-xs">Total Categories</Text>
            <Text className="text-white text-2xl font-bold">{totalCategoriesCount}</Text>
            <View className="flex-row items-center mt-1"><Icon name="shape" size={16} color="#86efac" /><Text className="text-white/80 text-xs ml-1">All categories</Text></View>
          </LinearGradient>
          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Active Categories</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{activeCategories}</Text>
            <View className="flex-row items-center mt-1"><View className="w-2 h-2 rounded-full bg-green-500 mr-1" /><Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{totalCategoriesCount > 0 ? ((activeCategories / totalCategoriesCount) * 100).toFixed(0) : 0}% active</Text></View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center"><Icon name="account" size={20} color="#8b5cf6" /><Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Creators</Text></View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{uniqueCreators}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Unique users</Text>
          </View>
          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center"><Icon name="calendar" size={20} color="#f97316" /><Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Latest Update</Text></View>
            <Text className={`text-sm font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`} numberOfLines={1}>{latestUpdate}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Recent activity</Text>
          </View>
        </View>

        {/* Sort Options */}
        <View className="flex-row px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {[
                { id: "name", label: "Name", icon: "sort-alphabetical-ascending" },
                { id: "date", label: "Date", icon: "calendar" },
                { id: "status", label: "Status", icon: "checkbox-marked-circle-outline" },
              ].map((option) => (
                <TouchableOpacity key={option.id} onPress={() => setSortBy(option.id)} className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${sortBy === option.id ? "bg-blue-500 border-blue-500" : isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <Icon name={option.icon} size={16} color={sortBy === option.id ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"} />
                  <Text className={`ml-2 text-sm ${sortBy === option.id ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="flex-1 px-4 pb-4">
          <CategoryList categories={safeCategories} viewMode={viewMode} sortBy={sortBy} loading={loading} onEdit={handleEditCategory} onDelete={handleDeleteCategory} />
        </View>
      </ScrollView>

      <ConfirmationModal visible={showDeleteConfirm} title="Delete Category" message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`} onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirm(false)} confirmText="Delete" cancelText="Cancel" confirmButtonColor="#ef4444" loading={deleting} />
      <SuccessModal visible={showSuccessModal} message={successMessage} onClose={() => setShowSuccessModal(false)} autoClose={true} autoCloseDelay={2000} />
    </View>
  );
};

export default CategoriesScreen;