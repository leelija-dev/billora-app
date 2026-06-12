import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import useProductStore from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { ConfirmationModal, SuccessModal } from '../../components/common/CustomModal';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const ProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuthStore();
  const { getProduct, deleteProduct, restoreProduct, forceDeleteProduct, getProductTotalStock } = useProductStore();
  const { isDarkMode } = useThemeStore();
  
  const productId = route.params?.productId;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showForceDeleteConfirm, setShowForceDeleteConfirm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const data = await getProduct(productId);
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load product details' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddProduct', { productId: product.id, product });
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setUpdating(true);
    try {
      await deleteProduct(product.id);
      setShowDeleteConfirm(false);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Product deleted successfully' });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete product' });
    } finally {
      setUpdating(false);
    }
  };

  const handleRestore = () => {
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    setUpdating(true);
    try {
      await restoreProduct(product.id);
      setShowRestoreConfirm(false);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Product restored successfully' });
      fetchProduct();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to restore product' });
    } finally {
      setUpdating(false);
    }
  };

  const handleForceDelete = () => {
    setShowForceDeleteConfirm(true);
  };

  const confirmForceDelete = async () => {
    setUpdating(true);
    try {
      await forceDeleteProduct(product.id);
      setShowForceDeleteConfirm(false);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Product permanently deleted' });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to permanently delete product' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddStock = () => {
    setShowStockModal(true);
  };

  const totalStock = product ? getProductTotalStock(product) : 0;
  const lowStockThreshold = product?.minimum_stock_quantity || 10;
  const isLowStock = totalStock <= lowStockThreshold && totalStock > 0;
  const isOutOfStock = totalStock === 0;
  const isDeleted = product?.deleted_at !== null;

  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <Icon name="package-variant" size={60} color={isDarkMode ? '#4b5563' : '#9ca3af'} />
        <Text className={`mt-4 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Product not found</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-6 bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mainImage = product.image ? (typeof product.image === 'string' ? product.image : product.image.url) : null;
  const additionalImages = product.images && Array.isArray(product.images) ? product.images : [];
  const allImages = mainImage ? [mainImage, ...additionalImages] : additionalImages;

  return (
    <ScrollView className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Image Gallery */}
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} className="h-80">
        {allImages.length > 0 ? (
          allImages.map((img, index) => {
            const imageUrl = typeof img === 'string' ? img : img.url;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedImage(imageUrl);
                  setShowImageViewer(true);
                }}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width, height: 320 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="w-screen h-80 bg-gray-200 dark:bg-gray-700 items-center justify-center">
            <Icon name="package-variant" size={80} color={isDarkMode ? '#4b5563' : '#9ca3af'} />
            <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No image available</Text>
          </View>
        )}
      </ScrollView>

      {/* Product Info */}
      <View className="p-5">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{product.name}</Text>
            <Text className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>SKU: {product.sku}</Text>
          </View>
          {!isDeleted && (
            <View className="flex-row">
              <TouchableOpacity onPress={handleEdit} className="p-2 mr-2">
                <Icon name="pencil" size={24} color={isDarkMode ? '#9CA3AF' : '#4b5563'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} className="p-2">
                <Icon name="delete" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Status Badges */}
        <View className="flex-row flex-wrap mb-4">
          {isDeleted ? (
            <View className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full mr-2 mb-2">
              <Text className="text-red-600 dark:text-red-400 text-xs">Deleted</Text>
            </View>
          ) : (
            <>
              <View className={`px-3 py-1 rounded-full mr-2 mb-2 ${product.is_active ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Text className={`text-xs ${product.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
              {isLowStock && (
                <View className="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full mr-2 mb-2">
                  <Text className="text-yellow-600 dark:text-yellow-400 text-xs">Low Stock</Text>
                </View>
              )}
              {isOutOfStock && (
                <View className="bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full mr-2 mb-2">
                  <Text className="text-red-600 dark:text-red-400 text-xs">Out of Stock</Text>
                </View>
              )}
              {product.is_featured && (
                <View className="bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full mr-2 mb-2">
                  <Text className="text-purple-600 dark:text-purple-400 text-xs">Featured</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Pricing Section */}
        <View className={`rounded-2xl p-4 mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Pricing</Text>
          <View className="flex-row justify-between mb-2">
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Selling Price:</Text>
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>₹{parseFloat(product.selling_price || 0).toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Purchase Price:</Text>
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>₹{parseFloat(product.purchase_price || 0).toFixed(2)}</Text>
          </View>
          {product.mrp && (
            <View className="flex-row justify-between mb-2">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>MRP:</Text>
              <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>₹{parseFloat(product.mrp).toFixed(2)}</Text>
            </View>
          )}
          {product.gst_percentage && (
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>GST:</Text>
              <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{product.gst_percentage}%</Text>
            </View>
          )}
        </View>

        {/* Stock Section */}
        <View className={`rounded-2xl p-4 mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Stock Information</Text>
            {!isDeleted && (
              <TouchableOpacity onPress={handleAddStock} className="bg-blue-500 px-3 py-2 rounded-lg">
                <Text className="text-white text-sm">Add Stock</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Stock:</Text>
              <Text className={`font-bold ${isLowStock ? 'text-yellow-500' : isOutOfStock ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {totalStock} {product.unit?.name || 'units'}
              </Text>
            </View>
            <View className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${isLowStock ? 'bg-yellow-500' : isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min((totalStock / (product.maximum_stock_quantity || 100)) * 100, 100)}%` }}
              />
            </View>
          </View>

          {product.minimum_stock_quantity && (
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Low Stock Threshold:</Text>
              <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{product.minimum_stock_quantity} {product.unit?.name || 'units'}</Text>
            </View>
          )}
        </View>

        {/* Categories & Brands */}
        <View className={`rounded-2xl p-4 mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Classification</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category:</Text>
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{product.category?.name || 'Not specified'}</Text>
          </View>
          
          {product.brand && (
            <View className="flex-row justify-between">
              <Text className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Brand:</Text>
              <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{product.brand.name}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {product.description && (
          <View className={`rounded-2xl p-4 mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Description</Text>
            <Text className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-5`}>{product.description}</Text>
          </View>
        )}

        {/* Deleted Product Actions */}
        {isDeleted && (
          <View className="flex-row space-x-3 mb-4">
            <TouchableOpacity
              onPress={handleRestore}
              className="flex-1 bg-green-500 py-3 rounded-xl mr-2"
            >
              <Text className="text-white text-center font-semibold">Restore Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleForceDelete}
              className="flex-1 bg-red-500 py-3 rounded-xl ml-2"
            >
              <Text className="text-white text-center font-semibold">Permanently Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Confirmation Modals */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This product will be moved to trash.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={updating}
      />

      <ConfirmationModal
        visible={showRestoreConfirm}
        title="Restore Product"
        message={`Are you sure you want to restore "${product.name}"?`}
        onConfirm={confirmRestore}
        onCancel={() => setShowRestoreConfirm(false)}
        confirmText="Restore"
        cancelText="Cancel"
        confirmButtonColor="#10b981"
        loading={updating}
      />

      <ConfirmationModal
        visible={showForceDeleteConfirm}
        title="Permanently Delete"
        message={`Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`}
        onConfirm={confirmForceDelete}
        onCancel={() => setShowForceDeleteConfirm(false)}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={updating}
      />

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View className="flex-1 bg-black/90">
          <TouchableOpacity
            onPress={() => setShowImageViewer(false)}
            className="absolute top-12 right-5 z-10 bg-black/50 rounded-full p-2"
          >
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ProductDetailScreen;