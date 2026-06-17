// screens/products/ProductsScreen.js
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  ConfirmationModal,
  SuccessModal,
} from "../../components/common/CustomModal";
import Header from "../../components/common/Header";
import StatsCard from "../../components/dashboard/StatsCard";
import ProductFilters from "../../components/products/ProductFilters";
import ProductList from "../../components/products/ProductList";
import { useAuthStore } from "../../store/authStore";
import useCategoryStore from "../../store/categoryStore";
import { usePermissionStore } from "../../store/permissionStore";
import useProductStore from "../../store/productStore";
import { useThemeStore } from "../../store/themeStore";

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
    fetchProductsByUrl,
    deleteProduct,
    setFilters,
    setPage,
    currentPage,
    lastPage,
    pagination,
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
  const isInitialMount = useRef(true);

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

  // Get stats for display
  const displayStats = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];
    const total = totalProducts || safeProducts.length;
    const lowStock = safeProducts.filter(
      (p) =>
        (p.current_stock || 0) <= (p.minimum_stock_quantity || 10) &&
        (p.current_stock || 0) > 0,
    ).length;
    const outOfStock = safeProducts.filter(
      (p) => (p.current_stock || 0) === 0,
    ).length;
    const inStock = total - lowStock - outOfStock;
    const categoriesCount = categories?.length || 0;

    // Calculate total stock value (if products have price)
    const totalStockValue = safeProducts.reduce(
      (sum, p) => sum + (p.current_stock || 0) * (p.selling_price || 0),
      0,
    );

    // Calculate average stock per product
    const avgStock =
      total > 0
        ? safeProducts.reduce((sum, p) => sum + (p.current_stock || 0), 0) /
          total
        : 0;

    // Calculate stock health percentage
    const stockHealth = total > 0 ? (inStock / total) * 100 : 0;

    return {
      total,
      lowStock,
      outOfStock,
      inStock,
      categoriesCount,
      totalStockValue,
      avgStock,
      stockHealth,
      totalTrend: null,
      lowStockTrend: null,
      stockHealthTrend: null,
    };
  }, [products, totalProducts, categories]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([fetchProducts(1), fetchCategories()]);
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
      // Skip fetch on initial mount to avoid duplicate API calls
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      // Force refresh when screen comes into focus
      fetchProducts(currentPage, true);
      return () => {};
    }, []),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(currentPage, true);
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    navigation.navigate("AddProduct", {});
  };

  const handleDeletedProducts = () => {
    navigation.navigate("DeletedProduct");
  };

  const handleEditProduct = (product) => {
    navigation.navigate("AddProduct", { productId: product.id, product });
  };

  const handleDeleteProduct = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setProductToDelete(product);
      setShowDeleteConfirm(true);
    } else {
      console.error("Product not found:", productId);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      await fetchProducts(currentPage, true);
      setSuccessMessage("Product deleted successfully");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error("Delete error:", error);
      setSuccessMessage("Failed to delete product");
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
    setFilters({
      search: "",
      category_id: null,
      brand_id: null,
      status: "all",
      sortBy: "name",
      sortOrder: "asc",
    });
    setSearchQuery("");
    setSortBy("name");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Handle page change
  const handlePageChange = (page) => {
    setPage(page);
  };

  // Get pagination URL for page
  const getPageUrl = (page) => {
    if (!pagination?.first_page_url) return null;
    const baseUrl = pagination.first_page_url.split('?')[0];
    const searchParams = new URLSearchParams(pagination.first_page_url.split('?')[1] || '');
    searchParams.set('page', page);
    return `${baseUrl}?${searchParams.toString()}`;
  };

  if (initialLoading) {
    return (
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text
          className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          Loading products...
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
        title="Products"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Products"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleDeletedProducts}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon
                name="delete"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleViewMode}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon
                name={viewMode === "grid" ? "view-grid" : "view-list"}
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefresh}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon
                name="refresh"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddProduct}
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md"
              style={{ elevation: 4 }}
            >
              <Icon name="plus" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View
          className={`flex-row items-center rounded-2xl px-4 h-12 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <Icon name="magnify" size={20} color="#9ca3af" />
          <TextInput
            className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
            placeholder="Search products by name, SKU..."
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
            {(filters.status !== "all" || filters.category_id) && (
              <View className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3b82f6"]}
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          />
        }
      >
        {/* Stats Cards */}
        <View className="flex-row flex-wrap gap-3 px-4">
          <StatsCard
            title="Total Products"
            value={displayStats.total}
            icon="package-variant"
            color="#3b82f6"
            trend={displayStats.totalTrend}
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Stock Health"
            value={`${displayStats.stockHealth.toFixed(0)}%`}
            icon="chart-line"
            color="#10b981"
            trend={displayStats.stockHealthTrend}
            style={{ width: "48%" }}
          />

          <StatsCard
            title="In Stock"
            value={displayStats.inStock}
            icon="check-circle"
            color="#22c55e"
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Low Stock"
            value={displayStats.lowStock}
            icon="alert"
            color="#f59e0b"
            trend={displayStats.lowStockTrend}
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Out of Stock"
            value={displayStats.outOfStock}
            icon="package-variant-closed"
            color="#ef4444"
            style={{ width: "48%" }}
          />

          <StatsCard
            title="Categories"
            value={displayStats.categoriesCount}
            icon="shape"
            color="#8b5cf6"
            style={{ width: "48%" }}
          />
        </View>

        {/* Additional Info Row */}
        <View className="px-4 mt-2 mb-3">
          <View
            className={`rounded-xl p-3 flex-row items-center justify-between ${isDarkMode ? "bg-gray-800/50" : "bg-gray-100"}`}
          >
            <View className="flex-row items-center">
              <Icon
                name="cash"
                size={18}
                color={isDarkMode ? "#9CA3AF" : "#6b7280"}
              />
              <Text
                className={`ml-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Total Stock Value:
              </Text>
              <Text
                className={`ml-2 text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                ₹{displayStats.totalStockValue.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Icon
                name="chart-bar"
                size={18}
                color={isDarkMode ? "#9CA3AF" : "#6b7280"}
              />
              <Text
                className={`ml-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                Avg Stock:
              </Text>
              <Text
                className={`ml-2 text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                {displayStats.avgStock.toFixed(1)} units
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Chips */}
        {(filters.status !== "all" ||
          filters.category_id ||
          filters.brand_id) && (
          <View className="px-4 mb-3 flex-row flex-wrap">
            {filters.status !== "all" && (
              <View
                className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
              >
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Status: {filters.status}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, status: "all" })}
                  className="ml-2"
                >
                  <Icon
                    name="close"
                    size={16}
                    color={isDarkMode ? "#9CA3AF" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            )}
            {filters.category_id && (
              <View
                className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
              >
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Category ID: {filters.category_id}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, category_id: null })}
                  className="ml-2"
                >
                  <Icon
                    name="close"
                    size={16}
                    color={isDarkMode ? "#9CA3AF" : "#6b7280"}
                  />
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
                {
                  id: "name",
                  label: "Name",
                  icon: "sort-alphabetical-ascending",
                },
                { id: "price", label: "Price", icon: "currency-usd" },
                { id: "stock", label: "Stock", icon: "package-variant" },
                { id: "date", label: "Date", icon: "calendar" },
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
                    color={
                      sortBy === option.id
                        ? "#ffffff"
                        : isDarkMode
                          ? "#9CA3AF"
                          : "#4b5563"
                    }
                  />
                  <Text
                    className={`ml-2 text-sm font-medium capitalize ${sortBy === option.id ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Product List */}
        <View className="px-4 pb-24">
          <ProductList
            products={products}
            viewMode={viewMode}
            loading={loading}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        </View>

        {/* Pagination - Updated with full navigation */}
        {lastPage > 1 && (
          <View className="px-4 py-2 mb-4 pb-24">
            {/* Debug Info - Remove after confirming pagination works */}
            <View className={`p-2 mb-3 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Page {currentPage} of {lastPage} | Total: {totalProducts}
              </Text>
            </View>

            <View className="flex-row items-center justify-center space-x-2">
              {/* First Page */}
              <TouchableOpacity
                onPress={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`w-10 h-10 rounded-xl items-center justify-center border ${
                  currentPage === 1
                    ? "border-gray-200 dark:border-gray-700 opacity-40"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm"
                }`}
              >
                <Icon
                  name="chevron-double-left"
                  size={20}
                  color={isDarkMode ? "#9CA3AF" : "#4b5563"}
                />
              </TouchableOpacity>

              {/* Previous */}
              <TouchableOpacity
                onPress={() => handlePageChange(currentPage - 1)}
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

              {/* Page Info */}
              <View
                className={`px-4 py-2 rounded-xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
              >
                <Text
                  className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  {currentPage} / {lastPage}
                </Text>
              </View>

              {/* Next */}
              <TouchableOpacity
                onPress={() => handlePageChange(currentPage + 1)}
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

              {/* Last Page */}
              <TouchableOpacity
                onPress={() => handlePageChange(lastPage)}
                disabled={currentPage === lastPage}
                className={`w-10 h-10 rounded-xl items-center justify-center border ${
                  currentPage === lastPage
                    ? "border-gray-200 dark:border-gray-700 opacity-40"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm"
                }`}
              >
                <Icon
                  name="chevron-double-right"
                  size={20}
                  color={isDarkMode ? "#9CA3AF" : "#4b5563"}
                />
              </TouchableOpacity>
            </View>
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