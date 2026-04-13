import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useStockDetail } from "../../hooks/useStockDetail";
import ErrorState from "../../components/common/ErrorState";
import Loading from "../../components/common/Loading";

const StockDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { stockId } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { 
    stock, 
    loading, 
    error, 
    updateStock, 
    addStock,
    deleteStock,
  } = useStockDetail(stockId);

  const handleEdit = () => {
    navigation.navigate("AddStock", { stockId });
  };

  const handleAddQuantity = () => {
    navigation.navigate("AddStockQuantity", { 
      stockId, 
      productName: stock?.product?.name 
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Stock Entry",
      "Are you sure you want to delete this stock entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteStock();
            if (result.success) {
              Alert.alert("Success", "Stock entry deleted successfully");
              navigation.goBack();
            } else {
              Alert.alert("Error", result.error || "Failed to delete stock entry");
            }
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      const sellingPrice = parseFloat(stock?.selling_price) || 0;
      const quantity = parseFloat(stock?.quantity) || 0;
      const value = (quantity * sellingPrice).toFixed(2);
      
      await Share.share({
        message: `Stock Entry\nProduct: ${stock?.product?.name}\nQuantity: ${quantity} ${stock?.unit_code || stock?.product?.unit_code || ''}\nSelling Price: $${sellingPrice.toFixed(2)}\nValue: $${value}`,
        title: `Stock - ${stock?.product?.name}`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStockStatus = () => {
    if (!stock) return { label: 'Unknown', color: 'gray' };
    if (stock.quantity <= 0) return { label: 'Out of Stock', color: 'red' };
    if (stock.quantity < 10) return { label: 'Low Stock', color: 'yellow' };
    return { label: 'In Stock', color: 'green' };
  };

  const status = getStockStatus();

  // Helper function to safely get values from nested objects
  const getBrandName = () => {
    if (!stock?.product) return 'N/A';
    
    // Check if brand is an array with one item
    if (stock.product.brand && Array.isArray(stock.product.brand) && stock.product.brand.length > 0) {
      return stock.product.brand[0]?.name || 'N/A';
    }
    
    // Check if brand is an object with name property
    if (stock.product.brand && typeof stock.product.brand === 'object') {
      return stock.product.brand.name || 'N/A';
    }
    
    // Check if brand_name is directly available
    if (stock.product.brand_name && stock.product.brand_name !== 'N/A') {
      return stock.product.brand_name;
    }
    
    return 'N/A';
  };

  const getUnitCode = () => {
    // First check if unit is directly on stock
    if (stock?.unit_code && stock.unit_code !== 'N/A') {
      return stock.unit_code;
    }
    
    // Then check product's unit
    if (stock?.product) {
      // Check if unit is an object with code property
      if (stock.product.unit && Array.isArray(stock.product.unit) && stock.product.unit.length > 0) {
        return stock.product.unit[0]?.code || 'N/A';
      }
      
      // Check if unit_code is directly on product
      if (stock.product.unit_code && stock.product.unit_code !== 'N/A') {
        return stock.product.unit_code;
      }
      
      // Check if unit_name is available
      if (stock.product.unit_name && stock.product.unit_name !== 'N/A') {
        return stock.product.unit_name;
      }
    }
    
    return 'N/A';
  };

  const getUnitName = () => {
    // First check if unit is directly on stock
    if (stock?.unit_name && stock.unit_name !== 'N/A') {
      return stock.unit_name;
    }
    
    // Then check product's unit
    if (stock?.product) {
      // Check if unit is an object with name property
      if (stock.product.unit && Array.isArray(stock.product.unit) && stock.product.unit.length > 0) {
        return stock.product.unit[0]?.name || 'N/A';
      }
      
      // Check if unit_name is directly on product
      if (stock.product.unit_name && stock.product.unit_name !== 'N/A') {
        return stock.product.unit_name;
      }
    }
    
    return 'N/A';
  };

  const getCategoryName = () => {
    if (!stock?.product) return 'N/A';
    
    // Check if category is an object with name property
    if (stock.product.category && typeof stock.product.category === 'object') {
      return stock.product.category.name || 'N/A';
    }
    
    // Check if category_name is directly available
    if (stock.product.category_name && stock.product.category_name !== 'N/A') {
      return stock.product.category_name;
    }
    
    return 'N/A';
  };

  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
          <View className={`px-4 py-3 flex-row items-center border-b ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon name="arrow-left" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
            </TouchableOpacity>
            <Text className={`flex-1 text-center text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Stock Details
            </Text>
            <View className="w-10" />
          </View>
          <Loading text="Loading stock details..." />
        </SafeAreaView>
      </View>
    );
  }

  if (error || !stock) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
          <View className={`px-4 py-3 flex-row items-center border-b ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon name="arrow-left" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
            </TouchableOpacity>
            <Text className={`flex-1 text-center text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Stock Details
            </Text>
            <View className="w-10" />
          </View>
          <ErrorState
            title="Stock Entry Not Found"
            description="The stock entry you're looking for doesn't exist or couldn't be loaded."
            onRetry={() => navigation.goBack()}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className={`flex-1 pb-24 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Custom Header */}
        <View className={`px-4 py-3 flex-row items-center border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <Icon name="arrow-left" size={24} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
          </TouchableOpacity>
          <Text className={`flex-1 text-center text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Stock Details
          </Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleShare}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon name="share-variant" size={22} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}
            >
              <Icon name="pencil" size={22} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Product Header with Gradient */}
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            className="rounded-2xl p-6 mt-4 mb-4"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="flex-row items-center">
              <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center">
                <Icon name="package-variant" size={32} color="#ffffff" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-white/80 text-xs">Product</Text>
                <Text className="text-white text-xl font-bold" numberOfLines={1}>
                  {stock.product?.name || 'Unknown Product'}
                </Text>
                {stock.product?.sku && (
                  <Text className="text-white/60 text-sm">
                    SKU: {stock.product.sku}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row mt-6 pt-4 border-t border-white/20">
              <View className="flex-1 items-center">
                <Text className="text-white/80 text-xs">Quantity</Text>
                <Text className="text-white text-3xl font-bold">
                  {stock.quantity}
                </Text>
                <Text className="text-white/60 text-xs">
                  {getUnitCode()}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-white/80 text-xs">Status</Text>
                <View className={`px-3 py-1 rounded-full mt-1 ${
                  status.color === 'red' ? 'bg-red-500' :
                  status.color === 'yellow' ? 'bg-yellow-500' :
                  status.color === 'green' ? 'bg-green-500' :
                  'bg-gray-500'
                }`}>
                  <Text className="text-white text-xs font-medium">
                    {status.label}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={handleAddQuantity}
              className="flex-1 bg-green-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Icon name="plus-circle" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Add Stock</Text>
            </TouchableOpacity>
          </View>

          {/* Stock Details Grid */}
          <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Stock Information
            </Text>

            <View className="flex-row flex-wrap">
              <View className="w-1/2 mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Stock ID
                </Text>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  #{stock.id}
                </Text>
              </View>

              <View className="w-1/2 mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Product ID
                </Text>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  #{stock.product_id}
                </Text>
              </View>

              <View className="w-1/2 mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Selling Price
                </Text>
                <Text className={`text-sm font-bold text-green-500`}>
                  ${parseFloat(stock.selling_price || 0).toFixed(2)}
                </Text>
              </View>

              <View className="w-1/2 mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Purchase Price
                </Text>
                <Text className={`text-sm font-medium ${
                  stock.purchase_price 
                    ? isDarkMode ? 'text-white' : 'text-gray-800'
                    : 'text-gray-400'
                }`}>
                  {stock.purchase_price ? `$${parseFloat(stock.purchase_price).toFixed(2)}` : 'N/A'}
                </Text>
              </View>

              <View className="w-1/2 mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Unit
                </Text>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {getUnitName()} ({getUnitCode()})
                </Text>
              </View>

              <View className="w-1/2 mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Total Value
                </Text>
                <Text className={`text-sm font-bold text-blue-500`}>
                  ${(parseFloat(stock.quantity || 0) * parseFloat(stock.selling_price || 0)).toFixed(2)}
                </Text>
              </View>

              <View className="w-1/2 mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Created By
                </Text>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  #{stock.created_by || stock.user_id || 'N/A'}
                </Text>
              </View>

              <View className="w-1/2 mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Created At
                </Text>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {formatDate(stock.created_at)}
                </Text>
              </View>

              <View className="w-1/2 mb-4">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Last Updated
                </Text>
                <Text className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {formatDate(stock.updated_at)}
                </Text>
              </View>
            </View>
          </View>

          {/* Product Details */}
          {stock.product && (
            <View className={`rounded-2xl p-4 mb-4 shadow-sm ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <Text className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Product Details
              </Text>

              <View className="flex-row flex-wrap">
                <View className="w-1/2 mb-3">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Brand
                  </Text>
                  <Text className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {getBrandName()}
                  </Text>
                </View>

                <View className="w-1/2 mb-3">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Category
                  </Text>
                  <Text className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {getCategoryName()}
                  </Text>
                </View>

                <View className="w-1/2 mb-3">
                  <Text className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Unit
                  </Text>
                  <Text className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {getUnitName()} ({getUnitCode()})
                  </Text>
                </View>

                {stock.product.description && (
                  <View className="w-full mt-2">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Description
                    </Text>
                    <Text className={`text-sm mt-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {stock.product.description}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={handleDelete}
              className="flex-1 bg-red-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Icon name="delete" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEdit}
              className="flex-1 bg-blue-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Icon name="pencil" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Edit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default StockDetailScreen;