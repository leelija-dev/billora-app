import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useStockDetail } from "../../hooks/useStockDetail";
import { stocksAPI } from "../../api/stocks";

const AddStockQuantityScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { stockId, productName } = route.params || {};
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { stock, loading: loadingStock } = useStockDetail(stockId);
  
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddQuantity = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = user?.id || user?.user_id || '1';
      
      const response = await stocksAPI.addStock(stockId, {
        quantity: parseInt(quantity),
        userId: userId,
      });

      if (response?.status === true || response?.data?.status === true) {
        Alert.alert(
          'Success', 
          'Stock quantity added successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(response?.message || 'Failed to add stock');
      }
    } catch (err) {
      console.error('Error adding stock:', err);
      setError(err.message || 'Failed to add stock');
      Alert.alert('Error', err.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        {/* Header */}
        <View className={`px-4 py-3 flex-row items-center border-b ${
          isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Icon 
              name="arrow-left" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#1F2937'} 
            />
          </TouchableOpacity>
          <Text className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Add Stock Quantity
          </Text>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Product Info Card */}
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            className="rounded-2xl p-5 mt-4 mb-6"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
                <Icon name="package-variant" size={24} color="#ffffff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white/80 text-xs">Product</Text>
                <Text className="text-white text-lg font-bold" numberOfLines={1}>
                  {productName || stock?.product?.name || 'Product'}
                </Text>
                {stock?.product?.sku && (
                  <Text className="text-white/60 text-xs">
                    SKU: {stock.product.sku}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row mt-4 pt-4 border-t border-white/20">
              <View className="flex-1">
                <Text className="text-white/80 text-xs">Current Quantity</Text>
                <Text className="text-white text-2xl font-bold">
                  {stock?.quantity || 0}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white/80 text-xs">Unit</Text>
                <Text className="text-white text-2xl font-bold">
                  {stock?.unit_code || 'Unit'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Quantity Input Card */}
          <View className={`rounded-2xl p-5 mb-6 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-base font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Enter Quantity to Add
            </Text>

            <View className="mb-2">
              <Text className={`text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Quantity <Text className="text-red-500">*</Text>
              </Text>
              <View className={`flex-row items-center rounded-xl px-4 border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
              }`}>
                <Icon name="counter" size={20} color="#9ca3af" />
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Enter quantity"
                  placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                  keyboardType="numeric"
                  className={`flex-1 ml-3 py-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                />
              </View>
              <Text className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Enter the quantity to add to current stock
              </Text>
            </View>

            {/* Summary */}
            {quantity && parseFloat(quantity) > 0 && (
              <View className={`mt-4 p-4 rounded-xl ${
                isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
              }`}>
                <Text className={`text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  Summary
                </Text>
                <View className="flex-row justify-between">
                  <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Current Stock:
                  </Text>
                  <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {stock?.quantity || 0}
                  </Text>
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    Adding:
                  </Text>
                  <Text className={`font-semibold text-green-500`}>
                    +{quantity}
                  </Text>
                </View>
                <View className="flex-row justify-between mt-1 pt-2 border-t border-blue-200">
                  <Text className={`font-semibold ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    New Stock:
                  </Text>
                  <Text className={`font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {(stock?.quantity || 0) + parseFloat(quantity)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Error Display */}
          {error && (
            <View className="mb-4 p-4 bg-red-100 rounded-xl">
              <Text className="text-red-600 text-center">{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className={`flex-1 py-4 rounded-xl items-center border ${
                isDarkMode 
                  ? 'border-gray-700 bg-gray-800' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Text className={`font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddQuantity}
              disabled={loading || !quantity}
              className={`flex-1 bg-green-500 py-4 rounded-xl items-center ${
                (loading || !quantity) ? 'opacity-50' : ''
              }`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold">Add Stock</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AddStockQuantityScreen;