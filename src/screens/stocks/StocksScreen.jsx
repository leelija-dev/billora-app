import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useStocks } from "../../hooks/useStocks";
import Header from "../../components/common/Header";
import StockFilters from "../../components/stocks/StockFilters";
import StockList from "../../components/stocks/StockList";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems"; // Import the helper

const StocksScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const {
    stocks = [],
    loading,
    error,
    refreshStocks,
    searchStocks,
    deleteStock,
  } = useStocks() || {};

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: "all",
    minQuantity: "",
    maxQuantity: "",
    sortBy: "name",
    sortOrder: "asc",
    dateRange: "all",
    createdBy: "",
    lowStock: false,
  });

  // Use refs to track state without causing re-renders
  const lastRefreshTime = useRef(Date.now());
  const isRefreshing = useRef(false);
  const focusCount = useRef(0);
  const isMounted = useRef(true);

  // Calculate statistics
  const totalStocks = stocks?.length || 0;
  const totalQuantity = useMemo(() => {
    return stocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
  }, [stocks]);
  
  const totalValue = useMemo(() => {
    return stocks.reduce((sum, stock) => sum + ((stock.quantity || 0) * (stock.selling_price || 0)), 0);
  }, [stocks]);
  
  const lowStockCount = useMemo(() => {
    return stocks.filter(stock => (stock.quantity || 0) < 10).length;
  }, [stocks]);
  
  const outOfStockCount = useMemo(() => {
    return stocks.filter(stock => (stock.quantity || 0) === 0).length;
  }, [stocks]);

  // Stable refresh callback
  const stableRefresh = useCallback(async () => {
    if (isRefreshing.current || !isMounted.current) return;
    
    isRefreshing.current = true;
    setRefreshing(true);
    
    try {
      await refreshStocks();
      lastRefreshTime.current = Date.now();
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
        isRefreshing.current = false;
      }
    }
  }, [refreshStocks]);

  // Focus effect
  useFocusEffect(
    useCallback(() => {
      focusCount.current += 1;
      console.log('Stocks screen focused - focus count:', focusCount.current);
      
      if (isRefreshing.current) {
        console.log('Already refreshing, skipping...');
        return;
      }
      
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      if (timeSinceLastRefresh > 5000) {
        console.log('Refreshing stocks on focus...');
        stableRefresh();
      } else {
        console.log('Skipping refresh - last refresh was', Math.round(timeSinceLastRefresh / 1000), 'seconds ago');
      }

      return () => {
        console.log('Stocks screen unfocused');
      };
    }, [stableRefresh])
  );

  // Navigation listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const routes = navigation.getState()?.routes;
      const previousRoute = routes?.[routes.length - 2]?.name;
      
      if (previousRoute === 'AddStock' || previousRoute === 'StockDetail' || previousRoute === 'AddStockQuantity') {
        console.log(`Returning from ${previousRoute} - refreshing stocks`);
        stableRefresh();
      }
    });

    return unsubscribe;
  }, [navigation, stableRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAddStock = () => {
    navigation.navigate("AddStock");
  };

  const handleFilterPress = () => {
    setShowFilters(true);
  };

  const handleFiltersClose = () => {
    setShowFilters(false);
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    setSortBy(filters.sortBy);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setActiveFilters({
      status: "all",
      minQuantity: "",
      maxQuantity: "",
      sortBy: "name",
      sortOrder: "asc",
      dateRange: "all",
      createdBy: "",
      lowStock: false,
    });
    setSortBy("name");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchStocks(query);
    } else {
      stableRefresh();
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleDeleteStock = async (stockId) => {
    Alert.alert(
      "Delete Stock Entry",
      "Are you sure you want to delete this stock entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log('Deleting stock:', stockId);
            const result = await deleteStock(stockId, user?.id);
            console.log('Delete result:', result);
            
            if (result?.success) {
              Alert.alert("Success", "Stock entry deleted successfully");
              await stableRefresh();
              lastRefreshTime.current = 0;
            } else {
              Alert.alert("Error", result?.error || "Failed to delete stock entry");
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    await stableRefresh();
  };

  // Navigation items for sidebar - Using centralized navigation items
  const navigationItems = useMemo(() => {
    // Create badges for this screen
    const badges = {
      stocks: totalStocks.toString(),
      inventory: lowStockCount > 0 ? lowStockCount.toString() : null,
      // You can add other dynamic badges here if needed
    };
    
    // Get navigation items with badges
    return getNavigationItemsWithBadges(badges);
  }, [totalStocks, lowStockCount]);

  // Show loading state
  if (loading && stocks.length === 0 && !refreshing) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="warehouse" size={32} color="#3b82f6" />
        </View>
        <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Loading stocks...
        </Text>
        <Text className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Please wait a moment
        </Text>
      </View>
    );
  }

  // Show error state
  if (error && stocks.length === 0) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center px-6`}>
        <View className={`w-20 h-20 rounded-3xl items-center justify-center mb-4 ${
          isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
        }`}>
          <Icon name="alert-circle" size={40} color="#ef4444" />
        </View>
        <Text className={`text-lg font-semibold text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Failed to Load Stocks
        </Text>
        <Text className={`text-sm text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="mt-6 bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-16`}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={isDarkMode ? "#111827" : "#ffffff"} 
      />
      
      <Header
        title="Stock Management"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Stocks"
        navigationItems={navigationItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={toggleViewMode}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon
                name={viewMode === "grid" ? "view-grid" : "view-list"}
                size={22}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddStock}
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30"
            >
              <Icon name="plus" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            className={`flex-1 ml-3 text-base ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            placeholder="Search by product name, SKU..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleFilterPress}
            className={`ml-2 p-2 border-l relative ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <Icon name="tune" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            {Object.values(activeFilters).some(v => v && v !== "" && v !== "all" && v !== null) && (
              <View className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          />
        }
      >
        {/* Stats Cards */}
        <View className="flex-row flex-wrap px-4 py-3">
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            className="rounded-xl p-4 flex-1 mr-2"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius:8
            }}
          >
            <Text className="text-white/80 text-xs">Total Products</Text>
            <Text className="text-white text-2xl font-bold">{totalStocks}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="package-variant" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">With stock</Text>
            </View>
          </LinearGradient>

          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Quantity
            </Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {totalQuantity}
            </Text>
            <View className="flex-row items-center mt-1">
              <Icon name="counter" size={16} color="#10b981" />
              <Text className={`text-xs ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Units in stock
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row items-center">
              <Icon name="currency-usd" size={20} color="#f59e0b" />
              <Text className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Value
              </Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              ${parseFloat(totalValue || 0).toFixed(2)}
            </Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              At selling price
            </Text>
          </View>

          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row items-center">
              <Icon name="alert" size={20} color="#ef4444" />
              <Text className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Stock Alerts
              </Text>
            </View>
            <View className="flex-row mt-1">
              <View className="flex-1">
                <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {lowStockCount}
                </Text>
                <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Low Stock
                </Text>
              </View>
              <View className="flex-1">
                <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {outOfStockCount}
                </Text>
                <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Out of Stock
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Chips */}
        {(activeFilters.lowStock || activeFilters.minQuantity) && (
          <View className="px-4 mb-3 flex-row flex-wrap">
            {activeFilters.lowStock && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${
                isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'
              }`}>
                <Text className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  Low Stock Only
                </Text>
                <TouchableOpacity 
                  onPress={() => setActiveFilters({...activeFilters, lowStock: false})}
                  className="ml-2"
                >
                  <Icon name="close" size={16} color={isDarkMode ? "#FCD34D" : "#B45309"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Stock List */}
        <View className="flex-1 px-4 pb-4">
          <StockList
            stocks={stocks}
            viewMode={viewMode}
            searchQuery={searchQuery}
            sortBy={sortBy}
            filters={activeFilters}
            onRefresh={onRefresh}
            onDelete={handleDeleteStock}
            loading={loading}
          />
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <StockFilters
        visible={showFilters}
        onClose={handleFiltersClose}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={activeFilters}
      />
    </View>
  );
};

export default StocksScreen;