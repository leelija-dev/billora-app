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
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const ProductCard = ({ product, onUpdateStock }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [isFavorite, setIsFavorite] = useState(product?.is_favorite || false);
  const [currentStock, setCurrentStock] = useState(product?.stock || 0);
  const [showActions, setShowActions] = useState(false);
  const scaleValue = useState(new Animated.Value(1))[0];

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
    description,
    is_active,
    created_at,
    updated_at,
    stock = 0,
    reorder_level = 10,
  } = product;

  const price = selling_price || 0;
  const cost = purchase_price || 0;
  const profitMargin = cost ? (((price - cost) / price) * 100).toFixed(1) : 0;
  const isLowStock = currentStock <= reorder_level;
  const isOutOfStock = currentStock <= 0;

  const handlePress = () => {
    navigation.navigate("ProductDetail", { productId: id });
  };

  const handleEdit = () => {
    setShowActions(false);
    navigation.navigate("AddProduct", { productId: id });
  };

  const handleDelete = () => {
    setShowActions(false);
    Alert.alert("Delete Product", `Are you sure you want to delete ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: () => {
          Alert.alert("Success", "Product deleted successfully");
        },
        style: "destructive",
      },
    ]);
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

  const handleStockUpdate = (increment) => {
    const newStock = currentStock + increment;
    if (newStock >= 0) {
      setCurrentStock(newStock);
      onUpdateStock?.(id, newStock);
    }
  };

  const getStockStatus = () => {
    if (isOutOfStock)
      return {
        label: "Out of Stock",
        color: "text-red-500",
        bg: isDarkMode ? "bg-red-900/30" : "bg-red-50",
        icon: "alert-circle",
        gradient: ["#ef4444", "#dc2626"],
      };
    if (isLowStock)
      return {
        label: "Low Stock",
        color: "text-orange-500",
        bg: isDarkMode ? "bg-orange-900/30" : "bg-orange-50",
        icon: "alert",
        gradient: ["#f97316", "#ea580c"],
      };
    return {
      label: "In Stock",
      color: "text-green-500",
      bg: isDarkMode ? "bg-green-900/30" : "bg-green-50",
      icon: "check-circle",
      gradient: ["#22c55e", "#16a34a"],
    };
  };

  const stockStatus = getStockStatus();

  const handleLongPress = () => {
    setShowActions(true);
  };

  return (
    <>
      <TouchableOpacity
        className={`w-full rounded-2xl shadow-lg overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        {/* Image Section with Gradient Overlay */}
        <View className={`relative h-40 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {image ? (
            <Image source={{ uri: image }} className="w-full h-full" />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Icon name="package-variant" size={40} color="#9ca3af" />
            </View>
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)"]}
            className="absolute bottom-0 left-0 right-0 h-12"
          />

          {/* Badges */}
          <View className="absolute top-2 left-2 flex-col gap-1">
            {product.discount_percentage && product.discount_percentage > 0 && (
              <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                className="px-2 py-1 rounded-full"
                style={{ borderRadius: 100 }}
              >
                <Text className="text-white text-xs font-bold">
                  -{product.discount_percentage}%
                </Text>
              </LinearGradient>
            )}
          </View>

          {/* Favorite Button */}
          <TouchableOpacity
            className={`absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center shadow-md ${
              isDarkMode ? 'bg-gray-800' : 'bg-white/95'
            }`}
            onPress={handleFavoritePress}
          >
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
              <Icon
                name={isFavorite ? "heart" : "heart-outline"}
                size={18}
                color={isFavorite ? "#ef4444" : "#6b7280"}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Stock Status Badge */}
          <View className="absolute bottom-2 left-2 right-2 flex-row justify-between items-center">
            <LinearGradient
              colors={stockStatus.gradient}
              className="px-2 py-1 rounded-full flex-row items-center"
              style={{ borderRadius: 100 }}
            >
              <Icon name={stockStatus.icon} size={12} color="#ffffff" />
              <Text className="text-white text-xs font-medium ml-1">
                {stockStatus.label}
              </Text>
            </LinearGradient>

            <View className={`px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-white/95'
            }`}>
              <Text className={`text-xs font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {currentStock}
              </Text>
            </View>
          </View>
        </View>

        {/* Product Details */}
        <View className="p-3">
          {/* SKU and Category */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className={`text-xs font-medium ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              #{sku || "N/A"}
            </Text>
            <View className={`px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
            }`}>
              <Text className="text-blue-500 text-xs font-semibold">
                {category?.name || "General"}
              </Text>
            </View>
          </View>

          {/* Product Name */}
          <Text
            className={`text-base font-semibold mb-1 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            numberOfLines={2}
          >
            {name}
          </Text>

          {/* Brand */}
          <View className="flex-row items-center mb-2">
            {brand?.name && (
              <>
                <Icon name="factory" size={12} color="#9ca3af" />
                <Text
                  className={`text-xs ml-1 mr-2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}
                  numberOfLines={1}
                >
                  {brand.name}
                </Text>
              </>
            )}
          </View>

          {/* Price Section */}
          <View className={`p-2 rounded-xl mb-2 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <View className="flex-row justify-between items-center mb-1">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Price:
              </Text>
              <View className="flex-row items-baseline">
                <Text className="text-lg font-bold text-green-600">
                  ${parseFloat(price).toFixed(2)}
                </Text>
              </View>
            </View>

            {cost > 0 && (
              <View className="flex-row justify-between items-center">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Profit:
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-sm text-green-600 font-medium">
                    ${(price - cost).toFixed(2)}
                  </Text>
                  <Text className={`text-xs ml-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    ({profitMargin}%)
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View className={`flex-row justify-between items-center mt-2 pt-2 border-t ${
            isDarkMode ? 'border-blue-900' : 'border-blue-100'
          }`}>
            <View className="flex-row gap-1">
              <TouchableOpacity
                className={`w-8 h-8 rounded-lg items-center justify-center ${
                  isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                }`}
                onPress={() => handleStockUpdate(-1)}
              >
                <Icon name="minus" size={18} color="#ef4444" />
              </TouchableOpacity>

              <TouchableOpacity
                className={`w-8 h-8 rounded-lg items-center justify-center ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                }`}
                onPress={() => handleStockUpdate(1)}
              >
                <Icon name="plus" size={18} color="#22c55e" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className={`w-8 h-8 rounded-lg items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
              }`}
              onPress={handleEdit}
            >
              <Icon name="pencil" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* Last Updated */}
          {updated_at && (
            <Text className={`text-xs text-right mt-1 ${
              isDarkMode ? 'text-gray-700' : 'text-gray-300'
            }`}>
              {new Date(updated_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </TouchableOpacity>

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
            <View className="items-center pt-2">
              <View className={`w-12 h-1 rounded-full ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`} />
            </View>

            <View className="p-5">
              <Text className={`text-lg font-semibold mb-4 text-center ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Product Actions
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
                  <Icon name="pencil" size={22} color="#3b82f6" />
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
                  <Icon name="delete" size={22} color="#ef4444" />
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