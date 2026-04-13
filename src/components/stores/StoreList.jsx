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
import StoreCard from "./StoreCard";

const StoreList = ({
  viewMode = "grid",
  searchQuery = "",
  sortBy = "name",
  stores = [],
  loading = false,
  onRefresh = () => {},
  onDelete = () => {},
  filters = {},
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

  // Filter and sort stores
  const filteredStores = useMemo(() => {
    if (!Array.isArray(stores)) return [];
    let filtered = [...stores];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.mobile?.includes(query) ||
          s.gst?.toLowerCase().includes(query) ||
          s.address?.toLowerCase().includes(query) ||
          s.city?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(s => 
        filters.status === 'active' ? s.status : !s.status
      );
    }
    
    // City filter
    if (filters.city) {
      filtered = filtered.filter(s => 
        s.city?.toLowerCase() === filters.city.toLowerCase()
      );
    }
    
    // GST presence filter
    if (filters.hasGst !== undefined && filters.hasGst !== null) {
      filtered = filtered.filter(s => 
        filters.hasGst ? s.gst : !s.gst
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'date':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'city':
          return (a.city || '').localeCompare(b.city || '');
        case 'status':
          return (b.status ? 1 : 0) - (a.status ? 1 : 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [stores, searchQuery, sortBy, filters]);

  // Statistics
  const stats = useMemo(() => {
    if (!Array.isArray(stores)) return {
      total: 0,
      active: 0,
      inactive: 0,
      cities: 0,
    };
    
    const activeCount = stores.filter(s => s.status).length;
    const uniqueCities = new Set(stores.map(s => s.city).filter(Boolean)).size;
    
    return {
      total: stores.length,
      active: activeCount,
      inactive: stores.length - activeCount,
      cities: uniqueCities,
    };
  }, [stores]);

  const handleStorePress = (store) => {
    navigation.navigate("StoreDetail", { storeId: store.id });
  };

  const handleDeleteStore = async (storeId) => {
    console.log('StoreList: Deleting store:', storeId);
    if (onDelete) {
      const result = await onDelete(storeId);
      console.log('StoreList: Delete result:', result);
      return result;
    }
    return { success: false };
  };

  const onRefreshLocal = async () => {
    console.log('StoreList: Refreshing...');
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
          <Icon name="store" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {filteredStores.length} {filteredStores.length === 1 ? 'store' : 'stores'}
          </Text>
        </View>
        
        <View className="flex-row">
          <View className={`flex-row items-center mr-2 px-2 py-1 rounded-full ${
            isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
          }`}>
            <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
            <Text className={`text-xs ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>
              {stats.active} active
            </Text>
          </View>
          
          {stats.inactive > 0 && (
            <View className={`flex-row items-center px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
            }`}>
              <View className="w-2 h-2 rounded-full bg-red-500 mr-1" />
              <Text className={`text-xs ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                {stats.inactive} inactive
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* City stats */}
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

  const renderGridItem = (item) => (
    <View key={item.id} className="w-[48%] mx-[1%] mb-3">
      <StoreCard 
        store={item} 
        onDelete={handleDeleteStore}
      />
    </View>
  );

  const renderListItem = (item) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleStorePress(item)}
      className={`flex-row rounded-xl mb-3 p-4 shadow-sm ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      {/* Store Icon/Logo */}
      <View className="mr-3">
        <View className={`w-12 h-12 rounded-xl items-center justify-center ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <Icon name="store" size={24} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
        </View>
      </View>

      <View className="flex-1">
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
            <View className="flex-row items-center mt-1">
              <View className={`w-2 h-2 rounded-full mr-1 ${
                item.status ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <Text className={`text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {item.status ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            #{item.id}
          </Text>
        </View>

        <View className="mt-2">
          <View className="flex-row items-center">
            <Icon name="email" size={12} color="#9ca3af" />
            <Text className={`text-xs ml-1 flex-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          
          {item.city && (
            <View className="flex-row items-center mt-1">
              <Icon name="map-marker" size={12} color="#9ca3af" />
              <Text className={`text-xs ml-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} numberOfLines={1}>
                {item.city}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center">
            <Icon name="account" size={12} color="#9ca3af" />
            <Text className={`text-xs ml-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              ID: {item.user_id}
            </Text>
          </View>
          
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredStores.length; i += 2) {
      const rowItems = filteredStores.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (loading && !refreshing && filteredStores.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading stores...
        </Text>
      </View>
    );
  }

  if (!filteredStores || filteredStores.length === 0) {
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
              <Icon name="store-off" size={48} color="#9ca3af" />
            </View>
            <Text className={`text-lg font-semibold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Stores Found
            </Text>
            <Text className={`text-sm text-center mt-2 px-8 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Tap the + button to add your first store"}
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
            : filteredStores.map(item => renderListItem(item))}
        </View>
      </ScrollView>
    </View>
  );
};

export default StoreList;