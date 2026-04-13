// components/inventory/StockList.js
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../store/themeStore';

// Static inventory data
const STATIC_INVENTORY = [
  {
    id: 'INV-001',
    productId: 'PROD-001',
    productName: 'Classic White T-Shirt',
    sku: 'TS-WHT-001',
    currentStock: 245,
    minStock: 50,
    maxStock: 500,
    unitPrice: 29.99,
    location: 'Aisle A, Shelf 3',
    category: 'Apparel',
    status: 'in-stock',
    lastUpdated: '2024-03-15T10:30:00Z',
    supplier: 'Textile Suppliers Inc.',
  },
  {
    id: 'INV-002',
    productId: 'PROD-002',
    productName: 'Slim Fit Jeans',
    sku: 'JN-BLU-032',
    currentStock: 89,
    minStock: 40,
    maxStock: 300,
    unitPrice: 79.99,
    location: 'Aisle B, Shelf 1',
    category: 'Apparel',
    status: 'in-stock',
    lastUpdated: '2024-03-14T14:20:00Z',
    supplier: 'Denim Co.',
  },
  {
    id: 'INV-003',
    productId: 'PROD-003',
    productName: 'Leather Sneakers',
    sku: 'SN-BLK-009',
    currentStock: 34,
    minStock: 30,
    maxStock: 200,
    unitPrice: 89.99,
    location: 'Aisle C, Shelf 5',
    category: 'Footwear',
    status: 'low-stock',
    lastUpdated: '2024-03-13T09:15:00Z',
    supplier: 'Footwear Plus',
  },
  {
    id: 'INV-004',
    productId: 'PROD-004',
    productName: 'Cashmere Sweater',
    sku: 'SW-GRY-045',
    currentStock: 12,
    minStock: 25,
    maxStock: 150,
    unitPrice: 99.99,
    location: 'Aisle A, Shelf 8',
    category: 'Apparel',
    status: 'low-stock',
    lastUpdated: '2024-03-12T16:45:00Z',
    supplier: 'Luxury Knits',
  },
  {
    id: 'INV-005',
    productId: 'PROD-005',
    productName: 'Sports Watch',
    sku: 'WT-BLK-123',
    currentStock: 0,
    minStock: 20,
    maxStock: 100,
    unitPrice: 129.99,
    location: 'Aisle D, Shelf 2',
    category: 'Accessories',
    status: 'out-of-stock',
    lastUpdated: '2024-03-11T11:30:00Z',
    supplier: 'Timepieces Ltd.',
  },
  {
    id: 'INV-006',
    productId: 'PROD-006',
    productName: 'Leather Backpack',
    sku: 'BP-BRN-078',
    currentStock: 56,
    minStock: 30,
    maxStock: 200,
    unitPrice: 89.99,
    location: 'Aisle E, Shelf 4',
    category: 'Accessories',
    status: 'in-stock',
    lastUpdated: '2024-03-10T13:20:00Z',
    supplier: 'Leather Goods Co.',
  },
  {
    id: 'INV-007',
    productId: 'PROD-007',
    productName: 'Wool Overcoat',
    sku: 'CT-BLK-034',
    currentStock: 18,
    minStock: 20,
    maxStock: 100,
    unitPrice: 299.99,
    location: 'Aisle A, Shelf 10',
    category: 'Outerwear',
    status: 'low-stock',
    lastUpdated: '2024-03-09T10:00:00Z',
    supplier: 'Winter Wear Inc.',
  },
  {
    id: 'INV-008',
    productId: 'PROD-008',
    productName: 'Running Shoes',
    sku: 'SN-RED-567',
    currentStock: 0,
    minStock: 40,
    maxStock: 250,
    unitPrice: 129.99,
    location: 'Aisle C, Shelf 3',
    category: 'Footwear',
    status: 'out-of-stock',
    lastUpdated: '2024-03-08T15:30:00Z',
    supplier: 'Sports Gear Co.',
  },
];

const StockList = ({ 
  viewMode = 'grid', 
  searchQuery = '', 
  filters = {},
  isDarkMode: propIsDarkMode 
}) => {
  const navigation = useNavigation();
  const { isDarkMode: storeIsDarkMode } = useThemeStore();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : storeIsDarkMode;
  const [refreshing, setRefreshing] = useState(false);
  const [inventory] = useState(STATIC_INVENTORY);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Apply filters
  const filteredInventory = useMemo(() => {
    let filtered = [...inventory];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Low stock filter
    if (filters.lowStock) {
      filtered = filtered.filter(item => item.status === 'low-stock');
    }

    // Out of stock filter
    if (filters.outOfStock) {
      filtered = filtered.filter(item => item.status === 'out-of-stock');
    }

    // Sort
    switch (filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case 'stock-low':
        filtered.sort((a, b) => a.currentStock - b.currentStock);
        break;
      case 'stock-high':
        filtered.sort((a, b) => b.currentStock - a.currentStock);
        break;
      case 'value-high':
        filtered.sort((a, b) => (b.currentStock * b.unitPrice) - (a.currentStock * a.unitPrice));
        break;
      default:
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
    }

    return filtered;
  }, [inventory, searchQuery, filters]);

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleItemPress = (item) => {
    navigation.navigate('StockMovement', { productId: item.productId });
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock':
        return { 
          bg: isDarkMode ? '#065F46' : '#D1FAE5', 
          text: isDarkMode ? '#6EE7B7' : '#059669', 
          icon: 'check-circle' 
        };
      case 'low-stock':
        return { 
          bg: isDarkMode ? '#92400E' : '#FEF3C7', 
          text: isDarkMode ? '#FCD34D' : '#D97706', 
          icon: 'alert' 
        };
      case 'out-of-stock':
        return { 
          bg: isDarkMode ? '#7F1D1D' : '#FEE2E2', 
          text: isDarkMode ? '#FCA5A5' : '#DC2626', 
          icon: 'close-circle' 
        };
      default:
        return { 
          bg: isDarkMode ? '#374151' : '#F3F4F6', 
          text: isDarkMode ? '#9CA3AF' : '#6B7280', 
          icon: 'help' 
        };
    }
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <BlurView
        intensity={50}
        tint={isDarkMode ? "dark" : "light"}
        className="overflow-hidden rounded-2xl shadow-md"
      >
        <View className={`flex-row justify-between items-center px-4 py-3 ${
          isDarkMode ? 'bg-gray-800/70' : 'bg-white'
        }`}>
          <Text className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {filteredInventory.length} {filteredInventory.length === 1 ? 'item' : 'items'} found
          </Text>
          <View className="flex-row items-center">
            <TouchableOpacity className="mr-3">
              <Icon name="sort" size={20} color="#6366F1" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Icon name="filter" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );

  const renderListItem = (item) => {
    const status = getStatusColor(item.status);
    const totalValue = item.currentStock * item.unitPrice;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <BlurView
          intensity={80}
          tint={isDarkMode ? "dark" : "light"}
          className="overflow-hidden rounded-2xl mb-3 shadow-md"
          style={{
            borderWidth: 1,
            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)",
          }}
        >
          <View className={`p-4 ${
            isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
          }`}>
            <View className="flex-row items-center">
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                style={{ borderRadius: 5 }}
              >
                <Icon name="package-variant" size={28} color="white" />
              </LinearGradient>
              
              <View className="flex-1">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className={`font-bold text-lg ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.productName}
                    </Text>
                    <Text className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>SKU: {item.sku}</Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: status.bg }}
                  >
                    <Text className="text-xs font-medium" style={{ color: status.text }}>
                      {item.status === 'in-stock' ? 'In Stock' : 
                       item.status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-3">
                  <View className="flex-1">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>Stock</Text>
                    <Text
                      className={`font-bold ${
                        item.status === 'low-stock' 
                          ? (isDarkMode ? 'text-orange-400' : 'text-orange-600')
                          : item.status === 'out-of-stock' 
                            ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                            : (isDarkMode ? 'text-white' : 'text-gray-900')
                      }`}
                    >
                      {item.currentStock} units
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>Min Stock</Text>
                    <Text className={`font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{item.minStock}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>Value</Text>
                    <Text className={`font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatCurrency(totalValue)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center mt-2">
                  <Icon name="map-marker" size={14} color="#9ca3af" />
                  <Text className={`text-xs ml-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>{item.location}</Text>
                  <Icon name="store" size={14} color="#9ca3af" style={{ marginLeft: 12 }} />
                  <Text className={`text-xs ml-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>{item.supplier}</Text>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderGridItem = (item) => {
    const status = getStatusColor(item.status);
    const totalValue = item.currentStock * item.unitPrice;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
        className="w-[48%] mx-[1%]"
      >
        <BlurView
          intensity={80}
          tint={isDarkMode ? "dark" : "light"}
          className="overflow-hidden rounded-2xl mb-3 shadow-md"
          style={{
            borderWidth: 1,
            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)",
          }}
        >
          <View className={`p-4 ${
            isDarkMode ? 'bg-gray-800/70' : 'bg-white/70'
          }`}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              className="w-16 h-16 rounded-2xl items-center justify-center self-center mb-3"
              style={{ borderRadius: 5 }}
            >
              <Icon name="package-variant" size={32} color="white" />
            </LinearGradient>

            <Text className={`font-bold text-base text-center ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`} numberOfLines={1}>
              {item.productName}
            </Text>
            <Text className={`text-xs text-center mb-2 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              SKU: {item.sku}
            </Text>

            <View
              className="self-center px-3 py-1 rounded-full mb-3"
              style={{ backgroundColor: status.bg }}
            >
              <Text className="text-xs font-medium" style={{ color: status.text }}>
                {item.status === 'in-stock' ? 'In Stock' : 
                 item.status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
              </Text>
            </View>

            <View className="flex-row justify-between mt-2">
              <View className="items-center">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>Stock</Text>
                <Text
                  className={`font-bold ${
                    item.status === 'low-stock' 
                      ? (isDarkMode ? 'text-orange-400' : 'text-orange-600')
                      : item.status === 'out-of-stock' 
                        ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                        : (isDarkMode ? 'text-white' : 'text-gray-900')
                  }`}
                >
                  {item.currentStock}
                </Text>
              </View>
              <View className="items-center">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>Min</Text>
                <Text className={`font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{item.minStock}</Text>
              </View>
              <View className="items-center">
                <Text className={`text-xs ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>Value</Text>
                <Text className={`font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  ${totalValue.toFixed(0)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-center mt-2">
              <Icon name="map-marker" size={12} color="#9ca3af" />
              <Text className={`text-xs ml-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`} numberOfLines={1}>
                {item.location.split(',')[0]}
              </Text>
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredInventory.length; i += 2) {
      const rowItems = filteredInventory.slice(i, i + 2);
      rows.push(
        <View key={i} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (!filteredInventory || filteredInventory.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Icon name="package-variant" size={80} color={isDarkMode ? "#4B5563" : "#d1d5db"} />
        <Text className={`text-lg font-semibold mt-4 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          No Items Found
        </Text>
        <Text className={`text-sm text-center mt-2 px-8 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {searchQuery || filters.lowStock || filters.outOfStock
            ? "Try adjusting your search or filters"
            : "Add products to inventory by adding products first"}
        </Text>
      </View>
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
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        <View className="pb-4">
          {viewMode === 'grid' ? renderGridItems() : filteredInventory.map(item => renderListItem(item))}
        </View>
      </ScrollView>
    </View>
  );
};

export default StockList;