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
import StockCard from "./StockCard";

const StockList = ({
  viewMode = "grid",
  searchQuery = "",
  sortBy = "name",
  stocks = [],
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

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    if (!Array.isArray(stocks)) return [];
    let filtered = [...stocks];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.product?.name?.toLowerCase().includes(query) ||
          s.product?.sku?.toLowerCase().includes(query) ||
          s.id?.toString().includes(query)
      );
    }
    
    // Filter by quantity
    if (filters.minQuantity) {
      filtered = filtered.filter(s => s.quantity >= parseInt(filters.minQuantity));
    }
    if (filters.maxQuantity) {
      filtered = filtered.filter(s => s.quantity <= parseInt(filters.maxQuantity));
    }
    
    // Filter by low stock
    if (filters.lowStock) {
      filtered = filtered.filter(s => s.quantity < 10);
    }
    
    // Filter by date range
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(s => new Date(s.created_at) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(s => new Date(s.created_at) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(s => new Date(s.created_at) >= filterDate);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(s => new Date(s.created_at) >= filterDate);
          break;
      }
    }
    
    // Filter by creator
    if (filters.createdBy) {
      filtered = filtered.filter(s => 
        s.created_by?.toString() === filters.createdBy ||
        s.user_id?.toString() === filters.createdBy
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.product?.name || '').localeCompare(b.product?.name || '');
          break;
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0);
          break;
        case 'price':
          comparison = (a.selling_price || 0) - (b.selling_price || 0);
          break;
        case 'date':
          comparison = new Date(b.created_at || 0) - new Date(a.created_at || 0);
          break;
        case 'id':
          comparison = (a.id || 0) - (b.id || 0);
          break;
        default:
          comparison = 0;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [stocks, searchQuery, sortBy, filters]);

  // Statistics
  const stats = useMemo(() => {
    if (!Array.isArray(stocks)) return {
      total: 0,
      totalQuantity: 0,
      totalValue: 0,
      lowStock: 0,
      outOfStock: 0,
    };
    
    const totalQuantity = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalValue = stocks.reduce((sum, s) => sum + ((s.quantity || 0) * (s.selling_price || 0)), 0);
    const lowStock = stocks.filter(s => s.quantity < 10 && s.quantity > 0).length;
    const outOfStock = stocks.filter(s => s.quantity === 0).length;
    
    return {
      total: stocks.length,
      totalQuantity,
      totalValue,
      lowStock,
      outOfStock,
    };
  }, [stocks]);

  const handleStockPress = (stock) => {
    navigation.navigate("StockDetail", { stockId: stock.id });
  };

  const handleDeleteStock = async (stockId) => {
    if (onDelete) {
      const result = await onDelete(stockId);
      return result;
    }
    return { success: false };
  };

  const onRefreshLocal = async () => {
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
          <Icon name="warehouse" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {filteredStocks.length} {filteredStocks.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        
        <View className="flex-row">
          {stats.lowStock > 0 && (
            <View className={`flex-row items-center mr-2 px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
            }`}>
              <Icon name="alert" size={14} color="#f59e0b" />
              <Text className={`text-xs ml-1 text-yellow-500`}>
                {stats.lowStock} low
              </Text>
            </View>
          )}
          
          {stats.outOfStock > 0 && (
            <View className={`flex-row items-center px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
            }`}>
              <Icon name="close-circle" size={14} color="#ef4444" />
              <Text className={`text-xs ml-1 text-red-500`}>
                {stats.outOfStock} out
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );

  const renderGridItem = (item) => (
    <View key={item.id} className="w-[48%] mx-[1%] mb-3">
      <StockCard 
        stock={item} 
        onDelete={handleDeleteStock}
      />
    </View>
  );

  const renderListItem = (item) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleStockPress(item)}
      className={`flex-row rounded-xl mb-3 p-4 shadow-sm ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      {/* Status Indicator */}
      <View className="mr-3">
        <View className={`w-12 h-12 rounded-xl items-center justify-center ${
          item.quantity <= 0 
            ? 'bg-red-100' 
            : item.quantity < 10 
              ? 'bg-yellow-100' 
              : 'bg-green-100'
        }`}>
          <Icon 
            name="package-variant" 
            size={24} 
            color={
              item.quantity <= 0 
                ? '#ef4444' 
                : item.quantity < 10 
                  ? '#f59e0b' 
                  : '#10b981'
            } 
          />
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
              {item.product?.name || 'Unknown Product'}
            </Text>
            {item.product?.sku && (
              <Text
                className={`text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
                numberOfLines={1}
              >
                SKU: {item.product.sku}
              </Text>
            )}
          </View>
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            #{item.id}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center">
            <Icon name="counter" size={14} color="#9ca3af" />
            <Text className={`text-sm font-bold ml-1 ${
              item.quantity <= 0 
                ? 'text-red-500' 
                : item.quantity < 10 
                  ? 'text-yellow-500' 
                  : isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              {item.quantity}
            </Text>
            <Text className={`text-xs ml-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {item.unit_code || 'units'}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Icon name="currency-usd" size={14} color="#10b981" />
            <Text className="text-sm font-bold text-green-500 ml-1">
              ${parseFloat(item.selling_price || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center">
            <Icon name="calendar" size={14} color="#9ca3af" />
            <Text className={`text-xs ml-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {new Date(item.updated_at).toLocaleDateString()}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => navigation.navigate("AddStockQuantity", { 
              stockId: item.id, 
              productName: item.product?.name 
            })}
            className="bg-green-500 px-3 py-1 rounded-full"
          >
            <Text className="text-white text-xs font-medium">Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredStocks.length; i += 2) {
      const rowItems = filteredStocks.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (loading && !refreshing && filteredStocks.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading stocks...
        </Text>
      </View>
    );
  }

  if (!filteredStocks || filteredStocks.length === 0) {
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
              <Icon name="warehouse" size={48} color="#9ca3af" />
            </View>
            <Text className={`text-lg font-semibold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Stock Entries Found
            </Text>
            <Text className={`text-sm text-center mt-2 px-8 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Tap the + button to add your first stock entry"}
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
            : filteredStocks.map(item => renderListItem(item))}
        </View>
      </ScrollView>
    </View>
  );
};

export default StockList;