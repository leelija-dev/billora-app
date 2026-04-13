import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useCustomerForm } from '../../hooks/useCustomerForm';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomerForm = ({ customerId }) => {
  const { isDarkMode } = useThemeStore();
  const { 
    formData, 
    loading, 
    error, 
    validationErrors, 
    handleChange, 
    saveCustomer 
  } = useCustomerForm(customerId);

  const handleSubmit = async () => {
    const result = await saveCustomer(formData);
    
    if (result.success) {
      Alert.alert(
        'Success', 
        customerId ? 'Customer updated successfully' : 'Customer created successfully',
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
      {/* Name Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Customer Name <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } ${validationErrors.name ? 'border-red-500' : ''}`}>
          <Icon name="account" size={20} color="#9ca3af" />
          <TextInput
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter customer name"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            className={`flex-1 ml-3 py-3 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
          />
        </View>
        {validationErrors.name && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.name}
          </Text>
        )}
      </View>

      {/* Phone Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Phone Number <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } ${validationErrors.phone ? 'border-red-500' : ''}`}>
          <Icon name="phone" size={20} color="#9ca3af" />
          <TextInput
            value={formData.phone}
            onChangeText={(value) => handleChange('phone', value)}
            placeholder="Enter 10-digit phone number"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            keyboardType="phone-pad"
            maxLength={10}
            className={`flex-1 ml-3 py-3 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
          />
        </View>
        {validationErrors.phone && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.phone}
          </Text>
        )}
      </View>

      {/* Email Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Email Address
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } ${validationErrors.email ? 'border-red-500' : ''}`}>
          <Icon name="email" size={20} color="#9ca3af" />
          <TextInput
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            placeholder="Enter email address (optional)"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            keyboardType="email-address"
            autoCapitalize="none"
            className={`flex-1 ml-3 py-3 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
          />
        </View>
        {validationErrors.email && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.email}
          </Text>
        )}
      </View>

      {/* Address Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Address <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        } ${validationErrors.address ? 'border-red-500' : ''}`}>
          <Icon name="map-marker" size={20} color="#9ca3af" />
          <TextInput
            value={formData.address}
            onChangeText={(value) => handleChange('address', value)}
            placeholder="Enter street address"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            className={`flex-1 ml-3 py-3 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
          />
        </View>
        {validationErrors.address && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.address}
          </Text>
        )}
      </View>

      {/* City Field */}
      <View className="mb-6">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          City
        </Text>
        <View className={`flex-row items-center rounded-xl px-4 border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <Icon name="city" size={20} color="#9ca3af" />
          <TextInput
            value={formData.city}
            onChangeText={(value) => handleChange('city', value)}
            placeholder="Enter city (optional)"
            placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
            className={`flex-1 ml-3 py-3 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
          />
        </View>
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
            {customerId ? 'Update Customer' : 'Create Customer'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CustomerForm;