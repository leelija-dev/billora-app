import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import BrandCard from "./BrandCard";

const BrandList = ({
  viewMode = "grid",
  searchQuery = "",
  sortBy = "name",
  brands = [],
  loading = false,
  onRefresh = () => {},
  onDelete = () => {},
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

  // Filter and sort brands
  const filteredBrands = useMemo(() => {
    if (!Array.isArray(brands)) return [];
    let filtered = [...brands];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name?.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          b.slug?.toLowerCase().includes(query) ||
          b.id?.toString().includes(query)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'date':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'id':
          return (a.id || 0) - (b.id || 0);
        case 'status':
          return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [brands, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    if (!Array.isArray(brands)) return {
      total: 0,
      active: 0,
      inactive: 0,
    };
    
    const activeCount = brands.filter(b => b.is_active).length;
    
    return {
      total: brands.length,
      active: activeCount,
      inactive: brands.length - activeCount,
    };
  }, [brands]);

  const handleBrandPress = (brand) => {
    navigation.navigate("BrandDetail", { brandId: brand.id });
  };

  const handleDeleteBrand = async (brandId) => {
    console.log('BrandList: Deleting brand:', brandId);
    if (onDelete) {
      const result = await onDelete(brandId);
      console.log('BrandList: Delete result:', result);
      return result;
    }
    return { success: false };
  };

  const onRefreshLocal = async () => {
    console.log('BrandList: Refreshing...');
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
          <Icon name="trademark" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {filteredBrands.length} {filteredBrands.length === 1 ? 'brand' : 'brands'}
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
    </Animated.View>
  );

  const renderGridItem = (item) => (
    <View key={item.id} className="w-[48%] mx-[1%] mb-3">
      <BrandCard 
        brand={item} 
        onDelete={handleDeleteBrand}
      />
    </View>
  );

  const renderListItem = (item) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleBrandPress(item)}
      className={`flex-row rounded-xl mb-3 p-4 shadow-sm ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      {/* Status Indicator */}
      <View className="mr-3 items-center">
        <View className={`w-3 h-3 rounded-full ${
          item.is_active ? 'bg-green-500' : 'bg-red-500'
        }`} />
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
            {item.slug && (
              <Text
                className={`text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
                numberOfLines={1}
              >
                {item.slug}
              </Text>
            )}
          </View>
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            #{item.id}
          </Text>
        </View>

        {item.description && (
          <Text
            className={`text-sm mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        )}

        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center">
            <Icon name="account" size={14} color="#9ca3af" />
            <Text className={`text-xs ml-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              By: {item.created_by || `User ${item.user_id}`}
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
    for (let i = 0; i < filteredBrands.length; i += 2) {
      const rowItems = filteredBrands.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (loading && !refreshing && filteredBrands.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading brands...
        </Text>
      </View>
    );
  }

  if (!filteredBrands || filteredBrands.length === 0) {
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
              <Icon name="trademark" size={48} color="#9ca3af" />
            </View>
            <Text className={`text-lg font-semibold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Brands Found
            </Text>
            <Text className={`text-sm text-center mt-2 px-8 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Tap the + button to add your first brand"}
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
            : filteredBrands.map(item => renderListItem(item))}
        </View>
      </ScrollView>
    </View>
  );
};

export default BrandList;