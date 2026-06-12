// components/stocks/StockForm.js
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../store/themeStore';
import SearchSelect from '../common/SearchSelect';

const StockForm = ({ initialData, mode = 'add', onSubmit, onCancel, isSubmitting, products, units }) => {
  const { isDarkMode } = useThemeStore();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    selling_price: '',
    purchase_price: '',
    unit_id: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Debug logs
  console.log('StockForm - products available:', products?.length);
  console.log('StockForm - initialData:', initialData);
  console.log('StockForm - mode:', mode);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        product_id: initialData.product_id?.toString() || '',
        quantity: initialData.quantity?.toString() || '',
        selling_price: initialData.selling_price?.toString() || '',
        purchase_price: initialData.purchase_price?.toString() || '',
        unit_id: initialData.unit_id?.toString() || '',
      });
      
      // Find and set selected product for edit mode
      const product = products?.find(p => p.id === initialData.product_id);
      if (product) {
        console.log('StockForm - Found product for edit:', product.name);
        setSelectedProduct(product);
      } else if (initialData.product) {
        // If product is embedded in stock data
        console.log('StockForm - Using embedded product:', initialData.product.name);
        setSelectedProduct(initialData.product);
      }
    }
  }, [initialData, mode, products]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) setValidationErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleProductSelect = (product) => {
    console.log('StockForm - Product selected:', product);
    setSelectedProduct(product);
    handleChange('product_id', product.id.toString());
    if (!formData.selling_price && product.selling_price) {
      handleChange('selling_price', product.selling_price.toString());
    }
    if (!formData.purchase_price && product.purchase_price) {
      handleChange('purchase_price', product.purchase_price.toString());
    }
    if (!formData.unit_id && product.unit_id) {
      handleChange('unit_id', product.unit_id.toString());
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.product_id) errors.product_id = 'Product is required';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) errors.quantity = 'Valid quantity is required';
    if (!formData.unit_id) errors.unit_id = 'Unit is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit({
      ...formData,
      quantity: parseInt(formData.quantity),
      selling_price: parseFloat(formData.selling_price) || 0,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      unit_id: parseInt(formData.unit_id),
    });
  };

  // Prepare product options - ensure products is an array
  const productOptions = Array.isArray(products) ? products.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku || '',
    selling_price: p.selling_price,
    purchase_price: p.purchase_price,
    unit_id: p.unit_id,
  })) : [];

  console.log('StockForm - productOptions count:', productOptions.length);

  const inputClasses = `rounded-xl px-4 py-3 ${isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"} border`;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Product Selection */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Product <Text className="text-red-500">*</Text>
        </Text>
        <SearchSelect 
          options={productOptions} 
          value={selectedProduct} 
          onSelect={handleProductSelect} 
          placeholder="Search product by name or SKU..." 
          isDarkMode={isDarkMode} 
        />
        {validationErrors.product_id && <Text className="text-red-500 text-xs mt-1">{validationErrors.product_id}</Text>}
      </View>

      {/* Quantity */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Quantity <Text className="text-red-500">*</Text>
        </Text>
        <TextInput 
          value={formData.quantity} 
          onChangeText={(value) => handleChange('quantity', value)} 
          placeholder="Enter quantity" 
          keyboardType="numeric" 
          placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"} 
          className={`${inputClasses} ${validationErrors.quantity ? 'border-red-500' : ''}`} 
        />
        {validationErrors.quantity && <Text className="text-red-500 text-xs mt-1">{validationErrors.quantity}</Text>}
      </View>

      {/* Selling Price */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Selling Price</Text>
        <TextInput 
          value={formData.selling_price} 
          onChangeText={(value) => handleChange('selling_price', value)} 
          placeholder="Enter selling price" 
          keyboardType="numeric" 
          placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"} 
          className={inputClasses} 
        />
      </View>

      {/* Purchase Price */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Purchase Price</Text>
        <TextInput 
          value={formData.purchase_price} 
          onChangeText={(value) => handleChange('purchase_price', value)} 
          placeholder="Enter purchase price" 
          keyboardType="numeric" 
          placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"} 
          className={inputClasses} 
        />
      </View>

      {/* Unit Selection */}
      <View className="mb-6">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Unit <Text className="text-red-500">*</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {(units || []).map((unit) => (
            <TouchableOpacity 
              key={unit.id} 
              onPress={() => handleChange('unit_id', unit.id.toString())} 
              className={`px-4 py-2 rounded-full mr-2 border ${formData.unit_id === unit.id.toString() ? "bg-blue-500 border-blue-500" : isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              <Text className={`text-sm ${formData.unit_id === unit.id.toString() ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                {unit.name} ({unit.code})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {validationErrors.unit_id && <Text className="text-red-500 text-xs mt-1">{validationErrors.unit_id}</Text>}
      </View>

      {Object.keys(validationErrors).length > 0 && (
        <View className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <Text className="text-red-600 dark:text-red-400 font-semibold mb-2">Please fix the following errors:</Text>
          {Object.entries(validationErrors).map(([field, message]) => (
            <Text key={field} className="text-red-600 dark:text-red-400 text-sm">• {message}</Text>
          ))}
        </View>
      )}

      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity onPress={onCancel} className={`flex-1 py-4 rounded-xl border ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
          <Text className={`text-center font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} className={`flex-1 bg-blue-500 py-4 rounded-xl flex-row items-center justify-center ${isSubmitting ? 'opacity-50' : ''}`}>
          {isSubmitting ? (
            <><ActivityIndicator size="small" color="#ffffff" /><Text className="text-white text-center font-semibold text-base ml-2">Saving...</Text></>
          ) : (
            <Text className="text-white text-center font-semibold text-base">{mode === 'edit' ? 'Update Stock' : 'Create Stock'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default StockForm;