import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useUnitForm } from '../../hooks/useUnitForm';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const UnitForm = ({ unitId }) => {
  const { isDarkMode } = useThemeStore();
  const { 
    formData, 
    loading, 
    error, 
    validationErrors, 
    handleChange, 
    saveUnit 
  } = useUnitForm(unitId);

  const handleSubmit = async () => {
    const result = await saveUnit(formData);
    
    if (result.success) {
      // Show success message
      Alert.alert(
        'Success', 
        unitId ? 'Unit updated successfully' : 'Unit created successfully',
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
      {/* Code Field */}
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Unit Code <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={formData.code}
          onChangeText={(value) => handleChange('code', value)}
          placeholder="e.g., KG, L, PC, M"
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          className={`rounded-xl px-4 py-3 ${
            isDarkMode 
              ? 'bg-gray-800 text-white border-gray-700' 
              : 'bg-white text-gray-900 border-gray-200'
          } border ${
            validationErrors.code ? 'border-red-500' : ''
          }`}
          autoCapitalize="characters"
        />
        {validationErrors.code && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.code}
          </Text>
        )}
      </View>

      {/* Name Field */}
      <View className="mb-6">
        <Text className={`text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Unit Name <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={formData.name}
          onChangeText={(value) => handleChange('name', value)}
          placeholder="e.g., Kilogram, Liter, Piece, Meter"
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
            {unitId ? 'Update Unit' : 'Create Unit'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UnitForm;