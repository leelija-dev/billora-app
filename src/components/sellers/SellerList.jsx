// components/sellers/SellerList.js - WITH ALL BUTTONS VISIBLE IN BOTH VIEWS

import React, { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import SellerCard from "./SellerCard";

const SellerList = ({
  viewMode = "grid",
  searchQuery = "",
  sortBy = null,
  sellers = [],
  loading = false,
  onRefresh = () => {},
  onDelete = () => {},
  onEdit = () => {},
  onPress = () => {},
  onPayment = () => {},
}) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Filter and sort sellers
  const filteredSellers = useMemo(() => {
    if (!Array.isArray(sellers)) return [];
    let filtered = [...sellers];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.phone?.includes(query) ||
          s.gst_number?.toLowerCase().includes(query) ||
          s.address?.toLowerCase().includes(query) ||
          s.city?.toLowerCase().includes(query)
      );
    }
    
    if (sortBy) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'city':
            return (a.city || '').localeCompare(b.city || '');
          case 'due':
            return (parseFloat(b.due_amount) || 0) - (parseFloat(a.due_amount) || 0);
          default:
            return 0;
        }
      });
    }
    
    return filtered;
  }, [sellers, searchQuery, sortBy]);

  const stats = useMemo(() => {
    if (!Array.isArray(sellers)) return {
      total: 0,
      totalDue: 0,
      cities: 0,
    };
    
    const totalDue = sellers.reduce((sum, s) => sum + (parseFloat(s.due_amount) || 0), 0);
    const uniqueCities = new Set(sellers.map(s => s.city).filter(Boolean)).size;
    
    return {
      total: sellers.length,
      totalDue,
      cities: uniqueCities,
    };
  }, [sellers]);

  const handleSellerPress = (seller) => {
    console.log("🖱️ Seller pressed:", seller.id, seller.name);
    if (onPress) {
      onPress(seller);
    } else {
      navigation.navigate("SellerDetail", { id: seller.id });
    }
  };

  const handleDeleteSeller = async (sellerId) => {
    console.log('SellerList: Deleting seller:', sellerId);
    if (onDelete) {
      const result = await onDelete(sellerId);
      console.log('SellerList: Delete result:', result);
      return result;
    }
    return { success: false };
  };

  const onRefreshLocal = async () => {
    console.log('SellerList: Refreshing...');
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <View className="flex-row justify-between items-center">
        <View className={`flex-row items-center px-3 py-1.5 rounded-full ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="account-group" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {filteredSellers.length} {filteredSellers.length === 1 ? 'seller' : 'sellers'}
          </Text>
        </View>
        
        {stats.totalDue > 0 && (
          <View className={`flex-row items-center px-2 py-1 rounded-full ${
            isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50'
          }`}>
            <Icon name="currency-inr" size={12} color="#f97316" />
            <Text className={`text-xs ml-1 ${
              isDarkMode ? 'text-orange-400' : 'text-orange-600'
            }`}>
              ₹{stats.totalDue.toLocaleString()} due
            </Text>
          </View>
        )}
      </View>
      
      {stats.cities > 0 && (
        <View className="flex-row mt-2">
          <View className={`flex-row items-center px-2 py-1 rounded-full ${
            isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
          }`}>
            <Icon name="city" size={12} color="#3b82f6" />
            <Text className={`text-xs ml-1 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {stats.cities} {stats.cities === 1 ? 'city' : 'cities'}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );

  // ✅ Updated Grid Item - Shows all buttons
  const renderGridItem = (item) => (
    <View key={item.id} className="w-[48%] mx-[1%] mb-3">
      <SellerCard 
        seller={item} 
        onEdit={onEdit}
        onDelete={handleDeleteSeller}
        onPress={handleSellerPress}
        onPayment={onPayment}
      />
    </View>
  );

  // ✅ Updated List Item - Shows all buttons
  const renderListItem = (item) => {
    const dueAmount = parseFloat(item.due_amount) || 0;
    const hasDue = dueAmount > 0;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleSellerPress(item)}
        className={`flex-row rounded-xl mb-3 p-4 shadow-sm ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View className="mr-3">
          <View className={`w-12 h-12 rounded-xl items-center justify-center ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <Text className={`text-lg font-bold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {item.name?.charAt(0).toUpperCase() || 'S'}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Name and ID */}
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text
                className={`text-base font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </View>
            <Text className={`text-xs ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              #{item.id}
            </Text>
          </View>

          {/* Contact Info */}
          <View className="mt-1">
            {item.phone && (
              <View className="flex-row items-center">
                <Icon name="phone" size={12} color="#9ca3af" />
                <Text className={`text-xs ml-1 flex-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} numberOfLines={1}>
                  {item.phone}
                </Text>
              </View>
            )}
            {item.city && (
              <View className="flex-row items-center mt-0.5">
                <Icon name="map-marker" size={12} color="#9ca3af" />
                <Text className={`text-xs ml-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} numberOfLines={1}>
                  {item.city}
                </Text>
              </View>
            )}
          </View>

          {/* Due Amount and Actions Row */}
          <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Due Amount */}
            <View className="flex-row items-center">
              <Icon name="currency-inr" size={12} color={hasDue ? "#f97316" : "#22c55e"} />
              <Text className={`text-xs ml-1 font-medium ${
                hasDue ? 'text-orange-500' : 'text-green-500'
              }`}>
                ₹{dueAmount.toLocaleString()}
              </Text>
              {hasDue && (
                <Text className={`text-xs ml-1 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  due
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center gap-1">
              {/* Pay Due Button */}
              {hasDue && (
                <TouchableOpacity
                  onPress={() => onPayment(item)}
                  className={`px-2 py-1 rounded-lg flex-row items-center ${
                    isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
                  }`}
                >
                  <Icon name="currency-inr" size={12} color="#22c55e" />
                  <Text className="text-xs text-green-600 dark:text-green-400 ml-0.5 font-medium">
                    Pay
                  </Text>
                </TouchableOpacity>
              )}

              {/* Edit Button */}
              <TouchableOpacity
                onPress={() => onEdit(item)}
                className={`px-2 py-1 rounded-lg flex-row items-center ${
                  isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'
                }`}
              >
                <Icon name="pencil" size={12} color="#3b82f6" />
                <Text className="text-xs text-blue-600 dark:text-blue-400 ml-0.5 font-medium">
                  Edit
                </Text>
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={() => handleDeleteSeller(item.id)}
                className={`px-2 py-1 rounded-lg flex-row items-center ${
                  isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
                }`}
              >
                <Icon name="delete" size={12} color="#ef4444" />
                <Text className="text-xs text-red-600 dark:text-red-400 ml-0.5 font-medium">
                  Del
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredSellers.length; i += 2) {
      const rowItems = filteredSellers.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (loading && !refreshing && filteredSellers.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading sellers...
        </Text>
      </View>
    );
  }

  if (!filteredSellers || filteredSellers.length === 0) {
    return (
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshLocal}
            colors={["#3b82f6"]}
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          />
        }
      >
        <View className="px-4">
          {renderHeader()}
          <View className="items-center justify-center py-16">
            <View className={`w-24 h-24 rounded-3xl items-center justify-center mb-4 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Icon name="account-group-outline" size={48} color="#9ca3af" />
            </View>
            <Text className={`text-lg font-semibold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Sellers Found
            </Text>
            <Text className={`text-sm text-center mt-2 px-8 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Tap the + button to add your first seller"}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1">
      {renderHeader()}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshLocal}
            colors={["#3b82f6"]}
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          />
        }
      >
        <View className="pb-4">
          {viewMode === "grid"
            ? renderGridItems()
            : filteredSellers.map(item => renderListItem(item))}
        </View>
      </ScrollView>
    </View>
  );
};

export default SellerList;