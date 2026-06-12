// screens/products/ProductsScreen.js
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
import Header from "../../components/common/Header";
import ProductFilters from "../../components/products/ProductFilters";
import ProductList from "../../components/products/ProductList";
import { SuccessModal, ConfirmationModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useProductStore from "../../store/productStore";
import useCategoryStore from "../../store/categoryStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";

const ProductsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  // Get product store state and actions
  const {
    products = [],
    totalProducts,
    loading,
    filters,
    fetchProducts,
    deleteProduct,
    setFilters,
    setPage,
    currentPage,
    lastPage,
  } = useProductStore();

  // Get categories for filter
  const { categories = [], fetchCategories } = useCategoryStore();

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

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
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        if (isMounted.current) setInitialLoading(false);
      }
    };
    loadInitialData();

    return () => {
      isMounted.current = false;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

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
    // Force refresh when screen comes into focus
    fetchProducts(currentPage, true);
    return () => {};
  }, [])
);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    navigation.navigate("AddProduct", {});
  };

  const handleEditProduct = (product) => {
    navigation.navigate("AddProduct", { productId: product.id, product });
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      await fetchProducts();
      setSuccessMessage("Product deleted successfully");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error("Delete error:", error);
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
    setFilters({ search: "", category_id: null, brand_id: null, status: "all", sortBy: "name", sortOrder: "asc" });
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
  const safeProducts = Array.isArray(products) ? products : [];
  const productCount = totalProducts || safeProducts.length;
  const lowStockCount = safeProducts.filter(p => (p.current_stock || 0) <= (p.minimum_stock_quantity || 10) && (p.current_stock || 0) > 0).length;
  const outOfStockCount = safeProducts.filter(p => (p.current_stock || 0) === 0).length;

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} pb-16`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      <Header
        title="Products"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Products"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity onPress={toggleViewMode} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name={viewMode === "grid" ? "view-grid" : "view-list"} size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name="refresh" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddProduct} className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30">
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
            placeholder="Search products by name, SKU..."
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
            {(filters.status !== "all" || filters.category_id) && (
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
            <Text className="text-white/80 text-xs">Total Products</Text>
            <Text className="text-white text-2xl font-bold">{productCount}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="package-variant" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">All products</Text>
            </View>
          </LinearGradient>

          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Low Stock</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{lowStockCount}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="alert" size={16} color="#F59E0B" />
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} ml-1`}>Needs attention</Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Out of Stock</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{outOfStockCount}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Currently unavailable</Text>
          </View>

          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Categories</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{categories?.length || 0}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Product categories</Text>
          </View>
        </View>

        {/* Filter Chips */}
        {(filters.status !== "all" || filters.category_id || filters.brand_id) && (
          <View className="px-4 mb-3 flex-row flex-wrap">
            {filters.status !== "all" && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Status: {filters.status}</Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, status: "all" })} className="ml-2">
                  <Icon name="close" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            )}
            {filters.category_id && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Category ID: {filters.category_id}</Text>
                <TouchableOpacity onPress={() => setFilters({ ...filters, category_id: null })} className="ml-2">
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
              {["name", "price", "stock", "date"].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setSortBy(option)}
                  className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${sortBy === option ? "bg-blue-500 border-blue-500" : isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <Icon name={option === "name" ? "sort-alphabetical-ascending" : option === "price" ? "currency-usd" : option === "stock" ? "package-variant" : "calendar"} size={16} color={sortBy === option ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"} />
                  <Text className={`ml-2 text-sm capitalize ${sortBy === option ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Product List */}
        <View className="flex-1 px-4 pb-4">
          <ProductList
            products={safeProducts}
            viewMode={viewMode}
            loading={loading}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
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
      <ProductFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={filters}
        categories={categories}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

export default ProductsScreen;