// components/products/ProductList.js
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import ProductCard from "./ProductCard";
import useProductStore from "../../store/productStore";

const ProductList = ({
  viewMode = "grid",
  searchQuery = "",
  category = "all",
  products: externalProducts = [],
  loading: externalLoading = false,
  onEdit,
  onDelete,
}) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { getProductTotalStock, getProductStocks } = useProductStore();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const products = externalProducts;
  const loading = externalLoading;

  // Helper function to safely get numeric value
  const safeNumber = (value, defaultValue = 0) => {
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Helper function to format currency
  const formatCurrency = (value) => {
    const num = safeNumber(value);
    return num.toFixed(2);
  };

  // Filter products based on props
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (category !== "all") {
      filtered = filtered.filter(
        (p) => p.category?.name?.toLowerCase() === category.toLowerCase(),
      );
    }

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

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + getProductTotalStock(p), 0);
    const lowStockCount = products.filter((p) => {
      const stock = getProductTotalStock(p);
      const minStock = safeNumber(p.minimum_stock_quantity || p.reorder_level || 10);
      return stock <= minStock && stock > 0;
    }).length;
    const outOfStockCount = products.filter((p) => getProductTotalStock(p) === 0).length;

    return {
      total: products.length,
      totalStock,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
    };
  }, [products]);

  const handleProductPress = (product) => {
    navigation.navigate("ProductDetail", { productId: product.id });
  };

  const handleEditProduct = (product) => {
    if (onEdit) {
      onEdit(product);
    } else {
      navigation.navigate("AddProduct", { productId: product.id });
    }
  };

  const handleDeleteProduct = (productId) => {
    if (onDelete) {
      onDelete(productId);
    }
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <View className="flex-row justify-between items-center mb-3">
        <Text className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
        </Text>
        <View className={`flex-row items-center px-3 py-1.5 rounded-full shadow-sm ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="package-variant" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {stats.total} total
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderGridItem = (item) => (
    <View key={item.id} className="w-[48%] mx-[1%] mb-3">
      <ProductCard 
        product={item} 
        onEdit={() => handleEditProduct(item)}
        onDelete={() => handleDeleteProduct(item.id)}
      />
    </View>
  );

  const renderListItem = (item) => {
    const totalStock = getProductTotalStock(item);
    const stocksList = getProductStocks(item);
    const minStock = safeNumber(item.minimum_stock_quantity || item.reorder_level || 10);
    const sellingPrice = safeNumber(item.selling_price);
    const purchasePrice = safeNumber(item.purchase_price);
    
    const isLowStock = totalStock <= minStock && totalStock > 0;
    const isOutOfStock = totalStock === 0;
    
    const getStockColor = () => {
      if (isOutOfStock) return "text-red-600";
      if (isLowStock) return "text-orange-600";
      return "text-green-600";
    };
    
    const getStockBg = () => {
      if (isOutOfStock) return isDarkMode ? 'bg-red-900/30' : 'bg-red-100';
      if (isLowStock) return isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100';
      return isDarkMode ? 'bg-green-900/30' : 'bg-green-100';
    };

    return (
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
                {item.sku || "N/A"}
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
          </View>

          <View className="flex-row items-center mt-1">
            <Icon name="tag" size={12} color="#9ca3af" />
            <Text className={`text-xs ml-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {item.category?.name || 'No Category'}
            </Text>
            <Text className={`text-xs mx-2 ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`}>•</Text>
            <Icon name="factory" size={12} color="#9ca3af" />
            <Text className={`text-xs ml-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {item.brand?.name || 'No Brand'}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mt-2">
            <View>
              <Text className="text-lg font-bold text-blue-600">
                ₹{formatCurrency(sellingPrice)}
              </Text>
              {purchasePrice > 0 && (
                <Text className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  Cost: ₹{formatCurrency(purchasePrice)}
                </Text>
              )}
            </View>

            <View className="flex-row items-center">
              <View className={`px-2 py-1 rounded-full ${getStockBg()}`}>
                <Text className={`text-xs font-medium ${getStockColor()}`}>
                  {totalStock} in stock
                </Text>
              </View>
            </View>
          </View>

          {/* Stock breakdown - Like desktop */}
          {stocksList.length > 1 && (
            <View className="mt-1">
              <View className="flex-row flex-wrap">
                {stocksList.slice(0, 2).map((stock, idx) => (
                  <View key={idx} className="flex-row items-center mr-3">
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {stock.unit?.name || `Unit ${stock.unit_id}`}:
                    </Text>
                    <Text className={`text-xs font-medium ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {parseFloat(stock.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
                {stocksList.length > 2 && (
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    +{stocksList.length - 2} more
                  </Text>
                )}
              </View>
            </View>
          )}
          
          {/* Action Buttons for List View */}
          <View className="flex-row justify-end mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={() => handleEditProduct(item)}
              className="flex-row items-center mr-4 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg"
            >
              <Icon name="pencil" size={16} color="#3b82f6" />
              <Text className="text-blue-600 dark:text-blue-400 text-xs ml-1">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteProduct(item.id)}
              className="flex-row items-center px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg"
            >
              <Icon name="delete" size={16} color="#ef4444" />
              <Text className="text-red-600 dark:text-red-400 text-xs ml-1">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
      <View className="flex-1 justify-center items-center py-12">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading products...
        </Text>
      </View>
    );
  }

  if (!filteredProducts || filteredProducts.length === 0) {
    return (
      <View className="flex-1">
        {renderHeader()}
        <View className="items-center justify-center py-16">
          <Icon name="package-variant" size={80} color="#d1d5db" />
          <Text className={`text-lg font-semibold mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No Products Found
          </Text>
          <Text className={`text-sm text-center mt-2 px-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {searchQuery || category !== "all"
              ? "Try adjusting your search or filters"
              : "Tap the + button to add your first product"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {renderHeader()}
      <ScrollView showsVerticalScrollIndicator={false}>
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