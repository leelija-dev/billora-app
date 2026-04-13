import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const StockCard = ({ stock, onDelete, onAddQuantity }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [showActions, setShowActions] = useState(false);
  const scaleValue = useState(new Animated.Value(1))[0];

  if (!stock) return null;

  const {
    id,
    product,
    quantity,
    selling_price,
    purchase_price,
    unit_code,
    created_at,
    updated_at,
  } = stock;

  const getStockStatus = () => {
    if (quantity <= 0) return { label: 'Out of Stock', color: 'red', icon: 'close-circle' };
    if (quantity < 10) return { label: 'Low Stock', color: 'yellow', icon: 'alert' };
    return { label: 'In Stock', color: 'green', icon: 'check-circle' };
  };

  const status = getStockStatus();

  const handlePress = () => {
    navigation.navigate("StockDetail", { stockId: id });
  };

  const handleEdit = () => {
    setShowActions(false);
    navigation.navigate("AddStock", { stockId: id });
  };

  const handleAddQuantity = () => {
    setShowActions(false);
    navigation.navigate("AddStockQuantity", { 
      stockId: id, 
      productName: product?.name 
    });
  };

  const handleDelete = () => {
    setShowActions(false);
    Alert.alert(
      "Delete Stock Entry", 
      `Are you sure you want to delete stock entry for "${product?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (onDelete) {
              const result = await onDelete(id);
              if (result?.success) {
                Alert.alert("Success", "Stock entry deleted successfully");
              } else {
                Alert.alert("Error", result?.error || "Failed to delete stock entry");
              }
            }
          },
        },
      ]
    );
  };

  const handleLongPress = () => {
    setShowActions(true);
  };

  // Get gradient based on stock status
  const getGradientColors = () => {
    if (quantity <= 0) return ["#ef4444", "#b91c1c"]; // Red for out of stock
    if (quantity < 10) return ["#f59e0b", "#b45309"]; // Orange for low stock
    return ["#10b981", "#047857"]; // Green for in stock
  };

  const gradientColors = getGradientColors();

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
        {/* Header with Gradient */}
        <LinearGradient
          colors={gradientColors}
          className="p-4"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
                <Icon name="package-variant" size={24} color="#ffffff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-lg font-bold" numberOfLines={1}>
                  {product?.name || 'Unknown Product'}
                </Text>
                {product?.sku && (
                  <Text className="text-white/80 text-xs" numberOfLines={1}>
                    SKU: {product.sku}
                  </Text>
                )}
              </View>
            </View>

            {/* Status Badge */}
            <View className="bg-white/20 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">
                {status.label}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Body */}
        <View className="p-4">
          {/* Quantity and Price */}
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Quantity
              </Text>
              <View className="flex-row items-baseline">
                <Text className={`text-2xl font-bold ${
                  quantity <= 0 
                    ? 'text-red-500' 
                    : quantity < 10 
                      ? 'text-yellow-500' 
                      : isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {quantity}
                </Text>
                <Text className={`ml-1 text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {unit_code || 'units'}
                </Text>
              </View>
            </View>
            
            <View>
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Selling Price
              </Text>
              <Text className={`text-xl font-bold text-green-500`}>
                ${parseFloat(selling_price || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Info Grid */}
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Purchase Price
              </Text>
              <Text className={`text-sm font-medium ${
                purchase_price 
                  ? isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  : 'text-gray-400'
              }`}>
                {purchase_price ? `$${parseFloat(purchase_price).toFixed(2)}` : 'N/A'}
              </Text>
            </View>

            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Total Value
              </Text>
              <Text className={`text-sm font-medium text-blue-500`}>
                ${(parseFloat(quantity || 0) * parseFloat(selling_price || 0)).toFixed(2)}
              </Text>
            </View>

            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Product ID
              </Text>
              <Text className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                #{stock.product_id}
              </Text>
            </View>

            <View className="w-1/2 mb-2">
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Last Updated
              </Text>
              <Text className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {new Date(updated_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Quick Add Button */}
          <TouchableOpacity
            onPress={handleAddQuantity}
            className="mt-3 bg-green-500 py-2 rounded-xl flex-row items-center justify-center"
          >
            <Icon name="plus-circle" size={18} color="#ffffff" />
            <Text className="text-white font-medium ml-1">Add Stock</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Action Modal */}
      <Modal
        visible={showActions}
        transparent
        animationType="slide"
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
                {product?.name || 'Stock Entry'}
              </Text>

              <TouchableOpacity
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                }`}
                onPress={handleAddQuantity}
              >
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                }`}>
                  <Icon name="plus-circle" size={22} color="#10b981" />
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
                    Increase quantity
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

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
                    Edit Stock
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Modify stock details
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
                  <Icon name="delete" size={22} color="#ef4444" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className={`text-base font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Delete Stock
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

export default StockCard;