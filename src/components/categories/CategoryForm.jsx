import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useCategoryForm } from '../../hooks/useCategoryForm';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CategoryForm = ({ categoryId }) => {
  const { isDarkMode } = useThemeStore();
  const { 
    formData, 
    loading, 
    error, 
    validationErrors, 
    handleChange, 
    saveCategory 
  } = useCategoryForm(categoryId);

  const handleSubmit = async () => {
    const result = await saveCategory(formData);
    
    if (result.success) {
      // Show success message
      Alert.alert(
        'Success', 
        categoryId ? 'Category updated successfully' : 'Category created successfully',
        [{ text: 'OK' }]
      );
      
    } else {
      // Show error message if needed
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
          Category Name <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Enter category name"
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

      {/* Description Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Description
        </Text>
        <TextInput
          value={formData.description}
          onChangeText={(value) => handleChange('description', value)}
          placeholder="Enter category description"
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className={`rounded-xl px-4 py-3 min-h-[100px] ${
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
              name={formData.is_active ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
              size={24} 
              color={formData.is_active ? "#10b981" : "#9ca3af"} 
            />
            <Text className={`ml-3 text-base font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Active Status
            </Text>
          </View>
          <Switch
            value={formData.is_active}
            onValueChange={(value) => handleChange('is_active', value)}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor="#ffffff"
          />
        </View>
        <Text className={`text-xs mt-1 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {formData.is_active 
            ? 'Category is active and visible' 
            : 'Category is inactive and hidden'}
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
            {categoryId ? 'Update Category' : 'Create Category'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CategoryForm;