// components/products/ProductList.js
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useProducts } from "../../hooks/useProducts";
import ProductCard from "./ProductCard";

const ProductList = ({
  viewMode = "grid",
  searchQuery = "",
  category = "all",
}) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Use real API data instead of static data
  const { 
    products = [], 
    loading, 
    error, 
    refreshProducts, 
    searchProducts, 
    getProductsByCategory 
  } = useProducts() || {};

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Filter products based on props
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Category filter
    if (category !== "all") {
      filtered = filtered.filter(
        (p) => p.category?.name?.toLowerCase() === category.toLowerCase(),
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.brand?.name?.toLowerCase().includes(query) ||
          p.category?.name?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [products, category, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockCount = products.filter(
      (p) => (p.stock || 0) <= (p.reorder_level || 10) && (p.stock || 0) > 0,
    ).length;
    const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.selling_price || 0) * (p.stock || 0), 0);

    return {
      total: products.length,
      totalStock,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      totalValue,
    };
  }, [products]);

  const handleProductPress = (product) => {
    navigation.navigate("ProductDetail", { productId: product.id });
  };

  const handleEditProduct = (product) => {
    navigation.navigate("AddProduct", { productId: product.id });
  };

  const handleDeleteProduct = (productId) => {
    // This should call the API to delete the product
    // For now, we'll just let the hook handle the state
    refreshProducts();
  };

  const handleUpdateStock = (productId, newStock) => {
    // This should call the API to update stock
    // For now, we'll just refresh the data
    refreshProducts();
  };

  const handleToggleFavorite = (productId) => {
    // This should call the API to toggle favorite
    // For now, we'll just refresh the data
    refreshProducts();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProducts();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <View className="flex-row justify-between items-center mb-3">
        <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {filteredProducts.length}{" "}
          {filteredProducts.length === 1 ? "product" : "products"} found
        </Text>
        <View className={`flex-row items-center px-3 py-1.5 rounded-full shadow-sm ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="package-variant" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {stats.total} total
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderGridItem = (item) => (
    <View key={item.id} className="w-[48%] mx-[1%] mb-3">
      <ProductCard product={item} onUpdateStock={handleUpdateStock} />
    </View>
  );

  const renderListItem = (item) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleProductPress(item)}
      className={`flex-row rounded-xl mb-3 p-3 shadow-sm ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/80' }}
        className="w-20 h-20 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {item.sku}
            </Text>
            <Text
              className={`text-base font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleToggleFavorite(item.id)}>
            <Icon
              name={item.is_favorite ? "heart" : "heart-outline"}
              size={20}
              color={item.is_favorite ? "#ef4444" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mt-1">
          <Icon name="tag" size={12} color="#9ca3af" />
          <Text className={`text-xs ml-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {item.category?.name || 'No Category'}
          </Text>
          <Text className={`text-xs mx-2 ${
            isDarkMode ? 'text-gray-700' : 'text-gray-300'
          }`}>
            •
          </Text>
          <Icon name="factory" size={12} color="#9ca3af" />
          <Text className={`text-xs ml-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {item.brand?.name || 'No Brand'}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <View>
            <Text className="text-lg font-bold text-blue-600">
              ${(item.selling_price || 0).toFixed(2)}
            </Text>
            {item.purchase_price && item.purchase_price > 0 && (
              <Text className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Cost: ${(item.purchase_price || 0).toFixed(2)}
              </Text>
            )}
          </View>

          <View className="flex-row items-center">
            <View
              className={`px-2 py-1 rounded-full ${
                (item.stock || 0) === 0
                  ? isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
                  : (item.stock || 0) <= (item.reorder_level || 10)
                    ? isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                    : isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  (item.stock || 0) === 0
                    ? "text-red-600"
                    : (item.stock || 0) <= (item.reorder_level || 10)
                      ? "text-orange-600"
                      : "text-green-600"
                }`}
              >
                {(item.stock || 0)} in stock
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredProducts.length; i += 2) {
      const rowItems = filteredProducts.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading products...
        </Text>
      </View>
    );
  }

  if (!filteredProducts || filteredProducts.length === 0) {
    return (
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
      >
        <View className="px-4">
          {renderHeader()}
          <View className="items-center justify-center py-16">
            <Icon name="package-variant" size={80} color="#d1d5db" />
            <Text className={`text-lg font-semibold mt-4 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Products Found
            </Text>
            <Text className={`text-sm text-center mt-2 px-8 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {searchQuery || category !== "all"
                ? "Try adjusting your search or filters"
                : "Tap the + button to add your first product"}
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
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
      >
        <View className="pb-4">
          {viewMode === "grid" 
            ? renderGridItems() 
            : filteredProducts.map(item => renderListItem(item))}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProductList;