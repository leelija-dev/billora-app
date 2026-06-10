// components/brands/BrandForm.js
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BrandForm = ({ initialData, mode = 'add', onSubmit, onCancel, isSubmitting: externalSubmitting }) => {
  const { isDarkMode } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  // Prefill form when editing
  useEffect(() => {
    if (initialData && mode === 'edit') {
      console.log('Prefilling form with brand data:', initialData);
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        is_active: initialData.is_active === true || initialData.is_active === 1,
      });
    } else if (mode === 'add') {
      // Reset form for add mode
      setFormData({
        name: '',
        description: '',
        is_active: true,
      });
    }
  }, [initialData, mode]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Brand name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Brand name must be at least 2 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  const isSubmitting = externalSubmitting || loading;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Name Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Brand Name <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="Enter brand name"
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
          placeholder="Enter brand description"
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
            ? 'Brand is active and visible' 
            : 'Brand is inactive and hidden'}
        </Text>
      </View>

      {/* Validation Errors Display */}
      {Object.keys(validationErrors).length > 0 && (
        <View className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <Text className="text-red-600 dark:text-red-400 font-semibold mb-2">Please fix the following errors:</Text>
          {Object.entries(validationErrors).map(([field, message]) => (
            <Text key={field} className="text-red-600 dark:text-red-400 text-sm">
              • {message}
            </Text>
          ))}
        </View>
      )}

      {/* Buttons */}
      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity
          onPress={onCancel}
          className={`flex-1 py-4 rounded-xl border ${
            isDarkMode ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          <Text className={`text-center font-semibold ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Cancel
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`flex-1 bg-blue-500 py-4 rounded-xl flex-row items-center justify-center ${
            isSubmitting ? 'opacity-50' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text className="text-white text-center font-semibold text-base ml-2">
                Saving...
              </Text>
            </>
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              {mode === 'edit' ? 'Update Brand' : 'Create Brand'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default BrandForm;