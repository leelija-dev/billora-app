// components/products/ProductCard.js
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
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

const ProductCard = ({
  product,
  onUpdateStock,
  onEdit,
  onDelete,
  onAddStock,
  onPress,
  navigation: navigationProp,
}) => {
  const navigation = navigationProp || useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getProductTotalStock, fetchProducts, currentPage } =
    useProductStore();

  const [showActions, setShowActions] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [addingStock, setAddingStock] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!product) return null;

  const {
    id,
    name,
    sku,
    selling_price,
    purchase_price,
    image,
    category,
    brand,
    is_active,
    updated_at,
    minimum_stock_quantity = 10,
    reorder_level = 10,
    unit,
    unit_amount,
    gst_percentage,
    discount_percentage,
    stocks = [],
    variants = [],
    attributes,
    mrp,
    expiry_date,
    batch_number,
    is_featured,
    images = [],
  } = product;

  // ✅ REMOVE: console.log(id); - This was causing the error

  // Get total stock using the store method
  const totalStock = getProductTotalStock(product);
  const stocksList = product.stocks || [];

  // Safely parse numeric values
  const price =
    typeof selling_price === "number"
      ? selling_price
      : parseFloat(selling_price) || 0;
  const cost =
    typeof purchase_price === "number"
      ? purchase_price
      : parseFloat(purchase_price) || 0;
  const gst =
    typeof gst_percentage === "number"
      ? gst_percentage
      : parseFloat(gst_percentage) || 0;
  const discount =
    typeof discount_percentage === "number"
      ? discount_percentage
      : parseFloat(discount_percentage) || 0;

  const isLowStock = totalStock <= (minimum_stock_quantity || reorder_level);
  const isOutOfStock = totalStock <= 0;

  const handlePress = () => {
    if (onPress) {
      onPress(product);
    } else {
      navigation.navigate("ProductDetail", { productId: id });
    }
  };

  const handleEdit = () => {
    setShowActions(false);
    if (onEdit) {
      onEdit();
    } else {
      navigation.navigate("AddProduct", { productId: id, product });
    }
  };

  const handleDelete = () => {
    setShowActions(false);
    if (onDelete) {
      onDelete(id); // ✅ Pass the product ID
    } else {
      Alert.alert(
        "Delete Product",
        `Are you sure you want to delete "${name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            onPress: () => {},
            style: "destructive",
          },
        ],
      );
    }
  };

  const handleAddStock = () => {
    setShowActions(false);
    if (onAddStock) {
      onAddStock();
    } else {
      setShowStockModal(true);
      setStockQuantity("");
    }
  };

  const handleSubmitStock = async () => {
    const quantity = parseFloat(stockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please enter a valid quantity",
      });
      return;
    }

    setAddingStock(true);
    try {
      const primaryStock = stocksList[0];

      if (!primaryStock) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No stock record found for this product",
        });
        return;
      }

      await stocksAPI.addStock(primaryStock.id, user?.id, quantity);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: `Added ${quantity} ${unit?.name || "units"} to stock`,
      });

      setShowStockModal(false);
      setStockQuantity("");

      await fetchProducts(currentPage, true);

      if (onUpdateStock) {
        onUpdateStock(id, totalStock + quantity);
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

  const getStockStatus = () => {
    if (isOutOfStock)
      return {
        label: "Out of Stock",
        color: "#ef4444",
        bg: isDarkMode ? "#7f1d1d" : "#fee2e2",
        icon: "alert-circle",
        textColor: "#ffffff",
      };
    if (isLowStock)
      return {
        label: "Low Stock",
        color: "#f59e0b",
        bg: isDarkMode ? "#78350f" : "#fef3c7",
        icon: "alert",
        textColor: isDarkMode ? "#fbbf24" : "#b45309",
      };
    return {
      label: "In Stock",
      color: "#10b981",
      bg: isDarkMode ? "#064e3b" : "#d1fae5",
      icon: "check-circle",
      textColor: isDarkMode ? "#34d399" : "#065f46",
    };
  };

  const stockStatus = getStockStatus();

  const handleLongPress = () => {
    setShowActions(true);
  };

  const getImageUrl = () => {
    if (!image || imageError) return null;

    // Handle different image formats
    if (typeof image === "string") {
      // Check if it's a full URL or relative path
      if (image.startsWith("http://") || image.startsWith("https://")) {
        return image;
      }
      // If it's a local file URI
      if (image.startsWith("file://")) {
        return image;
      }
      // If it's a base64 image
      if (image.startsWith("data:image")) {
        return image;
      }
      // If it's just a filename or path, you might need to prepend your API base URL
      // For now, return as is
      return image;
    }
    if (image.uri) return image.uri;
    if (image.url) return image.url;

    return null;
  };

  const imageUrl = getImageUrl();

  const formatCurrency = (value) => {
    const num = typeof value === "number" ? value : parseFloat(value);
    return isNaN(num) ? "0" : num.toFixed(0);
  };

  const getInitial = () => {
    return name?.charAt(0)?.toUpperCase() || "P";
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        className="mb-4"
      >
        <View
          className={`rounded-2xl overflow-hidden shadow-lg ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {/* Image Container */}
          <View className="relative">
            {imageUrl && !imageError ? (
              <View>
                {imageLoading && (
                  <View className="absolute inset-0 items-center justify-center z-10">
                    <ActivityIndicator size="large" color="#3b82f6" />
                  </View>
                )}
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-40"
                  resizeMode="cover"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={(error) => {
                    console.log("Image load error:", error.nativeEvent.error);
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />
              </View>
            ) : (
              <LinearGradient
                colors={
                  isDarkMode ? ["#374151", "#1f2937"] : ["#e5e7eb", "#d1d5db"]
                }
                className="w-full h-40 items-center justify-center"
              >
                <View
                  className={`w-20 h-20 rounded-full items-center justify-center ${
                    isDarkMode ? "bg-blue-900/50" : "bg-blue-100"
                  }`}
                >
                  <Text
                    className={`text-4xl font-bold ${
                      isDarkMode ? "text-blue-400" : "text-blue-500"
                    }`}
                  >
                    {getInitial()}
                  </Text>
                </View>
              </LinearGradient>
            )}

            {/* Featured Badge */}
            {is_featured && (
              <View className="absolute top-3 left-3 bg-yellow-500 rounded-lg px-2 py-1 shadow-md z-20">
                <Text className="text-white text-xs font-bold">
                  ⭐ Featured
                </Text>
              </View>
            )}

            {/* Discount Badge */}
            {discount > 0 && (
              <View className="absolute top-3 left-3 bg-red-500 rounded-lg px-2 py-1 shadow-md z-20" style={{ left: is_featured ? 70 : 12 }}>
                <Text className="text-white text-xs font-bold">
                  -{discount}%
                </Text>
              </View>
            )}

            {/* Inactive Badge */}
            {!is_active && (
              <View className="absolute top-3 left-3 bg-gray-600 rounded-lg px-2 py-1 shadow-md z-20" style={{ left: (is_featured || discount > 0) ? (is_featured && discount > 0 ? 130 : 70) : 12 }}>
                <Text className="text-white text-xs font-bold">Inactive</Text>
              </View>
            )}

            {/* Stock Status Bar */}
            <View className="absolute bottom-0 left-0 right-0 flex-row justify-between items-center px-3 py-2 bg-black/60 z-20">
              <View className="flex-row items-center">
                <Icon name={stockStatus.icon} size={14} color="#ffffff" />
                <Text className="text-white text-xs font-semibold ml-1.5">
                  {stockStatus.label}
                </Text>
              </View>
              <Text className="text-white text-xs font-bold">
                Stock: {totalStock} {unit?.name || "units"}
              </Text>
            </View>

            {/* Action Buttons Overlay - Delete and Edit */}
            <View className="absolute top-3 right-3 flex-row gap-2 z-20">
              <TouchableOpacity
                onPress={handleDelete}
                className="w-8 h-8 rounded-full bg-red-500/90 items-center justify-center shadow-md"
              >
                <Icon name="delete" size={16} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEdit}
                className="w-8 h-8 rounded-full bg-blue-500/90 items-center justify-center shadow-md"
              >
                <Icon name="pencil" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Info */}
          <View className="p-4">
            {/* SKU */}
            <Text
              className={`text-xs mb-1.5 font-mono ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              SKU: {sku || "N/A"}
            </Text>

            {/* Product Name */}
            <Text
              className={`text-base font-semibold mb-2 leading-5 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
              numberOfLines={2}
            >
              {name}
            </Text>

            {/* Category & Brand */}
            <View className="flex-row items-center mb-3 flex-wrap gap-x-3 gap-y-1">
              {category?.name && (
                <View
                  className={`flex-row items-center px-2 py-1 rounded-md ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <Icon
                    name="tag-outline"
                    size={12}
                    color={isDarkMode ? "#9CA3AF" : "#6b7280"}
                  />
                  <Text
                    className={`text-xs ml-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {category.name}
                  </Text>
                </View>
              )}
              {brand?.name && (
                <View
                  className={`flex-row items-center px-2 py-1 rounded-md ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <Icon
                    name="factory"
                    size={12}
                    color={isDarkMode ? "#9CA3AF" : "#6b7280"}
                  />
                  <Text
                    className={`text-xs ml-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {brand.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Unit Info */}
            {unit_amount && unit && (
              <View
                className={`flex-row items-center mb-3 px-2 py-1 rounded-md self-start ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <Icon
                  name="ruler"
                  size={12}
                  color={isDarkMode ? "#9CA3AF" : "#6b7280"}
                />
                <Text
                  className={`text-xs ml-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {unit_amount} {unit.name}
                </Text>
              </View>
            )}

            {/* Variants Display */}
            {variants && Array.isArray(variants) && variants.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mb-3">
                {variants.slice(0, 3).map((variant, index) => {
                  const variantValues = [];
                  if (variant.size) variantValues.push(String(variant.size));
                  if (variant.color) variantValues.push(String(variant.color));
                  if (variant.material) variantValues.push(String(variant.material));
                  if (variant.gender) variantValues.push(String(variant.gender));

                  return variantValues.map((val, valIndex) => (
                    <View
                      key={`${index}-${valIndex}`}
                      className={`px-2 py-0.5 rounded-md ${
                        isDarkMode ? "bg-green-900/30" : "bg-green-100"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isDarkMode ? "text-green-400" : "text-green-700"
                        }`}
                      >
                        {String(val)}
                      </Text>
                    </View>
                  ));
                })}
                {variants.length > 3 && (
                  <View
                    className={`px-2 py-0.5 rounded-md ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      +{variants.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Attributes Display */}
            {attributes && typeof attributes === 'object' && (
              <View className="flex-row flex-wrap gap-1 mb-3">
                {(() => {
                  let attrs = attributes;
                  if (typeof attrs === 'string') {
                    try {
                      attrs = JSON.parse(attrs);
                    } catch (e) {
                      return null;
                    }
                  }
                  if (!attrs || typeof attrs !== 'object') return null;

                  let values = [];
                  if (Array.isArray(attrs)) {
                    attrs.forEach((item) => {
                      if (typeof item === 'object' && item !== null) {
                        Object.values(item).forEach(v => {
                          if (v !== null && v !== undefined && v !== '') {
                            values.push(typeof v === 'object' ? JSON.stringify(v) : String(v));
                          }
                        });
                      } else if (item !== null && item !== undefined && item !== '') {
                        values.push(String(item));
                      }
                    });
                  } else {
                    Object.values(attrs).forEach(v => {
                      if (v !== null && v !== undefined && v !== '') {
                        values.push(typeof v === 'object' ? JSON.stringify(v) : String(v));
                      }
                    });
                  }

                  if (values.length === 0) return null;

                  const displayValues = values.slice(0, 2);
                  return (
                    <>
                      {displayValues.map((val, idx) => (
                        <View
                          key={`attr-${idx}`}
                          className={`px-2 py-0.5 rounded-md ${
                            isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isDarkMode ? "text-blue-400" : "text-blue-700"
                            }`}
                          >
                            {String(val)}
                          </Text>
                        </View>
                      ))}
                      {values.length > 2 && (
                        <View
                          className={`px-2 py-0.5 rounded-md ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            +{values.length - 2}
                          </Text>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>
            )}

            {/* Medicine-specific fields */}
            {(expiry_date || batch_number) && (
              <View className="flex-row flex-wrap gap-2 mb-3">
                {expiry_date && (
                  <View
                    className={`flex-row items-center px-2 py-1 rounded-md ${
                      isDarkMode ? "bg-purple-900/30" : "bg-purple-100"
                    }`}
                  >
                    <Icon
                      name="calendar"
                      size={12}
                      color={isDarkMode ? "#A78BFA" : "#9333EA"}
                    />
                    <Text
                      className={`text-xs ml-1 ${
                        isDarkMode ? "text-purple-400" : "text-purple-700"
                      }`}
                    >
                      Exp: {new Date(expiry_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {batch_number && (
                  <View
                    className={`flex-row items-center px-2 py-1 rounded-md ${
                      isDarkMode ? "bg-orange-900/30" : "bg-orange-100"
                    }`}
                  >
                    <Icon
                      name="barcode"
                      size={12}
                      color={isDarkMode ? "#FB923C" : "#EA580C"}
                    />
                    <Text
                      className={`text-xs ml-1 ${
                        isDarkMode ? "text-orange-400" : "text-orange-700"
                      }`}
                    >
                      Batch: {batch_number}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* GST and Price Row */}
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{formatCurrency(price)}
                </Text>
                {mrp && mrp > price && (
                  <Text
                    className={`text-xs line-through ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    MRP: ₹{formatCurrency(mrp)}
                  </Text>
                )}
                {cost > 0 && cost !== price && !mrp && (
                  <Text
                    className={`text-xs line-through ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Cost: ₹{formatCurrency(cost)}
                  </Text>
                )}
              </View>
              {gst > 0 && (
                <View
                  className={`px-2 py-1 rounded-md ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    GST {gst}%
                  </Text>
                </View>
              )}
            </View>

            {/* Stock breakdown by unit */}
            {stocksList.length > 1 && (
              <View
                className={`mb-3 p-2 rounded-lg ${
                  isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}
              >
                <Text
                  className={`text-xs font-medium mb-1.5 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Stock Breakdown:
                </Text>
                {stocksList.slice(0, 2).map((stock, idx) => (
                  <View
                    key={idx}
                    className="flex-row justify-between items-center mb-1"
                  >
                    <Text
                      className={`text-xs ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {stock.unit?.name || `Unit ${stock.unit_id}`}:
                    </Text>
                    <Text
                      className={`text-xs font-medium ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {parseFloat(stock.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
                {stocksList.length > 2 && (
                  <Text
                    className={`text-xs mt-1 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    +{stocksList.length - 2} more
                  </Text>
                )}
              </View>
            )}

            {/* Add Stock Button */}
            <TouchableOpacity
              onPress={handleAddStock}
              className={`flex-row items-center justify-center py-2.5 rounded-xl mt-1 ${
                isOutOfStock
                  ? "bg-orange-500"
                  : isDarkMode
                    ? "bg-blue-600"
                    : "bg-blue-500"
              }`}
            >
              <Icon name="plus-circle" size={18} color="#ffffff" />
              <Text className="text-white text-sm font-semibold ml-2">
                Add Stock
              </Text>
            </TouchableOpacity>

            {/* Last Updated */}
            {updated_at && (
              <Text
                className={`text-[10px] text-right mt-2 ${
                  isDarkMode ? "text-gray-600" : "text-gray-400"
                }`}
              >
                Updated: {new Date(updated_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Stock Add Modal */}
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
            <View
              className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <Text
                className={`text-lg font-semibold text-center ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                Add Stock
              </Text>
              <Text
                className={`text-xs text-center mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {name}
              </Text>
            </View>

            <View className="p-4">
              <View
                className={`p-3 rounded-lg mb-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
              >
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                >
                  Current Stock:{" "}
                  <Text className="font-bold text-emerald-600 dark:text-emerald-400">
                    {totalStock}
                  </Text>{" "}
                  {unit?.name || "units"}
                </Text>
              </View>

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
                  className="bg-blue-500 px-6 py-2 rounded-lg flex-row items-center"
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

      {/* Action Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/60"
          activeOpacity={1}
          onPress={() => setShowActions(false)}
        >
          <View
            className={`absolute bottom-0 left-0 right-0 rounded-t-3xl ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } shadow-lg`}
          >
            <View className="items-center pt-3">
              <View
                className={`w-12 h-1 rounded-full ${
                  isDarkMode ? "bg-gray-600" : "bg-gray-300"
                }`}
              />
            </View>

            <View className="p-5">
              <Text
                className={`text-lg font-semibold mb-4 text-center ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {name}
              </Text>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-3 ${
                  isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
                }`}
                onPress={handleEdit}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    isDarkMode ? "bg-blue-800" : "bg-blue-100"
                  }`}
                >
                  <Icon name="pencil" size={22} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Edit Product
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Modify product details
                  </Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={22}
                  color={isDarkMode ? "#6b7280" : "#9ca3af"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-3 ${
                  isDarkMode ? "bg-emerald-900/30" : "bg-emerald-50"
                }`}
                onPress={handleAddStock}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    isDarkMode ? "bg-emerald-800" : "bg-emerald-100"
                  }`}
                >
                  <Icon name="plus" size={22} color="#10b981" />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Add Stock
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Increase inventory quantity
                  </Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={22}
                  color={isDarkMode ? "#6b7280" : "#9ca3af"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-3 ${
                  isDarkMode ? "bg-red-900/30" : "bg-red-50"
                }`}
                onPress={handleDelete}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    isDarkMode ? "bg-red-800" : "bg-red-100"
                  }`}
                >
                  <Icon name="delete" size={22} color="#ef4444" />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Delete Product
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Permanently remove from inventory
                  </Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={22}
                  color={isDarkMode ? "#6b7280" : "#9ca3af"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                className={`mt-4 p-3 rounded-xl items-center ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
                onPress={() => setShowActions(false)}
              >
                <Text
                  className={`text-base font-semibold ${
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default ProductCard;