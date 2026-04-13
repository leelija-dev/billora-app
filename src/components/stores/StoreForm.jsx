import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useStoreForm } from '../../hooks/useStoreForm';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const StoreForm = ({ storeId }) => {
  const { isDarkMode } = useThemeStore();
  const { 
    formData, 
    loading, 
    error, 
    validationErrors, 
    handleChange, 
    saveStore 
  } = useStoreForm(storeId);

  const handleSubmit = async () => {
    const result = await saveStore(formData);
    
    if (result.success) {
      Alert.alert(
        'Success', 
        storeId ? 'Store updated successfully' : 'Store created successfully',
        [{ text: 'OK' }]
      );
    } else {
      if (result.error && !validationErrors) {
        Alert.alert('Error', result.error);
      }
    }
  };

  return (
    <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
      {/* Store Name Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Store Name <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Enter store name"
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          className={`rounded-xl px-4 py-3 ${
            isDarkMode 
              ? 'bg-gray-800 text-white border-gray-700' 
              : 'bg-white text-gray-900 border-gray-200'
          } border ${
            validationErrors.name ? 'border-red-500' : ''
          }`}
        />
        {validationErrors.name && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.name}
          </Text>
        )}
      </View>

      {/* Email Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Email <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={formData.email}
          onChangeText={(value) => handleChange('email', value)}
          placeholder="Enter store email"
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          keyboardType="email-address"
          autoCapitalize="none"
          className={`rounded-xl px-4 py-3 ${
            isDarkMode 
              ? 'bg-gray-800 text-white border-gray-700' 
              : 'bg-white text-gray-900 border-gray-200'
          } border ${
            validationErrors.email ? 'border-red-500' : ''
          }`}
        />
        {validationErrors.email && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.email}
          </Text>
        )}
      </View>

      {/* Mobile Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Mobile Number
        </Text>
        <TextInput
          value={formData.mobile}
          onChangeText={(value) => handleChange('mobile', value)}
          placeholder="Enter mobile number"
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          keyboardType="phone-pad"
          className={`rounded-xl px-4 py-3 ${
            isDarkMode 
              ? 'bg-gray-800 text-white border-gray-700' 
              : 'bg-white text-gray-900 border-gray-200'
          } border`}
        />
      </View>

      {/* GST Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          GST Number
        </Text>
        <TextInput
          value={formData.gst}
          onChangeText={(value) => handleChange('gst', value)}
          placeholder="Enter GST number"
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          autoCapitalize="characters"
          className={`rounded-xl px-4 py-3 ${
            isDarkMode 
              ? 'bg-gray-800 text-white border-gray-700' 
              : 'bg-white text-gray-900 border-gray-200'
          } border`}
        />
      </View>

      {/* Address Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Address <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={formData.address}
          onChangeText={(value) => handleChange('address', value)}
          placeholder="Enter store address"
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className={`rounded-xl px-4 py-3 min-h-[80px] ${
            isDarkMode 
              ? 'bg-gray-800 text-white border-gray-700' 
              : 'bg-white text-gray-900 border-gray-200'
          } border ${
            validationErrors.address ? 'border-red-500' : ''
          }`}
        />
        {validationErrors.address && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.address}
          </Text>
        )}
      </View>

      {/* City Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          City <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={formData.city}
          onChangeText={(value) => handleChange('city', value)}
          placeholder="Enter city"
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          className={`rounded-xl px-4 py-3 ${
            isDarkMode 
              ? 'bg-gray-800 text-white border-gray-700' 
              : 'bg-white text-gray-900 border-gray-200'
          } border ${
            validationErrors.city ? 'border-red-500' : ''
          }`}
        />
        {validationErrors.city && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.city}
          </Text>
        )}
      </View>

      {/* Logo Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Logo URL
        </Text>
        <TextInput
          value={formData.logo}
          onChangeText={(value) => handleChange('logo', value)}
          placeholder="Enter logo URL"
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          className={`rounded-xl px-4 py-3 ${
            isDarkMode 
              ? 'bg-gray-800 text-white border-gray-700' 
              : 'bg-white text-gray-900 border-gray-200'
          } border`}
        />
      </View>

      {/* Status Switch */}
      <View className="mb-6">
        <View className={`flex-row items-center justify-between p-4 rounded-xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <View className="flex-row items-center">
            <Icon 
              name={formData.status ? "store-check" : "store-off"} 
              size={24} 
              color={formData.status ? "#10b981" : "#9ca3af"} 
            />
            <Text className={`ml-3 text-base font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Store Status
            </Text>
          </View>
          <Switch
            value={formData.status}
            onValueChange={(value) => handleChange('status', value)}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor="#ffffff"
          />
        </View>
        <Text className={`text-xs mt-1 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {formData.status 
            ? 'Store is active and visible' 
            : 'Store is inactive and hidden'}
        </Text>
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
        disabled={loading}
        className={`bg-blue-500 py-4 rounded-xl mb-6 flex-row items-center justify-center ${
          loading ? 'opacity-50' : ''
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
            {storeId ? 'Update Store' : 'Create Store'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default StoreForm;