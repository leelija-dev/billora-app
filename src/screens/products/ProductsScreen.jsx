// screens/ProductScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useProductStore } from '../../store/productStore';
import { useThemeStore } from '../../store/themeStore';
import { useFocusEffect } from '@react-navigation/native';
import ProductList from '../../components/products/ProductList';
import StatsCard from '../../components/dashboard/StatsCard';
import Header from '../../components/common/Header';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const ProductScreen = ({ navigation }) => {
  const { isDarkMode } = useThemeStore();
  
  const {
    products,
    loading,
    error,
    totalProducts,
    currentPage,
    lastPage,
    perPage,
    pagination,
    filters,
    fetchProducts,
    setFilters,
    setPage,
    deleteProduct,
    getProductTotalStock,
  } = useProductStore();

  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showStats, setShowStats] = useState(true);

  // Load products on mount
  useFocusEffect(
    useCallback(() => {
      fetchProducts(1);
      return () => {};
    }, [])
  );

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText !== filters.search) {
        setFilters({ search: searchText });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  // Calculate product statistics
  const productStats = useMemo(() => {
    const total = products.length;
    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let active = 0;
    let inactive = 0;

    products.forEach(product => {
      const stock = getProductTotalStock(product);
      totalStock += stock;
      
      if (stock === 0) {
        outOfStock++;
      } else {
        const minStock = parseFloat(product.minimum_stock_quantity || product.reorder_level || 10);
        if (stock <= minStock) {
          lowStock++;
        }
      }
      
      if (product.is_active) {
        active++;
      } else {
        inactive++;
      }
    });

    return {
      totalProducts: total,
      totalStock,
      lowStock,
      outOfStock,
      activeProducts: active,
      inactiveProducts: inactive,
      inStock: total - lowStock - outOfStock,
    };
  }, [products, getProductTotalStock]);

  // Get filtered products based on status
  const getFilteredProducts = useMemo(() => {
    if (selectedStatus === 'all') return products;
    if (selectedStatus === 'active') return products.filter(p => p.is_active === 1 || p.is_active === true);
    if (selectedStatus === 'inactive') return products.filter(p => p.is_active === 0 || p.is_active === false);
    return products;
  }, [products, selectedStatus]);

  // Helper function to format price
  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts(1, true);
    setRefreshing(false);
  }, [fetchProducts]);

  // Navigate to create product
  const handleCreateProduct = () => {
    navigation.navigate('AddProduct', { mode: 'create' });
  };

  // Navigate to edit product
  const handleEditProduct = (product) => {
    navigation.navigate('AddProduct', { 
      mode: 'edit', 
      productId: product.id,
      product: product 
    });
  };

  // Navigate to deleted products
  const handleViewDeletedProducts = () => {
    navigation.navigate('DeletedProduct');
  };

  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteProduct(productId);
            if (result.success) {
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Product deleted successfully',
              });
              await fetchProducts(currentPage, true);
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: result.error || 'Failed to delete product',
              });
            }
          },
        },
      ]
    );
  };

  // Handle stock update
  const handleStockUpdate = async () => {
    await fetchProducts(currentPage, true);
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page !== currentPage && page >= 1 && page <= lastPage) {
      setPage(page);
    }
  };

  // Get page numbers for pagination
  const getPageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    
    if (lastPage <= maxVisible) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(lastPage - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= lastPage - 2) {
        start = lastPage - 3;
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < lastPage - 1) {
        pages.push('...');
      }
      
      if (lastPage > 1) {
        pages.push(lastPage);
      }
    }
    
    return pages;
  }, [currentPage, lastPage]);

  // Handle view mode toggle
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  // Toggle stats visibility
  const toggleStats = () => {
    setShowStats(!showStats);
  };

  // Handle product view (navigate to detail)
  const handleProductView = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  // Pagination Component
  const Pagination = () => {
    if (lastPage <= 1) return null;

    return (
      <View className={`px-3 py-3 border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalProducts)} of {totalProducts}
          </Text>
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Page {currentPage} of {lastPage}
          </Text>
        </View>
        
        <View className="flex-row items-center justify-center flex-wrap">
          <TouchableOpacity
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-lg mr-1 ${currentPage === 1 ? 'opacity-40' : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <Ionicons name="chevron-back" size={18} color={isDarkMode ? "#9CA3AF" : "#4B5563"} />
          </TouchableOpacity>

          {getPageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <View key={`ellipsis-${index}`} className="px-2">
                  <Text className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>...</Text>
                </View>
              );
            }
            
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handlePageChange(page)}
                className={`px-3.5 py-1.5 rounded-lg mx-0.5 ${
                  page === currentPage
                    ? 'bg-blue-500'
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  page === currentPage ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {page}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === lastPage}
            className={`px-3 py-1.5 rounded-lg ml-1 ${currentPage === lastPage ? 'opacity-40' : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <Ionicons name="chevron-forward" size={18} color={isDarkMode ? "#9CA3AF" : "#4B5563"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Stats Section - Grid Layout
  const StatsSection = () => {
    if (!showStats) return null;

    const statsData = [
      {
        id: 1,
        title: 'Total Products',
        value: productStats.totalProducts,
        icon: 'package-variant',
        color: '#667eea',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      },
      {
        id: 2,
        title: 'Total Stock',
        value: productStats.totalStock,
        icon: 'warehouse',
        color: '#10B981',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      },
      {
        id: 3,
        title: 'In Stock',
        value: productStats.inStock,
        icon: 'check-circle',
        color: '#3B82F6',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      },
      {
        id: 4,
        title: 'Low Stock',
        value: productStats.lowStock,
        icon: 'alert',
        color: '#F59E0B',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      },
      {
        id: 5,
        title: 'Out of Stock',
        value: productStats.outOfStock,
        icon: 'alert-circle',
        color: '#EF4444',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
      },
      {
        id: 6,
        title: 'Active Products',
        value: productStats.activeProducts,
        icon: 'check-circle-outline',
        color: '#8B5CF6',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      },
    ];

    // Split into 2 columns
    const column1 = statsData.filter((_, index) => index % 2 === 0);
    const column2 = statsData.filter((_, index) => index % 2 === 1);

    return (
      <View className={`px-4 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <View className="flex-row">
          {/* Left Column */}
          <View className="flex-1 mr-2">
            {column1.map((stat) => (
              <TouchableOpacity
                key={stat.id}
                activeOpacity={0.8}
                className={`mb-2 rounded-2xl p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stat.title}
                    </Text>
                    <Text className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </Text>
                  </View>
                  <View className={`p-3 rounded-2xl ${stat.bgColor}`}>
                    <Icon name={stat.icon} size={24} color={stat.color} />
                  </View>
                </View>
                {/* Mini progress bar */}
                <View className="mt-3 h-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${Math.min((stat.value / Math.max(productStats.totalProducts || 1, 1)) * 100, 100)}%`,
                      backgroundColor: stat.color 
                    }} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Right Column */}
          <View className="flex-1 ml-2">
            {column2.map((stat) => (
              <TouchableOpacity
                key={stat.id}
                activeOpacity={0.8}
                className={`mb-2 rounded-2xl p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stat.title}
                    </Text>
                    <Text className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stat.value}
                    </Text>
                  </View>
                  <View className={`p-3 rounded-2xl ${stat.bgColor}`}>
                    <Icon name={stat.icon} size={24} color={stat.color} />
                  </View>
                </View>
                <View className="mt-3 h-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${Math.min((stat.value / Math.max(productStats.totalProducts || 1, 1)) * 100, 100)}%`,
                      backgroundColor: stat.color 
                    }} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Product Detail Modal
  const ProductDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className={`rounded-t-3xl max-h-[80%] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="items-center pt-2">
            <View className={`w-12 h-1 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
          </View>
          
          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            {selectedProduct && (
              <>
                <View className="flex-row justify-between items-start mb-4">
                  <Text className={`text-2xl font-bold flex-1 mr-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {selectedProduct.name || 'Unnamed Product'}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${selectedProduct.is_active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    <Text className={`text-xs font-medium ${selectedProduct.is_active ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {selectedProduct.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View className={`rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <View className="flex-row justify-between mb-2">
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>SKU</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selectedProduct.sku || 'N/A'}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {selectedProduct.category?.name || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Brand</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {selectedProduct.brand?.name || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unit</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {selectedProduct.unit?.name || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View className={`rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <Text className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pricing</Text>
                  <View className="flex-row justify-between mb-1.5">
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Selling Price</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      ₹{formatPrice(selectedProduct.selling_price)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-1.5">
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Purchase Price</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      ₹{formatPrice(selectedProduct.purchase_price)}
                    </Text>
                  </View>
                  {selectedProduct.mrp && (
                    <View className="flex-row justify-between mb-1.5">
                      <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>MRP</Text>
                      <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        ₹{formatPrice(selectedProduct.mrp)}
                      </Text>
                    </View>
                  )}
                  {selectedProduct.gst_percentage && (
                    <View className="flex-row justify-between">
                      <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>GST</Text>
                      <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {selectedProduct.gst_percentage}%
                      </Text>
                    </View>
                  )}
                </View>

                <View className={`rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <Text className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Stock Information</Text>
                  <View className="flex-row justify-between mb-1.5">
                    <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Stock</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {getProductTotalStock(selectedProduct)}
                    </Text>
                  </View>
                  {selectedProduct.minimum_stock_quantity && (
                    <View className="flex-row justify-between mb-1.5">
                      <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Min Stock Level</Text>
                      <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {selectedProduct.minimum_stock_quantity}
                      </Text>
                    </View>
                  )}
                  {selectedProduct.maximum_stock_quantity && (
                    <View className="flex-row justify-between">
                      <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Max Stock Level</Text>
                      <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {selectedProduct.maximum_stock_quantity}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedProduct.description && (
                  <View className={`rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Text className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</Text>
                    <Text className={`text-sm leading-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedProduct.description}
                    </Text>
                  </View>
                )}

                <View className="flex-row space-x-3 mt-2">
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      handleEditProduct(selectedProduct);
                    }}
                    className="flex-1 bg-blue-500 py-3 rounded-xl"
                  >
                    <Text className="text-white font-semibold text-center">Edit Product</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      handleDeleteProduct(selectedProduct.id);
                    }}
                    className="flex-1 bg-red-500 py-3 rounded-xl"
                  >
                    <Text className="text-white font-semibold text-center">Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <Text className={`text-center font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Filter Modal
  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className={`rounded-t-3xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="items-center mb-4">
            <View className={`w-12 h-1 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
          </View>
          
          <Text className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Filter Products</Text>
          
          <View className="mb-6">
            <Text className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</Text>
            <View className="flex-row flex-wrap">
              {['all', 'active', 'inactive'].map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                    selectedStatus === status
                      ? 'bg-blue-500'
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedStatus === status
                      ? 'text-white'
                      : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              setFilterModalVisible(false);
              setSelectedStatus('all');
              setFilters({});
            }}
            className={`py-3 rounded-xl mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <Text className={`text-center font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Reset Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(false)}
            className="bg-blue-500 py-3 rounded-xl"
          >
            <Text className="text-center text-white font-semibold">Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Show loading state
  if (loading && products.length === 0) {
    return (
      <View className={`flex-1 items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />

      {/* Header */}
      <Header 
        title="Products"
        showSidebar={true}
        activeScreen="Products"
        notificationCount={3}
        onNavigate={(item) => {
          if (item.screen) {
            navigation.navigate(item.screen);
          }
        }}
      />

      {/* Stats Toggle Button */}
      <TouchableOpacity
        onPress={toggleStats}
        className={`px-4 py-3 flex-row items-center justify-between ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <View className="flex-row items-center">
          <Icon 
            name="chart-bar" 
            size={20} 
            color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
          />
          <Text className={`text-sm font-medium ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {showStats ? 'Hide Statistics' : 'Show Statistics'}
          </Text>
        </View>
        <Icon 
          name={showStats ? 'chevron-up' : 'chevron-down'} 
          size={22} 
          color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
        />
      </TouchableOpacity>

      {/* Stats Section - Grid Layout */}
      <StatsSection />

      {/* Search and Filter Bar */}
      <View className={`px-4 py-3 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <View className="flex-row items-center">
          <View className={`flex-1 flex-row items-center rounded-xl px-3 py-2 mr-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <Ionicons name="search-outline" size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
            <TextInput
              className={`flex-1 ml-2 text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
              placeholder="Search products..."
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={searchText}
              onChangeText={setSearchText}
              clearButtonMode="while-editing"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={18} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <Ionicons name="options-outline" size={22} color={isDarkMode ? "#9CA3AF" : "#4B5563"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleViewMode}
            className={`ml-2 p-2.5 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
          >
            <Icon 
              name={viewMode === 'grid' ? 'view-list' : 'view-grid'} 
              size={22} 
              color={isDarkMode ? "#9CA3AF" : "#4B5563"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Product List */}
      <View className="flex-1 px-4">
        <ProductList
          viewMode={viewMode}
          searchQuery={searchText}
          category="all"
          products={getFilteredProducts}
          loading={loading}
          onView={handleProductView}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onStockUpdate={handleStockUpdate}
          isPaginating={loading && products.length > 0}
        />
      </View>

      {/* Pagination - Fixed at bottom */}
      <Pagination />

      {/* Modals */}
      <ProductDetailModal />
      <FilterModal />

      {/* Toast for notifications */}
      <Toast />
    </SafeAreaView>
  );
};

export default ProductScreen;