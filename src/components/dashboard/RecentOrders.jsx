import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { formatCurrency, formatRelativeTime } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';

const RecentOrders = ({ orders = [], loading, onRefresh }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      activeOpacity={0.7}
      className={`mb-2 p-4 rounded-xl border ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            #{item.orderNumber}
          </Text>
          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.customer?.name}
          </Text>
        </View>
        <StatusBadge
          status={item.status}
          size="small"
        />
      </View>
      
      <View className="flex-row justify-between">
        <View className="items-center">
          <Text className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Amount
          </Text>
          <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(item.total)}
          </Text>
        </View>
        <View className="items-center">
          <Text className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Items
          </Text>
          <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {item.items?.length || 0}
          </Text>
        </View>
        <View className="items-center">
          <Text className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Time
          </Text>
          <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Orders
          </Text>
        </View>
        <View className={`p-8 items-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl`}>
          <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            Loading orders...
          </Text>
        </View>
      </View>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Orders
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
              View All
            </Text>
          </TouchableOpacity>
        </View>
        <EmptyState
          title="No Orders Yet"
          description="There are no recent orders to display"
          icon="package-variant"
        />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Recent Orders
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
          <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
            View All
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      />
    </View>
  );
};

export default RecentOrders;