// screens/products/ProductsScreen.js
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import Header from "../../components/common/Header";
import ProductFilters from "../../components/products/ProductFilters";
import ProductList from "../../components/products/ProductList";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems"; // Import the helper

const ProductsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { products = [], loading, error, refreshProducts, searchProducts, getProductsByCategory } = useProducts() || {};
  const { categories = [] } = useCategories() || {};
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  // Build categories list with "All Products" option
  const allCategories = [
    {
      id: "all",
      name: "All Products",
      icon: "package-variant",
      count: products?.length || 0,
      color: "#3b82f6",
    },
    ...categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: "tag",
      count: products?.filter(p => p.category_id === cat.id)?.length || 0,
      color: "#8b5cf6",
    }))
  ];

  // Safe product count with fallback
  const productCount = products?.length || 0;

  // Calculate real stats
  const stats = {
    total: productCount,
    lowStock: products?.filter(p => (p.stock || 0) <= (p.reorder_level || 10) && (p.stock || 0) > 0)?.length || 0,
    outOfStock: products?.filter(p => (p.stock || 0) === 0)?.length || 0,
  };

  const handleAddProduct = () => {
    navigation.navigate("AddProduct");
  };

  const handleFilterPress = () => {
    setShowFilters(true);
  };

  const handleFiltersClose = () => {
    setShowFilters(false);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === "all") {
      refreshProducts?.();
    } else {
      getProductsByCategory?.(categoryId);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchProducts?.(query);
    } else {
      refreshProducts?.();
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Use refs to track state without causing re-renders
  const lastRefreshTime = useRef(Date.now());
  const isRefreshing = useRef(false);
  const focusCount = useRef(0);
  const isMounted = useRef(true);

  // Stable refresh callback
  const stableRefresh = useCallback(async () => {
    if (isRefreshing.current || !isMounted.current) return;
    
    isRefreshing.current = true;
    
    try {
      await refreshProducts();
      lastRefreshTime.current = Date.now();
    } finally {
      if (isMounted.current) {
        isRefreshing.current = false;
      }
    }
  }, [refreshProducts]);

  // Focus effect - refresh when screen comes into focus, but not too frequently
  useFocusEffect(
    useCallback(() => {
      focusCount.current += 1;
      console.log('Products screen focused - focus count:', focusCount.current);
      
      // Don't refresh if we're already refreshing
      if (isRefreshing.current) {
        console.log('Already refreshing, skipping...');
        return;
      }
      
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      // Only refresh if it's been more than 5 seconds
      if (timeSinceLastRefresh > 5000) {
        console.log('Refreshing products on focus...');
        stableRefresh();
      } else {
        console.log('Skipping refresh - last refresh was', Math.round(timeSinceLastRefresh / 1000), 'seconds ago');
      }

      return () => {
        console.log('Products screen unfocused');
      };
    }, [stableRefresh])
  );

  // Navigation listener - with proper cleanup
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const routes = navigation.getState()?.routes;
      const previousRoute = routes?.[routes.length - 2]?.name;
      
      // Refresh when coming back from add/edit/detail screens
      if (previousRoute === 'AddProduct' || previousRoute === 'ProductDetail') {
        console.log(`Returning from ${previousRoute} - refreshing products`);
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

  // Navigation items for sidebar - Using centralized navigation items
  const navigationItems = useMemo(() => {
    // Create badges for this screen
    const badges = {
      products: productCount.toString(),
      inventory: stats.lowStock > 0 ? stats.lowStock.toString() : null,
      // You can add other dynamic badges here if needed
    };
    
    // Get navigation items with badges
    return getNavigationItemsWithBadges(badges);
  }, [productCount, stats.lowStock]);

  // Show loading state
  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading products...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <Text className="text-red-500">Error: {error}</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-16`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      <Header
        title="Products"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Products"
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
              onPress={handleAddProduct}
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
            placeholder="Search products, SKU, category..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleFilterPress}
            className={`ml-2 p-2 border-l ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <Icon name="tune" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories Scroll */}
        <View className="py-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4"
          >
            {allCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategorySelect(category.id)}
                className={`flex-row items-center mr-3 px-4 py-2.5 rounded-full border ${
                  selectedCategory === category.id
                    ? "bg-blue-500 border-blue-500"
                    : isDarkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-white'
                } shadow-sm`}
              >
                <Icon
                  name={category.icon}
                  size={18}
                  color={
                    selectedCategory === category.id 
                      ? "#ffffff" 
                      : isDarkMode ? '#9CA3AF' : category.color
                  }
                />
                <Text
                  className={`ml-2 font-medium ${
                    selectedCategory === category.id
                      ? "text-white"
                      : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {category.name}
                </Text>
                <View
                  className={`ml-2 px-2 py-0.5 rounded-full ${
                    selectedCategory === category.id
                      ? "bg-white/20"
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selectedCategory === category.id
                        ? "text-white"
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {category.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats Cards */}
        <View className="flex-row justify-between px-4 py-3">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Products
            </Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {productCount}
            </Text>
          </View>
          <View className={`rounded-xl p-3 flex-1 mx-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Low Stock
            </Text>
            <Text className="text-2xl font-bold text-orange-500">{stats.lowStock}</Text>
          </View>
          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Out of Stock
            </Text>
            <Text className="text-2xl font-bold text-red-500">{stats.outOfStock}</Text>
          </View>
        </View>

        {/* Product List */}
        <View className="flex-1 px-4">
          <ProductList
            viewMode={viewMode}
            searchQuery={searchQuery}
            category={selectedCategory}
          />
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <ProductFilters 
        visible={showFilters} 
        onClose={handleFiltersClose}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

export default ProductsScreen;