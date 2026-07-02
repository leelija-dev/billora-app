// components/products/ProductList.js
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { stocksAPI } from "../../api/stocks";
import { useAuthStore } from "../../store/authStore";
import useProductStore from "../../store/productStore";
import { useThemeStore } from "../../store/themeStore";
import ProductCard from "./ProductCard";

const { width } = Dimensions.get("window");

const ProductList = ({
  viewMode = "grid",
  searchQuery = "",
  category = "all",
  products: externalProducts = [],
  loading: externalLoading = false,
  onView,
  onEdit,
  onDelete,
  onStockUpdate,
  navigation,
}) => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getProductTotalStock, getProductStocks, fetchProducts, currentPage } =
    useProductStore();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Stock modal states
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockQuantity, setStockQuantity] = useState("");
  const [addingStock, setAddingStock] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showStockDropdown, setShowStockDropdown] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const products = externalProducts;
  const loading = externalLoading;

  // Helper function to safely get numeric value
  const safeNumber = (value, defaultValue = 0) => {
    const num = typeof value === "number" ? value : parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Helper function to format currency
  const formatCurrency = (value) => {
    const num = safeNumber(value);
    return num.toFixed(2);
  };

  // Filter products based on props
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedFilter === "lowStock") {
      filtered = filtered.filter((p) => {
        const stock = getProductTotalStock(p);
        const minStock = safeNumber(
          p.minimum_stock_quantity || p.reorder_level || 10,
        );
        return stock <= minStock && stock > 0;
      });
    } else if (selectedFilter === "outOfStock") {
      filtered = filtered.filter((p) => getProductTotalStock(p) === 0);
    } else if (selectedFilter === "inStock") {
      filtered = filtered.filter((p) => getProductTotalStock(p) > 0);
    }

    if (category !== "all") {
      filtered = filtered.filter(
        (p) => p.category?.name?.toLowerCase() === category.toLowerCase(),
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.brand?.name?.toLowerCase().includes(query) ||
          p.category?.name?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [products, category, searchQuery, selectedFilter]);

  const stats = useMemo(() => {
    const totalStock = products.reduce(
      (sum, p) => sum + getProductTotalStock(p),
      0,
    );
    const lowStockCount = products.filter((p) => {
      const stock = getProductTotalStock(p);
      const minStock = safeNumber(
        p.minimum_stock_quantity || p.reorder_level || 10,
      );
      return stock <= minStock && stock > 0;
    }).length;
    const outOfStockCount = products.filter(
      (p) => getProductTotalStock(p) === 0,
    ).length;
    const inStockCount = products.length - lowStockCount - outOfStockCount;

    return {
      total: products.length,
      totalStock,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      inStock: inStockCount,
    };
  }, [products]);

  const handleProductPress = (product) => {
    if (onView) {
      onView(product);
    }
  };

  const handleEditProduct = (product) => {
    if (onEdit) {
      onEdit(product);
    }
  };

  const handleDeleteProduct = (productId) => {
    if (onDelete) {
      onDelete(productId);
    }
  };

  const handleAddStock = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
    setStockQuantity("");
    setSelectedStock(null);
    setShowStockDropdown(false);
  };

  const handleSubmitStock = async () => {
    if (!selectedProduct) return;

    const quantity = parseFloat(stockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter a valid quantity",
      });
      return;
    }

    if (!selectedStock) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select a stock",
      });
      return;
    }

    setAddingStock(true);
    try {
      // Use the correct API method - adjust based on your API
      await stocksAPI.addStock(selectedStock.id, user?.id, quantity);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Added ${quantity} ${selectedProduct.unit?.name || "units"} to ${selectedProduct.name}`,
      });

      setShowStockModal(false);
      setStockQuantity("");
      setSelectedProduct(null);
      setSelectedStock(null);

      // Refresh products to get updated stock data
      await fetchProducts(currentPage, true);

      if (onStockUpdate) {
        onStockUpdate();
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to add stock",
      });
    } finally {
      setAddingStock(false);
    }
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim }} className="mb-5">
      <View className="flex-row justify-between items-center mb-4">
        <Text
          className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          {filteredProducts.length} of {stats.total} products
        </Text>
        <View
          className={`flex-row items-center px-3 py-1.5 rounded-full shadow-sm ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <Icon
            name="package-variant"
            size={16}
            color={isDarkMode ? "#60A5FA" : "#3B82F6"}
          />
          <Text
            className={`text-sm font-semibold ml-1.5 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
          >
            {stats.totalStock} units
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderGridItem = (item) => (
    <View key={item.id} className="w-[48%] mx-[1%] mb-4">
      <ProductCard
        product={item}
        onPress={handleProductPress}
        onEdit={() => handleEditProduct(item)}
        onDelete={() => handleDeleteProduct(item.id)}
        onAddStock={() => handleAddStock(item)}
        navigation={navigation}
      />
    </View>
  );

  const renderListItem = (item) => {
    const totalStock = getProductTotalStock(item);
    const stocksList = getProductStocks(item);
    const minStock = safeNumber(
      item.minimum_stock_quantity || item.reorder_level || 10,
    );
    const sellingPrice = safeNumber(item.selling_price);
    const purchasePrice = safeNumber(item.purchase_price);
    const mrp = safeNumber(item.mrp);
    const discount = safeNumber(item.discount_percentage);
    const gst = safeNumber(item.gst_percentage);
    const variants = item.variants || [];
    const attributes = item.attributes;
    const expiryDate = item.expiry_date;
    const batchNumber = item.batch_number;
    const isFeatured = item.is_featured;

    const isLowStock = totalStock <= minStock && totalStock > 0;
    const isOutOfStock = totalStock === 0;

    const getStockStatus = () => {
      if (isOutOfStock)
        return {
          label: "Out of Stock",
          color: "#EF4444",
          bg: isDarkMode ? "#7F1D1D" : "#FEE2E2",
          textColor: isDarkMode ? "#FCA5A5" : "#DC2626",
        };
      if (isLowStock)
        return {
          label: "Low Stock",
          color: "#F59E0B",
          bg: isDarkMode ? "#78350F" : "#FEF3C7",
          textColor: isDarkMode ? "#FBBF24" : "#D97706",
        };
      return {
        label: "In Stock",
        color: "#10B981",
        bg: isDarkMode ? "#064E3B" : "#D1FAE5",
        textColor: isDarkMode ? "#34D399" : "#059669",
      };
    };

    const stockStatus = getStockStatus();

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
        className={`flex-row rounded-2xl mb-4 p-4 shadow-lg ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.3 : 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {/* Product Image */}
        <View className="relative">
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              className="w-24 h-24 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={
                isDarkMode ? ["#374151", "#1F2937"] : ["#F3F4F6", "#E5E7EB"]
              }
              className="w-24 h-24 rounded-xl items-center justify-center"
            >
              <Icon
                name="package-variant"
                size={32}
                color={isDarkMode ? "#6B7280" : "#9CA3AF"}
              />
            </LinearGradient>
          )}

          {isFeatured && (
            <View className="absolute -top-2 -left-2 bg-yellow-500 rounded-full px-2 py-1 shadow-md z-10">
              <Text className="text-white text-xs font-bold">⭐</Text>
            </View>
          )}
          {discount > 0 && (
            <View
              className="absolute -top-2 -left-2 bg-red-500 rounded-full px-2 py-1 shadow-md"
              style={{ left: isFeatured ? 28 : -8 }}
            >
              <Text className="text-white text-xs font-bold">-{discount}%</Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text
                className={`text-[10px] font-mono mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
              >
                {item.sku || "N/A"}
              </Text>
              <Text
                className={`text-base font-bold leading-5 ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
                numberOfLines={2}
              >
                {item.name}
              </Text>
            </View>
          </View>

          {/* Category & Brand */}
          <View className="flex-row items-center mt-2 flex-wrap gap-2">
            {item.category?.name && (
              <View
                className={`flex-row items-center px-2 py-1 rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <Icon
                  name="tag-outline"
                  size={12}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  {item.category.name}
                </Text>
              </View>
            )}
            {item.brand?.name && (
              <View
                className={`flex-row items-center px-2 py-1 rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <Icon
                  name="factory"
                  size={12}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  className={`text-xs ml-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  {item.brand.name}
                </Text>
              </View>
            )}
            {/* Variants in list view */}
            {variants &&
              Array.isArray(variants) &&
              variants.length > 0 &&
              variants.slice(0, 2).map((variant, idx) => {
                const variantValues = [];
                if (variant.size) variantValues.push(String(variant.size));
                if (variant.color) variantValues.push(String(variant.color));
                return variantValues.slice(0, 1).map((val, valIdx) => (
                  <View
                    key={`${idx}-${valIdx}`}
                    className={`flex-row items-center px-2 py-1 rounded-md ${isDarkMode ? "bg-green-900/30" : "bg-green-100"}`}
                  >
                    <Text
                      className={`text-xs ${isDarkMode ? "text-green-400" : "text-green-700"}`}
                    >
                      {String(val)}
                    </Text>
                  </View>
                ));
              })}
            {/* Medicine fields in list view */}
            {expiryDate && (
              <View
                className={`flex-row items-center px-2 py-1 rounded-md ${isDarkMode ? "bg-purple-900/30" : "bg-purple-100"}`}
              >
                <Icon
                  name="calendar"
                  size={10}
                  color={isDarkMode ? "#A78BFA" : "#9333EA"}
                />
                <Text
                  className={`text-xs ml-1 ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}
                >
                  Exp: {new Date(expiryDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {batchNumber && (
              <View
                className={`flex-row items-center px-2 py-1 rounded-md ${isDarkMode ? "bg-orange-900/30" : "bg-orange-100"}`}
              >
                <Icon
                  name="barcode"
                  size={10}
                  color={isDarkMode ? "#FB923C" : "#EA580C"}
                />
                <Text
                  className={`text-xs ml-1 ${isDarkMode ? "text-orange-400" : "text-orange-700"}`}
                >
                  {batchNumber}
                </Text>
              </View>
            )}
          </View>

          {/* Price & Stock */}
          <View className="flex-row justify-between items-end mt-3">
            <View>
              <View className="flex-row items-baseline gap-2">
                <Text className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{formatCurrency(sellingPrice)}
                </Text>
                {mrp && mrp > sellingPrice && (
                  <Text
                    className={`text-xs line-through ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                  >
                    MRP: ₹{formatCurrency(mrp)}
                  </Text>
                )}
                {purchasePrice > 0 &&
                  purchasePrice !== sellingPrice &&
                  !mrp && (
                    <Text
                      className={`text-xs line-through ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                    >
                      ₹{formatCurrency(purchasePrice)}
                    </Text>
                  )}
              </View>
              {gst > 0 && (
                <Text
                  className={`text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                >
                  GST: {gst}%
                </Text>
              )}
            </View>

            <View className={`px-2.5 py-1 rounded-lg ${stockStatus.bg}`}>
              <Text
                className={`text-xs font-semibold ${stockStatus.textColor}`}
              >
                {stockStatus.label} • {totalStock} units
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-end gap-3 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={() => handleAddStock(item)}
              className="flex-row items-center px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"
            >
              <Icon name="plus" size={14} color="#10B981" />
              <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-medium ml-1">
                Add Stock
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleEditProduct(item)}
              className="flex-row items-center px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30"
            >
              <Icon name="pencil" size={14} color="#3B82F6" />
              <Text className="text-blue-600 dark:text-blue-400 text-xs font-medium ml-1">
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteProduct(item.id)}
              className="flex-row items-center px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30"
            >
              <Icon name="delete" size={14} color="#EF4444" />
              <Text className="text-red-600 dark:text-red-400 text-xs font-medium ml-1">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredProducts.length; i += 2) {
      const rowItems = filteredProducts.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map((item) => renderGridItem(item))}
        </View>,
      );
    }
    return rows;
  };

  const renderStockModal = () => (
    <Modal
      visible={showStockModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowStockModal(false)}
    >
      <TouchableOpacity
        className="flex-1 bg-black/60 justify-center items-center px-4"
        activeOpacity={1}
        onPress={() => setShowStockModal(false)}
      >
        <View
          className={`rounded-2xl w-full ${isDarkMode ? "bg-gray-800" : "bg-white"} overflow-hidden shadow-xl`}
        >
          <LinearGradient
            colors={
              isDarkMode ? ["#1F2937", "#111827"] : ["#F9FAFB", "#FFFFFF"]
            }
            className="p-4 border-b border-gray-200 dark:border-gray-700"
          >
            <Text
              className={`text-lg font-semibold text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              Add Stock
            </Text>
            <Text
              className={`text-xs text-center mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {selectedProduct?.name}
            </Text>
          </LinearGradient>

          <View className="p-4">
            <Text
              className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
            >
              Select Stock *
            </Text>
            <TouchableOpacity
              onPress={() => setShowStockDropdown(!showStockDropdown)}
              className={`border rounded-xl px-4 py-3 flex-row justify-between items-center ${
                isDarkMode
                  ? "border-gray-600 text-white bg-gray-700"
                  : "border-gray-300 text-gray-800 bg-gray-50"
              }`}
            >
              <Text
                className={`text-base ${selectedStock ? (isDarkMode ? "text-white" : "text-gray-800") : "text-gray-500"}`}
              >
                {selectedStock
                  ? selectedStock.name || `Stock #${selectedStock.id}`
                  : "Select a stock"}
              </Text>
              <Icon
                name={showStockDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>

            {showStockDropdown && (
              <View
                className={`mt-2 border rounded-xl overflow-hidden ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700"
                    : "border-gray-300 bg-white"
                }`}
              >
                <ScrollView
                  nestedScrollEnabled={true}
                  style={{ maxHeight: 150 }}
                >
                  {getProductStocks(selectedProduct).map((stock) => (
                    <TouchableOpacity
                      key={stock.id}
                      onPress={() => {
                        setSelectedStock(stock);
                        setShowStockDropdown(false);
                      }}
                      className={`px-4 py-3 border-b ${
                        isDarkMode ? "border-gray-600" : "border-gray-200"
                      } ${selectedStock?.id === stock.id ? (isDarkMode ? "bg-blue-900/30" : "bg-blue-50") : ""}`}
                    >
                      <Text
                        className={`text-base ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}
                      >
                        {stock.name || `Stock #${stock.id}`}
                      </Text>
                      <Text
                        className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Current: {stock.quantity || 0}{" "}
                        {selectedProduct?.unit?.name || "units"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {selectedStock && (
              <View
                className={`p-3 rounded-lg mb-4 mt-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text
                    className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                  >
                    Current Stock in{" "}
                    {selectedStock.name || `Stock #${selectedStock.id}`}:
                  </Text>
                  <Text
                    className={`text-lg font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    {selectedStock.quantity || 0}{" "}
                    {selectedProduct?.unit?.name || "units"}
                  </Text>
                </View>
                {selectedProduct?.minimum_stock_quantity && (
                  <View className="flex-row justify-between items-center">
                    <Text
                      className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Minimum Stock Level:
                    </Text>
                    <Text
                      className={`text-xs font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {selectedProduct.minimum_stock_quantity}{" "}
                      {selectedProduct?.unit?.name || "units"}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Text
              className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
            >
              Quantity to Add *
            </Text>
            <TextInput
              className={`border rounded-xl px-4 py-3 text-base ${
                isDarkMode
                  ? "border-gray-600 text-white bg-gray-700"
                  : "border-gray-300 text-gray-800 bg-gray-50"
              }`}
              placeholder="Enter quantity"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9ca3af"}
              keyboardType="numeric"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              autoFocus
            />

            <View className="flex-row justify-end gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setShowStockModal(false)}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? "border-gray-600" : "border-gray-300"
                }`}
              >
                <Text
                  className={isDarkMode ? "text-gray-200" : "text-gray-700"}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitStock}
                disabled={addingStock}
                className="bg-emerald-500 px-6 py-2 rounded-lg flex-row items-center shadow-md"
              >
                {addingStock ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#fff" />
                    <Text className="text-white ml-2 font-semibold">
                      Add Stock
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (!filteredProducts || filteredProducts.length === 0) {
    return (
      <View className="flex-1">
        {renderHeader()}
        <View className="items-center justify-center py-20">
          <LinearGradient
            colors={
              isDarkMode ? ["#1F2937", "#111827"] : ["#F9FAFB", "#F3F4F6"]
            }
            className="w-32 h-32 rounded-full items-center justify-center"
          >
            <Icon
              name="package-variant"
              size={48}
              color={isDarkMode ? "#4B5563" : "#9CA3AF"}
            />
          </LinearGradient>
          <Text
            className={`text-xl font-bold mt-6 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            No Products Found
          </Text>
          <Text
            className={`text-sm text-center mt-2 px-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
          >
            {searchQuery || selectedFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Tap the + button to add your first product"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {renderHeader()}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {viewMode === "grid"
          ? renderGridItems()
          : filteredProducts.map((item) => renderListItem(item))}
      </ScrollView>
      {renderStockModal()}
    </View>
  );
};

export default ProductList;
