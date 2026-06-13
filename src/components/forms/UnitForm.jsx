// components/forms/UnitForm.js
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

const UnitForm = ({ onSubmit, initialData = null, isDarkMode, onCancel }) => {
  const { user } = useAuthStore();
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && initialData.name) {
      setName(initialData.name);
      setCode(initialData.code || '');
    }
  }, [initialData]);

  // Auto-generate code when typing name for new unit
  const handleNameChange = (text) => {
    setName(text);
    if (!initialData && (!code || code === '')) {
      const generatedCode = text.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
      setCode(generatedCode);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Unit name is required' });
      return;
    }
    if (!code.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Unit code is required' });
      return;
    }
    
    setSubmitting(true);
    try {
      const result = await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        user_id: user?.id,
        is_active: true,
      });
      // The modal will be closed by the parent component after successful creation
      return result;
    } catch (error) {
      console.error('Error submitting unit:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="p-4">
      <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Unit Name *
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-800 bg-white'}`}
        placeholder="Enter unit name (e.g., Pieces, Kilograms)"
        placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9ca3af'}
        value={name}
        onChangeText={handleNameChange}
      />

      <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Unit Code *
      </Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 mb-4 ${isDarkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-800 bg-white'}`}
        placeholder="Enter unit code (e.g., pcs, kg)"
        placeholderTextColor={isDarkMode ? '#9CA3AF' : '#9ca3af'}
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
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

export default UnitForm;