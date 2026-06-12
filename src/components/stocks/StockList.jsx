// components/stocks/StockList.js
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Animated, ScrollView, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import StockCard from "./StockCard";

const StockList = ({ viewMode = "grid", searchQuery = "", sortBy = "name", stocks = [], loading = false, onRefresh = () => {}, onEdit = () => {}, onDelete = () => {}, onAddQuantity = () => {}, filters = {} }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const filteredStocks = useMemo(() => {
    if (!Array.isArray(stocks)) return [];
    let filtered = [...stocks];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.product?.name?.toLowerCase().includes(query) || 
        s.product?.sku?.toLowerCase().includes(query) || 
        s.id?.toString().includes(query) ||
        s.product_name?.toLowerCase().includes(query)
      );
    }
    
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = (a.product?.name || a.product_name || '').localeCompare(b.product?.name || b.product_name || '');
      else if (sortBy === 'quantity') comparison = (a.quantity || 0) - (b.quantity || 0);
      else if (sortBy === 'price') comparison = (a.selling_price || 0) - (b.selling_price || 0);
      else if (sortBy === 'date') comparison = new Date(b.created_at || 0) - new Date(a.created_at || 0);
      else if (sortBy === 'id') comparison = (a.id || 0) - (b.id || 0);
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [stocks, searchQuery, sortBy, filters]);

  const stats = useMemo(() => {
    if (!Array.isArray(stocks)) return { total: 0, totalQuantity: 0, totalValue: 0, lowStock: 0, outOfStock: 0 };
    const totalQuantity = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalValue = stocks.reduce((sum, s) => sum + ((s.quantity || 0) * (s.selling_price || 0)), 0);
    const lowStock = stocks.filter(s => s.quantity < 10 && s.quantity > 0).length;
    const outOfStock = stocks.filter(s => s.quantity === 0).length;
    return { total: stocks.length, totalQuantity, totalValue, lowStock, outOfStock };
  }, [stocks]);

  const onRefreshLocal = async () => { 
    setRefreshing(true); 
    if (onRefresh) await onRefresh(); 
    setRefreshing(false); 
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <View className="flex-row justify-between items-center">
        <View className={`flex-row items-center px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <Icon name="warehouse" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {filteredStocks.length} {filteredStocks.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View className="flex-row">
          {stats.lowStock > 0 && (
            <View className={`flex-row items-center mr-2 px-2 py-1 rounded-full ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
              <Icon name="alert" size={14} color="#f59e0b" />
              <Text className={`text-xs ml-1 text-yellow-500`}>{stats.lowStock} low</Text>
            </View>
          )}
          {stats.outOfStock > 0 && (
            <View className={`flex-row items-center px-2 py-1 rounded-full ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
              <Icon name="close-circle" size={14} color="#ef4444" />
              <Text className={`text-xs ml-1 text-red-500`}>{stats.outOfStock} out</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );

  // Grid View - 2 columns
  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredStocks.length; i += 2) {
      const firstItem = filteredStocks[i];
      const secondItem = filteredStocks[i + 1];
      
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-4">
          <View className="w-[48%]">
            <StockCard 
              stock={firstItem} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onAddQuantity={onAddQuantity} 
            />
          </View>
          {secondItem && (
            <View className="w-[48%]">
              <StockCard 
                stock={secondItem} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                onAddQuantity={onAddQuantity} 
              />
            </View>
          )}
        </View>
      );
    }
    return rows;
  };

  // List View - Full width
  const renderListItems = () => {
    return filteredStocks.map((item) => (
      <View key={item.id} className="w-full mb-3">
        <StockCard 
          stock={item} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          onAddQuantity={onAddQuantity} 
        />
      </View>
    ));
  };

  if (loading && !refreshing && filteredStocks.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading stocks...</Text>
      </View>
    );
  }

  if (!filteredStocks || filteredStocks.length === 0) {
    return (
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
        <View className="px-4">
          {renderHeader()}
          <View className="items-center justify-center py-16">
            <View className={`w-24 h-24 rounded-3xl items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Icon name="warehouse" size={48} color="#9ca3af" />
            </View>
            <Text className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No Stock Entries Found
            </Text>
            <Text className={`text-sm text-center mt-2 px-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {searchQuery ? `No results for "${searchQuery}"` : "Tap the + button to add your first stock entry"}
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
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-4">
          {viewMode === "grid" ? renderGridItems() : renderListItems()}
        </View>
      </ScrollView>
    </View>
  );
};

export default StockList;