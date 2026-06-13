import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../store/authStore';

const CategoryForm = ({ onSubmit, initialData = null, isDarkMode, onCancel }) => {
  const { user } = useAuthStore();
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Category name is required' });
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        user_id: user?.id,
        created_by: user?.id,
        is_active: true,
      });
    } catch (error) {
      console.error('Error submitting category:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="p-4">
      <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Category Name *
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-800 bg-white'}`}
        placeholder="Enter category name"
        placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9ca3af'}
        value={name}
        onChangeText={setName}
      />

      <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Description (Optional)
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-800 bg-white'}`}
        placeholder="Enter description"
        placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9ca3af'}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        value={description}
        onChangeText={setDescription}
      />

      <View className="flex-row justify-end space-x-3 pt-2">
        <TouchableOpacity
          onPress={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
        >
          <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="check" size={18} color="#fff" />
              <Text className="text-white ml-2">Create</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CategoryForm;