// components/products/ProductCard.js
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { stocksAPI } from "../../api/stocks";
import Toast from "react-native-toast-message";
import useProductStore from "../../store/productStore";

const ProductCard = ({ product, onUpdateStock, onEdit, onDelete }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getProductTotalStock, fetchProducts, currentPage } = useProductStore();
  
  const [isFavorite, setIsFavorite] = useState(product?.is_favorite || false);
  const [showActions, setShowActions] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [addingStock, setAddingStock] = useState(false);
  const scaleValue = useState(new Animated.Value(1))[0];
  const [imageError, setImageError] = useState(false);

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
  } = product;

  // Get total stock using the store method (like desktop)
  const totalStock = getProductTotalStock(product);
  const stocksList = product.stocks || [];
  
  // Safely parse numeric values
  const price = typeof selling_price === 'number' ? selling_price : parseFloat(selling_price) || 0;
  const cost = typeof purchase_price === 'number' ? purchase_price : parseFloat(purchase_price) || 0;
  const gst = typeof gst_percentage === 'number' ? gst_percentage : parseFloat(gst_percentage) || 0;
  const discount = typeof discount_percentage === 'number' ? discount_percentage : parseFloat(discount_percentage) || 0;
  
  const isLowStock = totalStock <= (minimum_stock_quantity || reorder_level);
  const isOutOfStock = totalStock <= 0;

  const handlePress = () => {
    navigation.navigate("ProductDetail", { productId: id });
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
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            if (onDelete) {
              onDelete();
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleFavoritePress = () => {
    setIsFavorite(!isFavorite);
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddStock = () => {
    setShowActions(false);
    setShowStockModal(true);
    setStockQuantity("");
  };

  const handleSubmitStock = async () => {
    const quantity = parseFloat(stockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a valid quantity' });
      return;
    }

    setAddingStock(true);
    try {
      // Get the primary stock record for this product (like desktop)
      const primaryStock = stocksList[0];
      
      if (!primaryStock) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'No stock record found for this product' });
        return;
      }

      // Call the stock API to add stock
      await stocksAPI.addStock(primaryStock.id, user?.id, quantity);
      
      Toast.show({ type: 'success', text1: 'Success', text2: `Added ${quantity} ${unit?.name || 'units'} to stock` });
      
      setShowStockModal(false);
      setStockQuantity("");
      
      // Refresh products to get updated stock data
      await fetchProducts(currentPage, true);
      
      if (onUpdateStock) {
        onUpdateStock(id, totalStock + quantity);
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to add stock' });
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
      };
    if (isLowStock)
      return {
        label: "Low Stock",
        color: "#f97316",
        bg: isDarkMode ? "#7c2d12" : "#ffedd5",
        icon: "alert",
      };
    return {
      label: "In Stock",
      color: "#22c55e",
      bg: isDarkMode ? "#14532d" : "#dcfce7",
      icon: "check-circle",
    };
  };

  const stockStatus = getStockStatus();

  const handleLongPress = () => {
    setShowActions(true);
  };

  const getImageUrl = () => {
    if (!image || imageError) return null;
    if (typeof image === "string") return image;
    if (image.uri) return image.uri;
    if (image.url) return image.url;
    return null;
  };

  const imageUrl = getImageUrl();

  const formatCurrency = (value) => {
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) ? '0' : num.toFixed(0);
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
          className={`rounded-2xl overflow-hidden shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {/* Image Container */}
          <View className="relative">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                className="w-full h-36"
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <LinearGradient
                colors={isDarkMode ? ["#374151", "#1f2937"] : ["#f3f4f6", "#e5e7eb"]}
                className="w-full h-36 items-center justify-center"
              >
                <View className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
                  <Text className="text-3xl font-bold text-blue-500">{getInitial()}</Text>
                </View>
              </LinearGradient>
            )}

            {/* Discount Badge */}
            {discount > 0 && (
              <View className="absolute top-2 left-2 bg-red-500 rounded-lg px-2 py-1">
                <Text className="text-white text-xs font-bold">-{discount}%</Text>
              </View>
            )}

            {/* Inactive Badge */}
            {!is_active && (
              <View className="absolute top-2 left-2 bg-gray-500 rounded-lg px-2 py-1">
                <Text className="text-white text-xs font-bold">Inactive</Text>
              </View>
            )}

            {/* Favorite Button */}
            <TouchableOpacity
              onPress={handleFavoritePress}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 items-center justify-center shadow-sm"
            >
              <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                <Icon
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={18}
                  color={isFavorite ? "#ef4444" : "#9ca3af"}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Stock Status Bar - Like desktop */}
            <View className="absolute bottom-0 left-0 right-0 flex-row justify-between items-center px-2 py-1.5 bg-black/50">
              <View className="flex-row items-center">
                <Icon name={stockStatus.icon} size={12} color="#fff" />
                <Text className="text-white text-xs font-medium ml-1">
                  {stockStatus.label}
                </Text>
              </View>
              <Text className="text-white text-xs font-bold">
                {totalStock} {unit?.name || 'units'}
              </Text>
            </View>
          </View>

          {/* Product Info */}
          <View className="p-3">
            {/* SKU */}
            <Text className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {sku || "N/A"}
            </Text>

            {/* Product Name */}
            <Text
              className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
              numberOfLines={2}
            >
              {name}
            </Text>

            {/* Category & Brand */}
            <View className="flex-row items-center mb-2 flex-wrap">
              {category?.name && (
                <View className="flex-row items-center mr-2">
                  <Icon name="tag-outline" size={10} color="#9ca3af" />
                  <Text className={`text-xs ml-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {category.name}
                  </Text>
                </View>
              )}
              {brand?.name && (
                <View className="flex-row items-center">
                  <Icon name="factory" size={10} color="#9ca3af" />
                  <Text className={`text-xs ml-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {brand.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Unit Info */}
            {unit_amount && unit && (
              <View className="flex-row items-center mb-2">
                <Icon name="ruler" size={10} color="#9ca3af" />
                <Text className={`text-xs ml-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {unit_amount} {unit.name}
                </Text>
              </View>
            )}

            {/* Stock breakdown by unit - Like desktop */}
            {stocksList.length > 1 && (
              <View className="mb-2">
                {stocksList.slice(0, 2).map((stock, idx) => (
                  <View key={idx} className="flex-row justify-between items-center">
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {stock.unit?.name || `Unit ${stock.unit_id}`}:
                    </Text>
                    <Text className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {parseFloat(stock.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
                {stocksList.length > 2 && (
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    +{stocksList.length - 2} more
                  </Text>
                )}
              </View>
            )}

            {/* Price */}
            <View className="flex-row items-baseline justify-between mt-1">
              <View>
                <Text className="text-lg font-bold text-green-600 dark:text-green-400">
                  ₹{formatCurrency(price)}
                </Text>
                {cost > 0 && (
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    MRP: ₹{formatCurrency(cost)}
                  </Text>
                )}
              </View>
              {gst > 0 && (
                <View className={`px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    GST {gst}%
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Actions - Like desktop with Add Stock button */}
            <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <View className="flex-row gap-2">
                {isOutOfStock ? (
                  <TouchableOpacity
                    onPress={handleAddStock}
                    className="px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex-row items-center"
                  >
                    <Icon name="plus" size={14} color="#f97316" />
                    <Text className="text-orange-600 dark:text-orange-400 text-xs ml-1">Add Stock</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={handleAddStock}
                      className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 items-center justify-center"
                    >
                      <Icon name="plus" size={14} color="#22c55e" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
              <TouchableOpacity
                onPress={handleEdit}
                className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 items-center justify-center"
              >
                <Icon name="pencil" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            {/* Last Updated */}
            {updated_at && (
              <Text className={`text-[10px] text-right mt-2 ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`}>
                {new Date(updated_at).toLocaleDateString()}
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
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setShowStockModal(false)}
        >
          <View className={`rounded-2xl w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
            <View className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <Text className={`text-lg font-semibold text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Add Stock
              </Text>
              <Text className={`text-xs text-center mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {name}
              </Text>
            </View>

            <View className="p-4">
              <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Current Stock: <Text className="font-bold">{totalStock}</Text> {unit?.name || 'units'}
              </Text>
              
              <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Quantity to Add *
              </Text>
              <TextInput
                className={`border rounded-xl px-4 py-3 text-base ${isDarkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-800 bg-white'}`}
                placeholder="Enter quantity"
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9ca3af'}
                keyboardType="numeric"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                autoFocus
              />

              <View className="flex-row justify-end space-x-3 mt-6">
                <TouchableOpacity
                  onPress={() => setShowStockModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmitStock}
                  disabled={addingStock}
                  className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
                >
                  {addingStock ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Icon name="check" size={18} color="#fff" />
                      <Text className="text-white ml-2">Add Stock</Text>
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
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowActions(false)}
        >
          <View className={`absolute bottom-0 left-0 right-0 rounded-t-3xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="items-center pt-3">
              <View className={`w-12 h-1 rounded-full ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`} />
            </View>

            <View className="p-5">
              <Text className={`text-lg font-semibold mb-4 text-center ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {name}
              </Text>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                }`}
                onPress={handleEdit}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}>
                  <Icon name="pencil" size={20} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Edit Product
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Modify product details
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                }`}
                onPress={handleAddStock}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                }`}>
                  <Icon name="plus" size={20} color="#22c55e" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Add Stock
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Increase inventory quantity
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl ${
                  isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                }`}
                onPress={handleDelete}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                }`}>
                  <Icon name="delete" size={20} color="#ef4444" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Delete Product
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Remove from inventory
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`mt-4 p-3 rounded-xl items-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
                onPress={() => setShowActions(false)}
              >
                <Text className={`text-base font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
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