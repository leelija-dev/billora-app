// components/units/UnitForm.js
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../store/themeStore';

const UnitForm = ({ initialData, mode = 'add', onSubmit, onCancel, isSubmitting }) => {
  const { isDarkMode } = useThemeStore();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        description: initialData.description || '',
      });
    }
  }, [initialData, mode]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code || formData.code.trim() === '') {
      errors.code = 'Unit code is required';
    }
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Unit name is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSubmit(formData);
  };

  const inputClasses = `rounded-xl px-4 py-3 ${isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"} border`;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Code Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Unit Code <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={formData.code}
          onChangeText={(value) => handleChange('code', value)}
          placeholder="e.g., KG, PCS, LTR"
          placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
          autoCapitalize="characters"
          className={`${inputClasses} ${validationErrors.code ? 'border-red-500' : ''}`}
        />
        {validationErrors.code && (
          <Text className="text-red-500 text-xs mt-1">{validationErrors.code}</Text>
        )}
      </View>

      {/* Name Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Unit Name <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="e.g., Kilogram, Piece, Liter"
          placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
          className={`${inputClasses} ${validationErrors.name ? 'border-red-500' : ''}`}
        />
        {validationErrors.name && (
          <Text className="text-red-500 text-xs mt-1">{validationErrors.name}</Text>
        )}
      </View>

      {/* Description Field */}
      <View className="mb-6">
        <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
          Description
        </Text>
        <TextInput
          value={formData.description}
          onChangeText={(value) => handleChange('description', value)}
          placeholder="Enter unit description (optional)"
          placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className={`rounded-xl px-4 py-3 min-h-[80px] ${isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"} border`}
        />
      </View>

      {/* Validation Errors Display */}
      {Object.keys(validationErrors).length > 0 && (
        <View className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <Text className="text-red-600 dark:text-red-400 font-semibold mb-2">Please fix the following errors:</Text>
          {Object.entries(validationErrors).map(([field, message]) => (
            <Text key={field} className="text-red-600 dark:text-red-400 text-sm">• {message}</Text>
          ))}
        </View>
      )}

      {/* Buttons */}
      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity onPress={onCancel} className={`flex-1 py-4 rounded-xl border ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}>
          <Text className={`text-center font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} className={`flex-1 bg-blue-500 py-4 rounded-xl flex-row items-center justify-center ${isSubmitting ? 'opacity-50' : ''}`}>
          {isSubmitting ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text className="text-white text-center font-semibold text-base ml-2">Saving...</Text>
            </>
          ) : (
            <Text className="text-white text-center font-semibold text-base">{mode === 'edit' ? 'Update Unit' : 'Create Unit'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default UnitForm;