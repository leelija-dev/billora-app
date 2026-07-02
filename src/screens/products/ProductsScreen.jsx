// screens/ProductScreen.js - OPTIMIZED VERSION
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  ErrorModal,
  SuccessModal,
} from "../../components/common/CustomModal";
import Header from "../../components/common/Header";
import StatsCard from "../../components/dashboard/StatsCard";
import ProductList from "../../components/products/ProductList";
import { useAuthStore } from "../../store/authStore";
import { usePermissionStore } from "../../store/permissionStore";
import { useProductStore } from "../../store/productStore";
import { useThemeStore } from "../../store/themeStore";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const { width } = Dimensions.get("window");

const ProductScreen = ({ navigation }) => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  const {
    products,
    loading,
    error,
    totalProducts,
    currentPage,
    lastPage,
    perPage,
    pagination,
    filters,
    fetchProducts,
    fetchProductsByUrl,
    setFilters,
    setPage,
    deleteProduct,
    getProductTotalStock,
  } = useProductStore();

  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showStats, setShowStats] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Modal states
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Load products on mount
  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      fetchProducts(1).finally(() => {
        setInitialLoading(false);
      });
      return () => {};
    }, []),
  );

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText !== filters.search) {
        setFilters({ search: searchText });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, filters.search, setFilters]);

  // Calculate product statistics
  const productStats = useMemo(() => {
    const total = products.length;
    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let active = 0;
    let inactive = 0;

    products.forEach((product) => {
      const stock = getProductTotalStock(product);
      totalStock += stock;

      if (stock === 0) {
        outOfStock++;
      } else {
        const minStock = parseFloat(
          product.minimum_stock_quantity || product.reorder_level || 10,
        );
        if (stock <= minStock) {
          lowStock++;
        }
      }

      if (product.is_active) {
        active++;
      } else {
        inactive++;
      }
    });

    return {
      totalProducts: total,
      totalStock,
      lowStock,
      outOfStock,
      activeProducts: active,
      inactiveProducts: inactive,
      inStock: total - lowStock - outOfStock,
    };
  }, [products, getProductTotalStock]);

  // Get filtered products based on status
  const getFilteredProducts = useMemo(() => {
    if (selectedStatus === "all") return products;
    if (selectedStatus === "active")
      return products.filter((p) => p.is_active === 1 || p.is_active === true);
    if (selectedStatus === "inactive")
      return products.filter((p) => p.is_active === 0 || p.is_active === false);
    return products;
  }, [products, selectedStatus]);

  // Helper function to format price
  const formatPrice = (price) => {
    if (price === null || price === undefined) return "0.00";
    const num = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts(1, true);
    setRefreshing(false);
  }, [fetchProducts]);

  // Load more products for infinite scroll
  const loadMoreProducts = useCallback(async () => {
    if (currentPage < lastPage && !loading) {
      const nextPage = currentPage + 1;
      await fetchProducts(nextPage, false, true);
    }
  }, [currentPage, lastPage, loading, fetchProducts]);

  // Infinite scroll hook
  const { handleScroll, isFetchingMore } = useInfiniteScroll(loadMoreProducts, {
    threshold: 1500,
    hasMore: currentPage < lastPage,
    loading: loading,
  });

  // Navigate to create product
  const handleCreateProduct = () => {
    navigation.navigate("AddProduct", { mode: "create" });
  };

  // Navigate to edit product
  const handleEditProduct = (product) => {
    navigation.navigate("AddProduct", {
      mode: "edit",
      productId: product.id,
      product: product,
    });
  };

  // Navigate to deleted products
  const handleViewDeletedProducts = () => {
    navigation.navigate("DeletedProduct");
  };

  // Handle product deletion with confirmation modal
  const handleDeleteProduct = (productId) => {
    setDeleteConfirmId(productId);
    setConfirmationModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(deleteConfirmId);
      if (result.success) {
        setSuccessMessage("Product deleted successfully");
        setSuccessModalVisible(true);
        await fetchProducts(currentPage, true);
      } else {
        setErrorMessage(result.error || "Failed to delete product");
        setErrorModalVisible(true);
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred");
      setErrorModalVisible(true);
    } finally {
      setIsDeleting(false);
      setConfirmationModalVisible(false);
      setDeleteConfirmId(null);
    }
  };

  // Handle stock update
  const handleStockUpdate = async () => {
    await fetchProducts(currentPage, true);
  };


  // Handle view mode toggle
  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Toggle stats visibility
  const toggleStats = () => {
    setShowStats(!showStats);
  };

  // Handle product view (navigate to detail)
  const handleProductView = (product) => {
    navigation.navigate("ProductDetail", { productId: product.id });
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(1, true);
    setRefreshing(false);
  };


  // Updated Stats Section using StatsCard component
  const StatsSection = () => {
    if (!showStats) return null;

    const statsData = [
      {
        id: 1,
        title: "Total Products",
        value: productStats.totalProducts,
        icon: "package-variant",
        color: "#4F46E5",
        trend: 12,
        onPress: () => console.log("Total Products clicked"),
      },
      {
        id: 2,
        title: "Total Stock",
        value: productStats.totalStock,
        icon: "warehouse",
        color: "#10B981",
        trend: 8,
        onPress: () => console.log("Total Stock clicked"),
      },
      {
        id: 3,
        title: "In Stock",
        value: productStats.inStock,
        icon: "check-circle",
        color: "#2563EB",
        trend: 5,
        onPress: () => console.log("In Stock clicked"),
      },
      {
        id: 4,
        title: "Low Stock",
        value: productStats.lowStock,
        icon: "alert",
        color: "#F59E0B",
        trend: -3,
        onPress: () => console.log("Low Stock clicked"),
      },
      {
        id: 5,
        title: "Out of Stock",
        value: productStats.outOfStock,
        icon: "close-circle",
        color: "#EF4444",
        trend: 2,
        onPress: () => console.log("Out of Stock clicked"),
      },
      {
        id: 6,
        title: "Active Products",
        value: productStats.activeProducts,
        icon: "check-decagram",
        color: "#8B5CF6",
        trend: 10,
        onPress: () => console.log("Active Products clicked"),
      },
    ];

    return (
      <View
        className={`px-4 py-4 border-b ${
          isDarkMode
            ? "bg-gray-900 border-gray-800"
            : "bg-gray-50 border-gray-100"
        }`}
      >
        <View className="flex-row flex-wrap justify-between">
          {statsData.map((item) => (
            <View key={item.id} className="w-[48%] mb-3">
              <StatsCard
                title={item.title}
                value={item.value}
                icon={item.icon}
                color={item.color}
                trend={item.trend}
                onPress={item.onPress}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"}
      />

      {/* Header with rightComponent */}
      <Header
        title="Products"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Products"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            {/* Refresh Button */}
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={loading}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Icon
                name="refresh"
                size={20}
                color={
                  loading
                    ? isDarkMode
                      ? "#4B5563"
                      : "#9CA3AF"
                    : isDarkMode
                      ? "#9CA3AF"
                      : "#4b5563"
                }
              />
            </TouchableOpacity>

            {/* Deleted Products Icon */}
            <TouchableOpacity
              onPress={handleViewDeletedProducts}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Icon
                name="delete-outline"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>

            {/* Layout Toggle */}
            <TouchableOpacity
              onPress={toggleViewMode}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Icon
                name={viewMode === "grid" ? "view-list" : "view-grid"}
                size={22}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>

            {/* Add Button */}
            <TouchableOpacity
              onPress={handleCreateProduct}
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30"
            >
              <Icon name="plus" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Stats Toggle Button */}
      <TouchableOpacity
        onPress={toggleStats}
        className={`px-4 py-3 flex-row items-center justify-between ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <View className="flex-row items-center">
          <Icon
            name="chart-bar"
            size={20}
            color={isDarkMode ? "#9CA3AF" : "#6B7280"}
          />
          <Text
            className={`text-sm font-medium ml-2 ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {showStats ? "Hide Statistics" : "Show Statistics"}
          </Text>
        </View>
        <Icon
          name={showStats ? "chevron-up" : "chevron-down"}
          size={22}
          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
        />
      </TouchableOpacity>

      {/* Stats Section */}
      <StatsSection />

      {/* Search & Actions */}
      <View
        className={`px-4 py-3 border-b ${
          isDarkMode
            ? "bg-gray-900 border-gray-800"
            : "bg-white border-gray-100"
        }`}
      >
        <View className="flex-row items-center">
          {/* Search */}
          <View
            className={`flex-1 flex-row items-center h-12 rounded-2xl px-4 mr-3 border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={isDarkMode ? "#9CA3AF" : "#6B7280"}
            />

            <TextInput
              className={`flex-1 ml-3 text-[15px] ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
              placeholder="Search products..."
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={searchText}
              onChangeText={setSearchText}
              clearButtonMode="while-editing"
            />

            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter */}
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            className={`w-12 h-12 rounded-2xl items-center justify-center ${
              isDarkMode
                ? "bg-gray-800 border border-gray-700"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={isDarkMode ? "#F9FAFB" : "#374151"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Product List with RefreshControl and Infinite Scroll */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor={isDarkMode ? "#F9FAFB" : "#3B82F6"}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        <ProductList
          viewMode={viewMode}
          searchQuery={searchText}
          category="all"
          products={getFilteredProducts}
          loading={loading}
          onView={handleProductView}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onStockUpdate={handleStockUpdate}
          navigation={navigation}
        />


        {/* End of list indicator */}
        {currentPage >= lastPage && products.length > 0 && (
          <View className="py-4 items-center">
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Showing all {products.length} products
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        isDarkMode={isDarkMode}
        onApply={() => setFilterModalVisible(false)}
        onReset={() => {
          setSelectedStatus("all");
          setFilters({});
          setFilterModalVisible(false);
        }}
      />

      {/* Custom Modals for Feedback */}
      <SuccessModal
        visible={successModalVisible}
        message={successMessage}
        onClose={() => setSuccessModalVisible(false)}
        autoClose={true}
        autoCloseDelay={2500}
      />

      <ErrorModal
        visible={errorModalVisible}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />

      <ConfirmationModal
        visible={confirmationModalVisible}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmationModalVisible(false);
          setDeleteConfirmId(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={isDeleting}
      />
    </View>
  );
};

// Filter Modal Component - Extracted for cleaner code
const FilterModal = ({
  visible,
  onClose,
  selectedStatus,
  setSelectedStatus,
  isDarkMode,
  onApply,
  onReset,
}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View className="flex-1 bg-black/50 justify-end">
      <View
        className={`rounded-t-3xl p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <View className="items-center mb-4">
          <View
            className={`w-12 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}
          />
        </View>

        <Text
          className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
        >
          Filter Products
        </Text>

        <View className="mb-6">
          <Text
            className={`text-sm font-medium mb-3 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
          >
            Status
          </Text>
          <View className="flex-row flex-wrap">
            {["all", "active", "inactive"].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                  selectedStatus === status
                    ? "bg-blue-500"
                    : isDarkMode
                      ? "bg-gray-700"
                      : "bg-gray-100"
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedStatus === status
                      ? "text-white"
                      : isDarkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={onReset}
          className={`py-3 rounded-xl mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
        >
          <Text
            className={`text-center font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Reset Filters
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onApply}
          className="bg-blue-500 py-3 rounded-xl"
        >
          <Text className="text-center text-white font-semibold">
            Apply Filters
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default ProductScreen;
