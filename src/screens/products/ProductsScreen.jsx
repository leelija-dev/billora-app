// screens/ProductScreen.js
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
      fetchProducts(1);
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
  }, [searchText]);

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
      setErrorMessage("An unexpected error occurred");
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

  // Handle page change
  const handlePageChange = (page) => {
    if (page !== currentPage && page >= 1 && page <= lastPage) {
      setPage(page);
    }
  };

  // Get page numbers for pagination
  const getPageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;

    if (lastPage <= maxVisible) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(lastPage - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= lastPage - 2) {
        start = lastPage - 3;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < lastPage - 1) {
        pages.push("...");
      }

      if (lastPage > 1) {
        pages.push(lastPage);
      }
    }

    return pages;
  }, [currentPage, lastPage]);

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

  // Pagination Component
  const Pagination = () => {
    if (lastPage <= 1) return null;

    return (
      <View
        className={`px-4 pt-2 pb-5 border-t ${
          isDarkMode
            ? "bg-gray-900 border-gray-800"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Info */}
        <View className="flex-row justify-between items-center mb-3">
          <Text
            className={`text-xs ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {(currentPage - 1) * perPage + 1}-
            {Math.min(currentPage * perPage, totalProducts)} of {totalProducts}
          </Text>

          <Text
            className={`text-xs font-medium ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {currentPage} / {lastPage}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row items-center justify-center">
          {/* Previous */}
          <TouchableOpacity
            disabled={currentPage === 1}
            onPress={() => handlePageChange(currentPage - 1)}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              currentPage === 1
                ? "opacity-40"
                : isDarkMode
                  ? "bg-gray-800"
                  : "bg-gray-100"
            }`}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={isDarkMode ? "#fff" : "#374151"}
            />
          </TouchableOpacity>

          {/* Pages */}
          <View className="flex-row mx-3">
            {getPageNumbers.map((page, index) => {
              if (page === "...") {
                return (
                  <View
                    key={index}
                    className="w-10 items-center justify-center"
                  >
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      •••
                    </Text>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePageChange(page)}
                  className={`w-11 h-11 rounded-xl mx-1 items-center justify-center ${
                    page === currentPage
                      ? "bg-blue-600"
                      : isDarkMode
                        ? "bg-gray-800"
                        : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      page === currentPage
                        ? "text-white"
                        : isDarkMode
                          ? "text-gray-300"
                          : "text-gray-700"
                    }`}
                  >
                    {page}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Next */}
          <TouchableOpacity
            disabled={currentPage === lastPage}
            onPress={() => handlePageChange(currentPage + 1)}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              currentPage === lastPage
                ? "opacity-40"
                : isDarkMode
                  ? "bg-gray-800"
                  : "bg-gray-100"
            }`}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={isDarkMode ? "#fff" : "#374151"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
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

  // Product Detail Modal
  const ProductDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className={`rounded-t-3xl max-h-[80%] ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <View className="items-center pt-2">
            <View
              className={`w-12 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}
            />
          </View>

          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            {selectedProduct && (
              <>
                <View className="flex-row justify-between items-start mb-4">
                  <Text
                    className={`text-2xl font-bold flex-1 mr-2 ${isDarkMode ? "text-white" : "text-gray-800"}`}
                  >
                    {selectedProduct.name || "Unnamed Product"}
                  </Text>
                  <View
                    className={`px-3 py-1 rounded-full ${selectedProduct.is_active ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                  >
                    <Text
                      className={`text-xs font-medium ${selectedProduct.is_active ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                    >
                      {selectedProduct.is_active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>

                <View
                  className={`rounded-xl p-4 mb-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                >
                  <View className="flex-row justify-between mb-2">
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      SKU
                    </Text>
                    <Text
                      className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {selectedProduct.sku || "N/A"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Category
                    </Text>
                    <Text
                      className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {selectedProduct.category?.name || "N/A"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Brand
                    </Text>
                    <Text
                      className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {selectedProduct.brand?.name || "N/A"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Unit
                    </Text>
                    <Text
                      className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {selectedProduct.unit?.name || "N/A"}
                    </Text>
                  </View>
                </View>

                <View
                  className={`rounded-xl p-4 mb-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                >
                  <Text
                    className={`text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Pricing
                  </Text>
                  <View className="flex-row justify-between mb-1.5">
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Selling Price
                    </Text>
                    <Text
                      className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                    >
                      ₹{formatPrice(selectedProduct.selling_price)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-1.5">
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Purchase Price
                    </Text>
                    <Text
                      className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                    >
                      ₹{formatPrice(selectedProduct.purchase_price)}
                    </Text>
                  </View>
                  {selectedProduct.mrp && (
                    <View className="flex-row justify-between mb-1.5">
                      <Text
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        MRP
                      </Text>
                      <Text
                        className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                      >
                        ₹{formatPrice(selectedProduct.mrp)}
                      </Text>
                    </View>
                  )}
                  {selectedProduct.gst_percentage && (
                    <View className="flex-row justify-between">
                      <Text
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        GST
                      </Text>
                      <Text
                        className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                      >
                        {selectedProduct.gst_percentage}%
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  className={`rounded-xl p-4 mb-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                >
                  <Text
                    className={`text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Stock Information
                  </Text>
                  <View className="flex-row justify-between mb-1.5">
                    <Text
                      className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Total Stock
                    </Text>
                    <Text
                      className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {getProductTotalStock(selectedProduct)}
                    </Text>
                  </View>
                  {selectedProduct.minimum_stock_quantity && (
                    <View className="flex-row justify-between mb-1.5">
                      <Text
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Min Stock Level
                      </Text>
                      <Text
                        className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                      >
                        {selectedProduct.minimum_stock_quantity}
                      </Text>
                    </View>
                  )}
                  {selectedProduct.maximum_stock_quantity && (
                    <View className="flex-row justify-between">
                      <Text
                        className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Max Stock Level
                      </Text>
                      <Text
                        className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                      >
                        {selectedProduct.maximum_stock_quantity}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedProduct.description && (
                  <View
                    className={`rounded-xl p-4 mb-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}
                  >
                    <Text
                      className={`text-sm font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Description
                    </Text>
                    <Text
                      className={`text-sm leading-5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {selectedProduct.description}
                    </Text>
                  </View>
                )}

                <View className="flex-row space-x-3 mt-2">
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      handleEditProduct(selectedProduct);
                    }}
                    className="flex-1 bg-blue-500 py-3 rounded-xl"
                  >
                    <Text className="text-white font-semibold text-center">
                      Edit Product
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      handleDeleteProduct(selectedProduct.id);
                    }}
                    className="flex-1 bg-red-500 py-3 rounded-xl"
                  >
                    <Text className="text-white font-semibold text-center">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <Text
              className={`text-center font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Filter Modal
  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}
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
            className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-800"}`}
          >
            Filter Products
          </Text>

          <View className="mb-6">
            <Text
              className={`text-sm font-medium mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
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
            onPress={() => {
              setFilterModalVisible(false);
              setSelectedStatus("all");
              setFilters({});
            }}
            className={`py-3 rounded-xl mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
          >
            <Text
              className={`text-center font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              Reset Filters
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(false)}
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

  // Show loading state
  if (loading && products.length === 0) {
    return (
      <View
        className={`flex-1 items-center justify-center ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text
          className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
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

      {/* Product List with RefreshControl */}
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
          isPaginating={loading && products.length > 0}
        />
      </ScrollView>

      {/* Pagination - Fixed at bottom */}
      <Pagination />

      {/* Modals */}
      <ProductDetailModal />
      <FilterModal />

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

export default ProductScreen;
