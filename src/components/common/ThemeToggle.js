import React from 'react';
import { TouchableOpacity, View, Text, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle = ({ showLabel = false, size = 24, className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.7}
      className={`flex-row items-center ${className}`}
    >
      <View className={`w-8 h-8 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} items-center justify-center`}>
        <Icon
          name={isDark ? 'weather-night' : 'white-balance-sunny'}
          size={size}
          color={isDark ? '#9CA3AF' : '#666'}
        />
      </View>
      {showLabel && (
        <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </Text>
      )}
    </TouchableOpacity>
  );
};