import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useThemeStore } from '../../store/themeStore';
import { useStockForm } from '../../hooks/useStockForm';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';

const StockForm = ({ stockId }) => {
  const { isDarkMode } = useThemeStore();
  const { 
    formData, 
    products,
    units,
    loading, 
    error, 
    validationErrors, 
    handleChange, 
    saveStock,
    fetchProducts,
    getBrandAndCategoryNames,
  } = useStockForm(stockId);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async () => {
    const result = await saveStock(formData);
    
    if (result.success) {
      Alert.alert(
        'Success', 
        stockId ? 'Stock entry updated successfully' : 'Stock entry created successfully',
        [{ text: 'OK' }]
      );
    } else {
      if (result.error && !validationErrors) {
        Alert.alert('Error', result.error);
      }
    }
  };

  const selectedProduct = products.find(p => p.id.toString() === formData.productId);
  const { brandName, categoryName } = getBrandAndCategoryNames(formData.productId);

  return (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
      {/* Product Selection */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Select Product <Text className="text-red-500">*</Text>
        </Text>
        <View className={`rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } ${validationErrors.productId ? 'border-red-500' : ''}`}>
          <Picker
            selectedValue={formData.productId}
            onValueChange={(value) => handleChange('productId', value)}
            enabled={!stockId} // Disable product selection when editing
            style={{ 
              color: isDarkMode ? '#FFFFFF' : '#1F2937',
              backgroundColor: 'transparent',
            }}
            dropdownIconColor={isDarkMode ? '#9CA3AF' : '#4B5563'}
          >
            <Picker.Item label="Select a product..." value="" />
            {products.map((product) => (
              <Picker.Item 
                key={product.id} 
                label={`${product.name} (${product.sku || 'No SKU'})`} 
                value={product.id.toString()} 
              />
            ))}
          </Picker>
        </View>
        {validationErrors.productId && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.productId}
          </Text>
        )}
      </View>

      {/* Product Info Card (shown when product selected) */}
      {selectedProduct && (
        <View className={`mb-4 p-4 rounded-xl ${
          isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
        }`}>
          <View className="flex-row items-center mb-2">
            <Icon name="information" size={20} color="#3b82f6" />
            <Text className={`ml-2 text-sm font-semibold ${
              isDarkMode ? 'text-blue-300' : 'text-blue-700'
            }`}>
              Product Information
            </Text>
          </View>
          <View className="flex-row">
            <View className="flex-1">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Brand
              </Text>
              <Text className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                
              </Text>
               <Text className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {brandName}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Category
              </Text>
             
              <Text className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {categoryName}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quantity Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Quantity <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } ${validationErrors.quantity ? 'border-red-500' : ''}`}>
          <Icon name="counter" size={20} color="#9ca3af" />
          <TextInput
            value={formData.quantity}
            onChangeText={(value) => handleChange('quantity', value)}
            placeholder="Enter quantity"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            keyboardType="numeric"
            className={`flex-1 ml-3 py-3 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
          />
        </View>
        {validationErrors.quantity && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.quantity}
          </Text>
        )}
      </View>

      {/* Selling Price Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Selling Price <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } ${validationErrors.sellingPrice ? 'border-red-500' : ''}`}>
          <Text className="text-gray-500 font-bold text-lg">$</Text>
          <TextInput
            value={formData.sellingPrice}
            onChangeText={(value) => handleChange('sellingPrice', value)}
            placeholder="0.00"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            keyboardType="decimal-pad"
            className={`flex-1 ml-2 py-3 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
          />
        </View>
        {validationErrors.sellingPrice && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.sellingPrice}
          </Text>
        )}
      </View>

      {/* Purchase Price Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Purchase Price
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <Text className="text-gray-500 font-bold text-lg">$</Text>
          <TextInput
            value={formData.purchasePrice}
            onChangeText={(value) => handleChange('purchasePrice', value)}
            placeholder="0.00"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            keyboardType="decimal-pad"
            className={`flex-1 ml-2 py-3 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
          />
        </View>
      </View>

      {/* Unit Selection */}
      <View className="mb-6">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Unit
        </Text>
        <View className={`rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <Picker
            selectedValue={formData.unitId}
            onValueChange={(value) => handleChange('unitId', value)}
            style={{ 
              color: isDarkMode ? '#FFFFFF' : '#1F2937',
              backgroundColor: 'transparent',
            }}
            dropdownIconColor={isDarkMode ? '#9CA3AF' : '#4B5563'}
          >
            <Picker.Item label="Select unit (optional)" value="" />
            {units.map((unit) => (
              <Picker.Item 
                key={unit.id} 
                label={`${unit.code} - ${unit.name}`} 
                value={unit.id.toString()} 
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Validation Errors Display */}
      {Object.keys(validationErrors).length > 0 && (
        <View className="mb-4 p-4 bg-red-100 rounded-xl">
          <Text className="text-red-600 font-semibold mb-2">Please fix the following errors:</Text>
          {Object.entries(validationErrors).map(([field, messages]) => (
            <Text key={field} className="text-red-600 text-sm">
              • {Array.isArray(messages) ? messages.join(', ') : messages}
            </Text>
          ))}
        </View>
      )}

      {/* Error Display */}
      {error && Object.keys(validationErrors).length === 0 && (
        <View className="mb-4 p-4 bg-red-100 rounded-xl">
          <Text className="text-red-600 text-center">{error}</Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading || !formData.productId}
        className={`bg-blue-500 py-4 rounded-xl mb-6 flex-row items-center justify-center ${
          (loading || !formData.productId) ? 'opacity-50' : ''
        }`}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text className="text-white text-center font-semibold text-base ml-2">
              Saving...
            </Text>
          </>
        ) : (
          <Text className="text-white text-center font-semibold text-base">
            {stockId ? 'Update Stock Entry' : 'Create Stock Entry'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default StockForm;