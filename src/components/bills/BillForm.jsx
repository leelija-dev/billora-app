import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useThemeStore } from '../../store/themeStore';
import { useBillForm } from '../../hooks/useBillForm';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useEffect } from 'react';

const BillForm = ({ billId }) => {
  const { isDarkMode } = useThemeStore();
  const { 
    formData,
    items,
    products,
    customers,
    stores,
    loading,
    error,
    validationErrors,
    handleChange,
    addItem,
    updateItem,
    removeItem,
    calculateSubtotal,
    calculateTotalGST,
    calculateTotalDiscount,
    calculateGrandTotal,
    calculateChange,
    saveBill,
  } = useBillForm(billId);

  const handleSubmit = async () => {
    const result = await saveBill();
    
    if (!result.success) {
      if (result.error && !validationErrors) {
        Alert.alert('Error', result.error);
      }
    }
  };

  const renderItemRow = (item, index) => (
    <View key={item.id} className={`mb-4 p-4 rounded-xl ${
      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
    }`}>
      <View className="flex-row justify-between items-center mb-3">
        <Text className={`font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          Item #{index + 1}
        </Text>
        <TouchableOpacity
          onPress={() => removeItem(index)}
          className="bg-red-500 w-8 h-8 rounded-full items-center justify-center"
        >
          <Icon name="close" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Product Selection */}
      <View className="mb-3">
        <Text className={`text-xs mb-1 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Product <Text className="text-red-500">*</Text>
        </Text>
        <View className={`rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-200'
        }`}>
          <Picker
            selectedValue={item.productId}
            onValueChange={(value) => updateItem(index, 'productId', value)}
            style={{ 
              color: isDarkMode ? '#FFFFFF' : '#1F2937',
              backgroundColor: 'transparent',
            }}
            dropdownIconColor={isDarkMode ? '#9CA3AF' : '#4B5563'}
          >
            <Picker.Item label="Select product..." value="" />
            {products.map((product) => (
              <Picker.Item 
                key={product.id} 
                label={`${product.name} - $${product.selling_price}`} 
                value={product.id.toString()} 
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Quantity and Price Row */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Text className={`text-xs mb-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Quantity <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={item.quantity}
            onChangeText={(value) => updateItem(index, 'quantity', value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            className={`rounded-xl px-4 py-3 border ${
              isDarkMode 
                ? 'bg-gray-800 text-white border-gray-600' 
                : 'bg-white text-gray-800 border-gray-200'
            }`}
          />
        </View>

        <View className="flex-1">
          <Text className={`text-xs mb-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Price ($)
          </Text>
          <TextInput
            value={item.price}
            onChangeText={(value) => updateItem(index, 'price', value)}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            className={`rounded-xl px-4 py-3 border ${
              isDarkMode 
                ? 'bg-gray-800 text-white border-gray-600' 
                : 'bg-white text-gray-800 border-gray-200'
            }`}
          />
        </View>
      </View>

      {/* GST and Discount Row */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Text className={`text-xs mb-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            GST (%)
          </Text>
          <TextInput
            value={item.gst}
            onChangeText={(value) => updateItem(index, 'gst', value)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            className={`rounded-xl px-4 py-3 border ${
              isDarkMode 
                ? 'bg-gray-800 text-white border-gray-600' 
                : 'bg-white text-gray-800 border-gray-200'
            }`}
          />
        </View>

        <View className="flex-1">
          <Text className={`text-xs mb-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Discount (%)
          </Text>
          <TextInput
            value={item.discount}
            onChangeText={(value) => updateItem(index, 'discount', value)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            className={`rounded-xl px-4 py-3 border ${
              isDarkMode 
                ? 'bg-gray-800 text-white border-gray-600' 
                : 'bg-white text-gray-800 border-gray-200'
            }`}
          />
        </View>
      </View>

      {/* Item Total */}
      <View className={`mt-2 pt-2 border-t ${
        isDarkMode ? 'border-gray-600' : 'border-gray-300'
      }`}>
        <View className="flex-row justify-between">
          <Text className={`font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Item Total
          </Text>
          <Text className="text-lg font-bold text-green-500">
            ${item.totalPrice?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      {/* Validation Error for this item */}
      {validationErrors[`item_${index}_product`] && (
        <Text className="text-red-500 text-xs mt-1">
          {validationErrors[`item_${index}_product`]}
        </Text>
      )}
      {validationErrors[`item_${index}_quantity`] && (
        <Text className="text-red-500 text-xs mt-1">
          {validationErrors[`item_${index}_quantity`]}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
      {/* Customer Selection */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Customer <Text className="text-red-500">*</Text>
        </Text>
        <View className={`rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } ${validationErrors.customerId ? 'border-red-500' : ''}`}>
          <Picker
            selectedValue={formData.customerId}
            onValueChange={(value) => handleChange('customerId', value)}
            style={{ 
              color: isDarkMode ? '#FFFFFF' : '#1F2937',
              backgroundColor: 'transparent',
            }}
            dropdownIconColor={isDarkMode ? '#9CA3AF' : '#4B5563'}
          >
            <Picker.Item label="Select customer..." value="" />
            {customers.map((customer) => (
              <Picker.Item 
                key={customer.id} 
                label={`${customer.name} ${customer.phone ? `- ${customer.phone}` : ''}`} 
                value={customer.id.toString()} 
              />
            ))}
          </Picker>
        </View>
        {validationErrors.customerId && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.customerId}
          </Text>
        )}
      </View>

      {/* Store Selection */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Store <Text className="text-red-500">*</Text>
        </Text>
        <View className={`rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } ${validationErrors.storeId ? 'border-red-500' : ''}`}>
          <Picker
            selectedValue={formData.storeId}
            onValueChange={(value) => handleChange('storeId', value)}
            style={{ 
              color: isDarkMode ? '#FFFFFF' : '#1F2937',
              backgroundColor: 'transparent',
            }}
            dropdownIconColor={isDarkMode ? '#9CA3AF' : '#4B5563'}
          >
            <Picker.Item label="Select store..." value="" />
            {stores.map((store) => (
              <Picker.Item 
                key={store.id} 
                label={store.name} 
                value={store.id.toString()} 
              />
            ))}
          </Picker>
        </View>
        {validationErrors.storeId && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.storeId}
          </Text>
        )}
      </View>

      {/* Items Section */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className={`text-base font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Items
          </Text>
          <TouchableOpacity
            onPress={addItem}
            className="bg-blue-500 px-4 py-2 rounded-xl flex-row items-center"
          >
            <Icon name="plus" size={18} color="#ffffff" />
            <Text className="text-white font-medium ml-1">Add Item</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => renderItemRow(item, index))}

        {items.length === 0 && (
          <View className={`p-8 rounded-xl items-center ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <Icon name="cart-off" size={48} color="#9ca3af" />
            <Text className={`text-center mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No items added yet. Click "Add Item" to start.
            </Text>
          </View>
        )}

        {validationErrors.items && (
          <Text className="text-red-500 text-xs mt-2">
            {validationErrors.items}
          </Text>
        )}
      </View>

      {/* Summary Section */}
      {items.length > 0 && (
        <View className={`mb-6 p-4 rounded-xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Text className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Bill Summary
          </Text>

          <View className="flex-row justify-between mb-2">
            <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Subtotal
            </Text>
            <Text className={isDarkMode ? 'text-white' : 'text-gray-800'}>
              ${calculateSubtotal().toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Total GST
            </Text>
            <Text className={isDarkMode ? 'text-white' : 'text-gray-800'}>
              ${calculateTotalGST().toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              Total Discount
            </Text>
            <Text className="text-green-500">
              -${calculateTotalDiscount().toFixed(2)}
            </Text>
          </View>

          <View className={`flex-row justify-between mt-2 pt-2 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <Text className={`text-lg font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Grand Total
            </Text>
            <Text className="text-lg font-bold text-blue-500">
              ${calculateGrandTotal().toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Payment Section */}
      <View className="mb-6">
        <Text className={`text-base font-semibold mb-3 ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          Payment
        </Text>

        {/* Paid Amount */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Paid Amount <Text className="text-red-500">*</Text>
          </Text>
          <View className={`flex-row items-center rounded-xl px-4 border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          } ${validationErrors.paidAmount ? 'border-red-500' : ''}`}>
            <Text className="text-gray-500 font-bold text-lg">$</Text>
            <TextInput
              value={formData.paidAmount}
              onChangeText={(value) => handleChange('paidAmount', value)}
              placeholder="0.00"
              placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
              keyboardType="decimal-pad"
              className={`flex-1 ml-2 py-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}
            />
          </View>
          {validationErrors.paidAmount && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.paidAmount}
            </Text>
          )}
        </View>

        {/* Payment Summary - Simplified */}
        {calculateGrandTotal() > 0 && (
          <View className={`p-4 rounded-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <View className="flex-row justify-between">
              <Text className={`font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Total Amount
              </Text>
              <Text className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                ${calculateGrandTotal().toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Validation Errors Display */}
      {Object.keys(validationErrors).length > 0 && (
        <View className="mb-4 p-4 bg-red-100 rounded-xl">
          <Text className="text-red-600 font-semibold mb-2">Please fix the following errors:</Text>
          {Object.entries(validationErrors).map(([field, message]) => (
            <Text key={field} className="text-red-600 text-sm">
              • {message}
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
        disabled={loading || items.length === 0}
        className={`bg-blue-500 py-4 rounded-xl mb-6 flex-row items-center justify-center ${
          (loading || items.length === 0) ? 'opacity-50' : ''
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
            {billId ? 'Update Bill' : 'Generate Bill'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default BillForm;