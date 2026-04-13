// components/reports/QuickDateFilters.js
import React from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';

const QuickDateFilters = ({ 
  dateRangeText, 
  isDarkMode, 
  loading, 
  onSelectToday, 
  onSelectLast7Days, 
  onSelectLast30Days, 
  onSelectThisMonth 
}) => {
  return (
    <View className="px-4 py-2" style={{ height: 48 }}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', paddingRight: 8 }}
      >
        <TouchableOpacity
          onPress={onSelectToday}
          className={`mr-2 px-4 py-1.5 rounded-full ${
            dateRangeText === "Today" ? 'bg-blue-500' : isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}
          disabled={loading}
          style={{ height: 32, justifyContent: 'center' }}
        >
          <Text className={`text-sm font-medium ${
            dateRangeText === "Today" 
              ? 'text-white' 
              : isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSelectLast7Days}
          className={`mr-2 px-4 py-1.5 rounded-full ${
            dateRangeText === "Last 7 Days" ? 'bg-blue-500' : isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}
          disabled={loading}
          style={{ height: 32, justifyContent: 'center' }}
        >
          <Text className={`text-sm font-medium ${
            dateRangeText === "Last 7 Days" 
              ? 'text-white' 
              : isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Last 7 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSelectLast30Days}
          className={`mr-2 px-4 py-1.5 rounded-full ${
            dateRangeText === "Last 30 Days" ? 'bg-blue-500' : isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}
          disabled={loading}
          style={{ height: 32, justifyContent: 'center' }}
        >
          <Text className={`text-sm font-medium ${
            dateRangeText === "Last 30 Days" 
              ? 'text-white' 
              : isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Last 30 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSelectThisMonth}
          className={`mr-2 px-4 py-1.5 rounded-full ${
            dateRangeText === "This Month" ? 'bg-blue-500' : isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}
          disabled={loading}
          style={{ height: 32, justifyContent: 'center' }}
        >
          <Text className={`text-sm font-medium ${
            dateRangeText === "This Month" 
              ? 'text-white' 
              : isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            This Month
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default QuickDateFilters;