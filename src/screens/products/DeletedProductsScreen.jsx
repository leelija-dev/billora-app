import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import useDeletedProductStore from '../../store/deletedProductStore';
import { useThemeStore } from '../../store/themeStore';
import { ConfirmationModal, SuccessModal } from '../../components/common/CustomModal';
import Header from '../../components/common/Header';
import Toast from 'react-native-toast-message';

const DeletedProductsScreen = () => {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const {
    deletedProducts,
    totalDeletedProducts,
    loading,
    pagination,
    fetchDeletedProducts,
    restoreProduct,
    forceDeleteProduct,
    bulkForceDeleteProducts,
  } = useDeletedProductStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchDeletedProducts(user.id);
      }
      return () => {};
    }, [user?.id])
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (user?.id) {
        fetchDeletedProducts(user.id, searchTerm);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchDeletedProducts(user.id);
    }
    setRefreshing(false);
  };

  const handleRestore = (product) => {
    setSelectedProduct(product);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    if (!selectedProduct) return;
    setUpdating(true);
    try {
      await restoreProduct(selectedProduct.id);
      setShowRestoreConfirm(false);
      setSelectedProduct(null);
      setSuccessMessage('Product restored successfully');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to restore product' });
    } finally {
      setUpdating(false);
    }
  };

  const handleForceDelete = (product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  const confirmForceDelete = async () => {
    if (!selectedProduct) return;
    setUpdating(true);
    try {
      await forceDeleteProduct(selectedProduct.id);
      setShowDeleteConfirm(false);
      setSelectedProduct(null);
      setSuccessMessage('Product permanently deleted');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to permanently delete product' });
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkForceDelete = () => {
    if (selectedProducts.length > 0) {
      setShowBulkDeleteConfirm(true);
    }
  };

  const confirmBulkForceDelete = async () => {
    if (selectedProducts.length === 0) return;
    setUpdating(true);
    try {
      await bulkForceDeleteProducts(selectedProducts);
      setSelectedProducts([]);
      setShowBulkDeleteConfirm(false);
      setSuccessMessage(`${selectedProducts.length} products permanently deleted`);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to permanently delete products' });
    } finally {
      setUpdating(false);
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === deletedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(deletedProducts.map(p => p.id));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ProductCard = ({ product, isSelected, onSelect, onRestore, onForceDelete }) => (
    <View className={`rounded-2xl p-4 mb-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="flex-row">
        <TouchableOpacity onPress={() => onSelect(product.id)} className="mr-3">
          <View className={`w-5 h-5 rounded border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : isDarkMode ? 'border-gray-600' : 'border-gray-300'} items-center justify-center`}>
            {isSelected && <Icon name="check" size={12} color="#fff" />}
          </View>
        </TouchableOpacity>

        <View className="flex-1">
          <View className="flex-row items-center">
            {product.image ? (
              <Image
                source={{ uri: typeof product.image === 'string' ? product.image : product.image.url }}
                className="w-16 h-16 rounded-xl mr-3 opacity-75"
                resizeMode="cover"
              />
            ) : (
              <View className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-xl mr-3 items-center justify-center">
                <Icon name="package-variant" size={30} color="#ef4444" />
              </View>
            )}
            <View className="flex-1">
              <Text className={`text-base font-semibold line-through opacity-75 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {product.name}
              </Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>SKU: {product.sku}</Text>
              <Text className={`text-xs mt-1 text-red-500`}>Deleted: {formatDate(product.deleted_at)}</Text>
            </View>
          </View>

          <View className="flex-row justify-end mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              onPress={() => onRestore(product)}
              className="flex-row items-center mr-4 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg"
            >
              <Icon name="restore" size={18} color="#10b981" />
              <Text className="text-green-600 dark:text-green-400 ml-1">Restore</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onForceDelete(product)}
              className="flex-row items-center px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg"
            >
              <Icon name="delete-forever" size={18} color="#ef4444" />
              <Text className="text-red-600 dark:text-red-400 ml-1">Permanent Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header
        title="Deleted Products"
        showBack={true}
        rightComponent={
          selectedProducts.length > 0 && (
            <TouchableOpacity
              onPress={handleBulkForceDelete}
              className="bg-red-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white">Delete All ({selectedProducts.length})</Text>
            </TouchableOpacity>
          )
        }
      />

      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            className={`flex-1 ml-3 text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
            placeholder="Search deleted products..."
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bulk Select Bar */}
      {deletedProducts.length > 0 && (
        <View className="px-4 mb-2">
          <TouchableOpacity
            onPress={selectAllProducts}
            className="flex-row items-center"
          >
            <View className={`w-5 h-5 rounded border-2 mr-2 ${selectedProducts.length === deletedProducts.length ? 'bg-blue-500 border-blue-500' : isDarkMode ? 'border-gray-600' : 'border-gray-300'} items-center justify-center`}>
              {selectedProducts.length === deletedProducts.length && <Icon name="check" size={12} color="#fff" />}
            </View>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Select All ({deletedProducts.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Products List */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3b82f6"]} />
        }
      >
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading deleted products...</Text>
          </View>
        ) : deletedProducts.length > 0 ? (
          <>
            {deletedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={selectedProducts.includes(product.id)}
                onSelect={toggleProductSelection}
                onRestore={handleRestore}
                onForceDelete={handleForceDelete}
              />
            ))}
            <View className="py-4 items-center">
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Page {pagination.current_page} of {pagination.last_page}
              </Text>
            </View>
          </>
        ) : (
          <View className="py-20 items-center">
            <Icon name="delete-empty" size={80} color={isDarkMode ? '#4b5563' : '#9ca3af'} />
            <Text className={`text-lg mt-4 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              No deleted products found
            </Text>
            <Text className={`text-sm mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm ? 'Try a different search term' : 'Deleted products will appear here'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modals */}
      <ConfirmationModal
        visible={showRestoreConfirm}
        title="Restore Product"
        message={`Are you sure you want to restore "${selectedProduct?.name}"?`}
        onConfirm={confirmRestore}
        onCancel={() => setShowRestoreConfirm(false)}
        confirmText="Restore"
        cancelText="Cancel"
        confirmButtonColor="#10b981"
        loading={updating}
      />

      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Permanently Delete"
        message={`Are you sure you want to permanently delete "${selectedProduct?.name}"? This action cannot be undone.`}
        onConfirm={confirmForceDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={updating}
      />

      <ConfirmationModal
        visible={showBulkDeleteConfirm}
        title="Bulk Permanent Delete"
        message={`Are you sure you want to permanently delete ${selectedProducts.length} selected products? This action cannot be undone.`}
        onConfirm={confirmBulkForceDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        confirmText="Delete All"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={updating}
      />

      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />
    </View>
  );
};

export default DeletedProductsScreen;