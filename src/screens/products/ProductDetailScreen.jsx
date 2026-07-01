// screens/ProductDetailScreen.js - FIXED QR Display with reliable loading
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Share,
  Platform,
  Linking,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useProductStore } from '../../store/productStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import Header from '../../components/common/Header';
import StatusBadge from '../../components/common/StatusBadge';
import { SuccessModal, ErrorModal, ConfirmationModal } from '../../components/common/CustomModal';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { printToFileAsync } from 'expo-print';
import * as Print from 'expo-print';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
  const { productId } = route.params;
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  const {
    getProduct,
    deleteProduct,
    fetchProducts,
    loading,
    error,
  } = useProductStore();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeQrTab, setActiveQrTab] = useState('qr');
  const [isDeleting, setIsDeleting] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [stockHistory, setStockHistory] = useState([]);
  
  // QR/Barcode image states - FIXED: Start with false
  const [qrImageLoading, setQrImageLoading] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const [qrImageLoaded, setQrImageLoaded] = useState(false);
  
  const [barcodeImageLoading, setBarcodeImageLoading] = useState(false);
  const [barcodeImageError, setBarcodeImageError] = useState(false);
  const [barcodeImageLoaded, setBarcodeImageLoaded] = useState(false);

  // Print settings
  const [printSettings, setPrintSettings] = useState({
    pageSize: 'A4',
    copies: 1,
    quantity: 1,
  });

  // Get filtered menu items
  const menuItems = useMemo(() => {
    const filtered = getFilteredMenuItems();
    return filtered.map((item) => ({
      id: item.id,
      title: item.name,
      screen: item.screen,
      icon: item.icon,
      iconActive: item.iconActive,
      badge: item.badge || null,
    }));
  }, [getFilteredMenuItems]);

  // Reset states when modal opens or tab changes
  useEffect(() => {
    if (showQRModal) {
      if (activeQrTab === 'qr') {
        // Reset QR states
        setQrImageLoading(true);
        setQrImageError(false);
        setQrImageLoaded(false);
        // Preload QR image
        if (product?.qr_code) {
          Image.prefetch(product.qr_code).then(() => {
            setQrImageLoading(false);
            setQrImageLoaded(true);
          }).catch(() => {
            setQrImageLoading(false);
            setQrImageError(true);
          });
        } else {
          setQrImageLoading(false);
          setQrImageError(true);
        }
      } else {
        // Reset Barcode states
        setBarcodeImageLoading(true);
        setBarcodeImageError(false);
        setBarcodeImageLoaded(false);
        // Preload Barcode image
        if (product?.barcode) {
          Image.prefetch(product.barcode).then(() => {
            setBarcodeImageLoading(false);
            setBarcodeImageLoaded(true);
          }).catch(() => {
            setBarcodeImageLoading(false);
            setBarcodeImageError(true);
          });
        } else {
          setBarcodeImageLoading(false);
          setBarcodeImageError(true);
        }
      }
    }
  }, [showQRModal, activeQrTab, product]);

  // Helper functions
  const getProductTotalStock = (product) => {
    if (!product || !product.stocks || !Array.isArray(product.stocks)) return 0;
    return product.stocks.reduce((total, stock) => {
      const quantity = parseFloat(stock.quantity) || 0;
      return total + quantity;
    }, 0);
  };

  const getProductStocks = (product) => {
    if (!product || !product.stocks || !Array.isArray(product.stocks)) return [];
    return product.stocks;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getProfitMargin = () => {
    if (!product?.selling_price || !product?.purchase_price) return 0;
    const profit = parseFloat(product.selling_price) - parseFloat(product.purchase_price);
    return ((profit / parseFloat(product.purchase_price)) * 100).toFixed(1);
  };

  const getStockStatus = (quantity) => {
    const lowStockThreshold = parseFloat(product?.minimum_stock_quantity) || 10;
    if (!quantity || quantity === 0) {
      return { label: 'Out of Stock', bg: 'bg-red-100 dark:bg-red-900/20', textColor: 'text-red-700 dark:text-red-400', icon: 'close-circle' };
    }
    if (quantity <= lowStockThreshold) {
      return { label: 'Low Stock', bg: 'bg-orange-100 dark:bg-orange-900/20', textColor: 'text-orange-700 dark:text-orange-400', icon: 'alert-circle' };
    }
    if (quantity <= lowStockThreshold * 2) {
      return { label: 'Medium Stock', bg: 'bg-yellow-100 dark:bg-yellow-900/20', textColor: 'text-yellow-700 dark:text-yellow-400', icon: 'pulse' };
    }
    return { label: 'In Stock', bg: 'bg-green-100 dark:bg-green-900/20', textColor: 'text-green-700 dark:text-green-400', icon: 'checkmark-circle' };
  };

  const getStockPercentage = () => {
    const totalStock = getProductTotalStock(product);
    const maxStock = parseFloat(product?.maximum_stock_quantity) || 100;
    return Math.min((totalStock / maxStock) * 100, 100);
  };

  const parseAttributes = (attributes) => {
    if (!attributes) return null;
    try {
      if (Array.isArray(attributes)) {
        return attributes.flatMap(item => Object.entries(item));
      }
      if (typeof attributes === 'object') {
        return Object.entries(attributes);
      }
      if (typeof attributes === 'string') {
        const parsed = JSON.parse(attributes);
        if (typeof parsed === 'string') {
          return parseAttributes(parsed);
        }
        if (Array.isArray(parsed)) {
          return parsed.flatMap(item => Object.entries(item));
        }
        return Object.entries(parsed);
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Escape HTML for print
  const escapeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Fetch product details
  useFocusEffect(
    useCallback(() => {
      fetchProductDetails();
    }, [productId])
  );

  const fetchProductDetails = async () => {
    setIsLoading(true);
    try {
      const productData = await getProduct(parseInt(productId));
      if (!productData) {
        setErrorMessage('Product not found');
        setErrorModalVisible(true);
        navigation.goBack();
        return;
      }
      setProduct(productData);
      
      // Set print quantity to current stock
      const totalStock = getProductTotalStock(productData);
      setPrintSettings(prev => ({ ...prev, quantity: totalStock || 1 }));
      
      // Mock stock history (replace with actual API call when available)
      setStockHistory([]);
    } catch (error) {
      console.error('Error fetching product details:', error);
      setErrorMessage('Failed to load product details');
      setErrorModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProductDetails();
    setRefreshing(false);
  };

  const handleEdit = () => {
    navigation.navigate('AddProduct', {
      mode: 'edit',
      productId: product.id,
      product: product,
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteProduct(parseInt(productId));
      if (result.success) {
        setSuccessMessage('Product deleted successfully');
        setSuccessModalVisible(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        setErrorMessage(result.error || 'Failed to delete product');
        setErrorModalVisible(true);
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred');
      setErrorModalVisible(true);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopySKU = async () => {
    await Clipboard.setStringAsync(product.sku);
    setSuccessMessage('SKU copied to clipboard');
    setSuccessModalVisible(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product.name} - ${product.sku}`,
        url: product.image || undefined,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Generate print HTML
  const generatePrintHTML = () => {
    const isQR = activeQrTab === 'qr';
    const imageUrl = isQR ? product.qr_code : product.barcode;
    const label = isQR ? 'QR Code' : 'Barcode';
    const quantity = printSettings.quantity || getProductTotalStock(product) || 1;
    const isA4 = printSettings.pageSize === 'A4';

    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      setErrorMessage(`${label} not available for this product`);
      setErrorModalVisible(true);
      return null;
    }

    let htmlContent = '';
    const htmlParts = [];

    if (isA4) {
      const itemsPerPage = 12;
      const totalPages = Math.ceil(quantity / itemsPerPage);

      for (let page = 0; page < totalPages; page++) {
        const startIdx = page * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, quantity);
        const itemsOnPage = endIdx - startIdx;
        const rowsNeeded = Math.ceil(itemsOnPage / 3);

        htmlParts.push(`
          <div class="a4-page">
            <div class="page-header">
              <h2>${label}s - ${escapeHtml(product.name)}</h2>
              <p class="page-number">Page ${page + 1} of ${totalPages}</p>
            </div>
            <div class="qr-grid" style="--rows: ${rowsNeeded};">
        `);

        for (let i = 0; i < itemsOnPage; i++) {
          const itemNumber = startIdx + i + 1;
          htmlParts.push(`
            <div class="qr-item">
              <div class="qr-image-wrapper">
                <img src="${imageUrl}" class="qr-image ${isQR ? 'qr-type' : 'barcode-type'}" crossorigin="anonymous" />
              </div>
              <div class="qr-info">
                <div class="product-name">${escapeHtml(product.name)}</div>
                <div class="product-sku">SKU: ${product.sku}</div>
                <div class="product-number">#${itemNumber}</div>
              </div>
            </div>
          `);
        }

        if (page === totalPages - 1 && itemsOnPage < itemsPerPage) {
          const remainingSlots = itemsPerPage - itemsOnPage;
          for (let i = 0; i < remainingSlots; i++) {
            htmlParts.push(`<div class="qr-item empty-item"></div>`);
          }
        }

        htmlParts.push(`
            </div>
          </div>
        `);
      }
    } else {
      for (let i = 0; i < quantity; i++) {
        htmlParts.push(`
          <div class="thermal-page">
            <div class="thermal-content">
              <div class="thermal-image-wrapper">
                <img src="${imageUrl}" class="thermal-image ${isQR ? 'qr-type' : 'barcode-type'}" crossorigin="anonymous" />
              </div>
              <div class="thermal-info">
                <div class="thermal-product-name">${escapeHtml(product.name)}</div>
                <div class="thermal-sku">SKU: ${product.sku}</div>
                <div class="thermal-number">#${i + 1} of ${quantity}</div>
              </div>
            </div>
          </div>
        `);
      }
    }

    htmlContent = htmlParts.join('');

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: white; margin: 0; padding: 0; }
        
        .a4-page {
          page-break-after: always;
          page-break-inside: avoid;
          min-height: 297mm;
          padding: 15mm;
          background: white;
          position: relative;
        }
        .a4-page:last-child { page-break-after: auto; }
        
        .page-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        }
        .page-header h2 { font-size: 18px; color: #1f2937; margin-bottom: 5px; }
        .page-number { font-size: 12px; color: #6b7280; }
        
        .qr-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }
        
        .qr-item {
          break-inside: avoid;
          page-break-inside: avoid;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 15px;
          text-align: center;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .qr-item.empty-item {
          visibility: hidden;
          border: 1px dashed #e5e7eb;
          background: transparent;
          box-shadow: none;
        }
        
        .qr-image-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .qr-image.qr-type { width: 120px; height: 120px; object-fit: contain; }
        .qr-image.barcode-type { width: 220px; height: 70px; object-fit: contain; }
        
        .qr-info { text-align: center; }
        .product-name {
          font-weight: 600;
          font-size: 13px;
          color: #1f2937;
          margin-bottom: 4px;
          word-break: break-word;
        }
        .product-sku {
          font-size: 10px;
          color: #6b7280;
          font-family: monospace;
          margin-bottom: 4px;
        }
        .product-number { font-size: 10px; color: #9ca3af; }
        
        .thermal-page {
          page-break-after: always;
          page-break-inside: avoid;
          width: 3in;
          height: 5in;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: white;
          margin: 0;
          padding: 0.2in;
          box-sizing: border-box;
        }
        .thermal-page:last-child { page-break-after: auto; }
        
        .thermal-content {
          text-align: center;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          padding: 10px;
        }
        
        .thermal-image-wrapper { flex-shrink: 0; margin-bottom: 15px; }
        .thermal-image.qr-type { width: 1.4in; height: 1.4in; object-fit: contain; }
        .thermal-image.barcode-type { width: 2.2in; height: 0.8in; object-fit: contain; }
        
        .thermal-info { flex-shrink: 0; }
        .thermal-product-name {
          font-weight: 600;
          font-size: 11px;
          color: #1f2937;
          text-align: center;
          margin-bottom: 6px;
          word-break: break-word;
          max-width: 2.5in;
        }
        .thermal-sku {
          font-size: 9px;
          color: #6b7280;
          font-family: monospace;
          margin-bottom: 6px;
          text-align: center;
        }
        .thermal-number { font-size: 8px; color: #9ca3af; text-align: center; }
        
        @media print {
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .a4-page { page-break-after: always; page-break-inside: avoid; }
          .thermal-page { page-break-after: always; page-break-inside: avoid; }
          img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .empty-item { display: block !important; visibility: hidden !important; }
          .qr-grid { page-break-inside: avoid; }
        }
        
        @media screen and (max-width: 768px) {
          .qr-grid { gap: 12px; }
          .qr-item { padding: 10px; }
          .qr-image.qr-type { width: 80px; height: 80px; }
          .qr-image.barcode-type { width: 160px; height: 50px; }
        }
      </style>
    `;

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Print ${label}s - ${escapeHtml(product.name)}</title>
          ${styles}
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>`;
  };

  const handlePrintQRBarcode = async () => {
    const isQR = activeQrTab === 'qr';
    const imageUrl = isQR ? product.qr_code : product.barcode;
    const label = isQR ? 'QR Code' : 'Barcode';
    const quantity = printSettings.quantity || getProductTotalStock(product) || 1;

    if (!imageUrl) {
      setErrorMessage(`${label} not available for this product`);
      setErrorModalVisible(true);
      return;
    }

    if (quantity < 1) {
      setErrorMessage('Please enter a valid quantity to print');
      setErrorModalVisible(true);
      return;
    }

    setIsPrinting(true);

    try {
      const html = generatePrintHTML();
      if (!html) {
        setIsPrinting(false);
        return;
      }

      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false,
      });

      if (uri) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Print ${label}s`,
          });
          setSuccessMessage(`Print job prepared for ${quantity} ${label.toLowerCase()}(s)`);
          setSuccessModalVisible(true);
        } else {
          setErrorMessage('Sharing is not available on this device');
          setErrorModalVisible(true);
        }
      }
    } catch (error) {
      console.error('Print error:', error);
      setErrorMessage('Failed to prepare print. Please try again.');
      setErrorModalVisible(true);
    } finally {
      setIsPrinting(false);
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'information-circle' },
    { id: 'details', label: 'Details', icon: 'clipboard' },
    { id: 'stock', label: 'Stock History', icon: 'bar-chart' },
    { id: 'variants', label: 'Variants', icon: 'grid' },
  ];

  if (isLoading) {
    return (
      <View className={`flex-1 items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading product details...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className={`flex-1 items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text className={`mt-4 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Product Not Found
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 px-6 py-3 bg-blue-500 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalStock = getProductTotalStock(product);
  const stockRecords = getProductStocks(product);
  const category = product.category || null;
  const brand = product.brand || null;
  const unit = product.unit || null;
  const stockStatus = getStockStatus(totalStock);
  const profitMargin = getProfitMargin();
  const attributeEntries = parseAttributes(product.attributes);

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header
        title={product?.name || 'Product Details'}
        userName={user?.name || 'User'}
        userEmail={user?.email || 'guest@example.com'}
        activeScreen="Products"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleCopySKU}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Ionicons
                name="copy-outline"
                size={20}
                color={isDarkMode ? '#9CA3AF' : '#4B5563'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowQRModal(true)}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
              }`}
            >
              <Ionicons
                name="qr-code-outline"
                size={20}
                color="#8B5CF6"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}
            >
              <Ionicons
                name="pencil"
                size={20}
                color="#3B82F6"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDeleteConfirm(true)}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
              }`}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color="#EF4444"
              />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor={isDarkMode ? '#F9FAFB' : '#3B82F6'}
          />
        }
      >
        {/* Product Image */}
        <View className={`px-4 pt-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <View className={`rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {product.image ? (
              <Image
                source={{ uri: product.image }}
                className="w-full h-80"
                resizeMode="contain"
              />
            ) : (
              <View className="w-full h-80 items-center justify-center">
                <Ionicons
                  name="image-outline"
                  size={64}
                  color={isDarkMode ? '#4B5563' : '#9CA3AF'}
                />
                <Text className={`mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No image available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Cards - Keep existing */}
        <View className="px-4 pt-4">
          <View className="flex-row flex-wrap">
            <View className="w-[48%] mr-[2%] mb-3">
              <View className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Stock</Text>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalStock}</Text>
                <View className="mt-2">
                  <View className={`px-2 py-1 rounded-full self-start ${stockStatus.bg}`}>
                    <Text className={`text-xs font-medium ${stockStatus.textColor}`}>{stockStatus.label}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="w-[48%] mb-3">
              <View className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Selling Price</Text>
                <Text className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(product.selling_price)}
                </Text>
                <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                  Purchase: {formatCurrency(product.purchase_price)}
                </Text>
              </View>
            </View>

            <View className="w-[48%] mr-[2%] mb-3">
              <View className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Profit Margin</Text>
                <Text className={`text-2xl font-bold mt-1 ${profitMargin > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {profitMargin}%
                </Text>
              </View>
            </View>

            <View className="w-[48%] mb-3">
              <View className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category</Text>
                <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {category?.name || 'Uncategorized'}
                </Text>
                {brand && (
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                    Brand: {brand.name}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className={`px-4 mt-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <View className={`flex-row rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 items-center ${
                  activeTab === tab.id
                    ? isDarkMode
                      ? 'bg-gray-700 border-b-2 border-blue-500'
                      : 'bg-blue-50 border-b-2 border-blue-500'
                    : ''
                }`}
              >
                <Ionicons
                  name={tab.icon}
                  size={20}
                  color={activeTab === tab.id ? '#3B82F6' : isDarkMode ? '#9CA3AF' : '#6B7280'}
                />
                <Text className={`text-xs mt-1 ${activeTab === tab.id ? 'text-blue-500 font-medium' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View className={`px-4 py-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <View className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {product.description && (
                <View className="mb-6">
                  <Text className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Description
                  </Text>
                  <Text className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {product.description}
                  </Text>
                </View>
              )}

              <View>
                <Text className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Product Information
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  <View className={`flex-1 min-w-[45%] p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Category</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {category?.name || 'Uncategorized'}
                    </Text>
                  </View>

                  <View className={`flex-1 min-w-[45%] p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Brand</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {brand?.name || 'No brand'}
                    </Text>
                  </View>

                  <View className={`flex-1 min-w-[45%] p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unit</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {unit ? `${product.unit_amount || '1'} ${unit.name}` : 'N/A'}
                    </Text>
                  </View>

                  <View className={`flex-1 min-w-[45%] p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</Text>
                    <StatusBadge
                      status={product.is_active ? 'active' : 'inactive'}
                      variant={product.is_active ? 'success' : 'default'}
                    />
                  </View>

                  {product.minimum_stock_quantity && (
                    <View className={`flex-1 min-w-[45%] p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Low Stock Threshold</Text>
                      <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {product.minimum_stock_quantity} units
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <View className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {attributeEntries && attributeEntries.length > 0 && (
                <View className="mb-6">
                  <Text className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Attributes</Text>
                  <View className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <View className="flex-row flex-wrap gap-3">
                      {attributeEntries.map(([key, value]) => (
                        <View key={key} className="flex-1 min-w-[45%] py-2 border-b border-gray-200 dark:border-gray-600 last:border-0">
                          <Text className={`text-sm capitalize font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {key}:
                          </Text>
                          <Text className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {String(value)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              <View>
                <Text className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Timeline</Text>
                <View className="flex-row flex-wrap gap-3">
                  <View className={`flex-1 min-w-[45%] p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created At</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatDate(product.created_at)}
                    </Text>
                  </View>

                  <View className={`flex-1 min-w-[45%] p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Updated</Text>
                    <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatDate(product.updated_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Stock History Tab */}
          {activeTab === 'stock' && (
            <View className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {stockHistory.length > 0 ? (
                <View className="space-y-3">
                  {stockHistory.map((entry, index) => (
                    <View key={index} className={`flex-row items-center justify-between p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <View className="flex-row items-center flex-1">
                        <View className={`w-10 h-10 rounded-lg items-center justify-center ${
                          entry.type === 'purchase' ? (isDarkMode ? 'bg-green-900/20' : 'bg-green-100') :
                          entry.type === 'sale' ? (isDarkMode ? 'bg-red-900/20' : 'bg-red-100') :
                          (isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-100')
                        }`}>
                          <Ionicons
                            name={entry.type === 'purchase' ? 'trending-up-outline' : entry.type === 'sale' ? 'trending-down-outline' : 'pulse-outline'}
                            size={20}
                            color={
                              entry.type === 'purchase' ? (isDarkMode ? '#34D399' : '#10B981') :
                              entry.type === 'sale' ? (isDarkMode ? '#F87171' : '#EF4444') :
                              (isDarkMode ? '#FBBF24' : '#F59E0B')
                            }
                          />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {entry.type === 'purchase' ? 'Stock Added' :
                             entry.type === 'sale' ? 'Stock Removed' :
                             'Stock Adjusted'}
                          </Text>
                          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {entry.date} • {entry.user}
                          </Text>
                        </View>
                      </View>
                      <Text className={`font-semibold ${entry.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="bar-chart-outline" size={48} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
                  <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No stock history available
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <View className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {product.variants && product.variants.length > 0 ? (
                <View className="space-y-3">
                  {product.variants.map((variant, index) => (
                    <View key={index} className={`flex-row items-center justify-between p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <View className="flex-1">
                        <View className="space-y-1">
                          {variant.size && (
                            <View className="flex-row items-center">
                              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Size:</Text>
                              <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} ml-2`}>
                                {variant.size}
                              </Text>
                            </View>
                          )}
                          {variant.color && (
                            <View className="flex-row items-center">
                              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Color:</Text>
                              <View className="ml-2 flex-row items-center">
                                <View
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: variant.color.toLowerCase() }}
                                />
                                <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} ml-2`}>
                                  {variant.color}
                                </Text>
                              </View>
                            </View>
                          )}
                          {variant.material && (
                            <View className="flex-row items-center">
                              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Material:</Text>
                              <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} ml-2`}>
                                {variant.material}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="items-center py-8">
                  <Ionicons name="grid-outline" size={48} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
                  <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No variants available
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* QR Code & Barcode Modal - FIXED with proper loading */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className={`rounded-t-3xl max-h-[85%] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="items-center pt-2">
              <View className={`w-12 h-1 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
            </View>

            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  QR Code & Barcode
                </Text>
                <TouchableOpacity
                  onPress={() => setShowQRModal(false)}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#374151'} />
                </TouchableOpacity>
              </View>

              {/* Print Settings */}
              <View className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Text className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Print Settings
                </Text>
                
                <View className="mb-3">
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Page Size
                  </Text>
                  <View className="flex-row">
                    {['A4', 'Thermal'].map((size) => (
                      <TouchableOpacity
                        key={size}
                        onPress={() => setPrintSettings(prev => ({ ...prev, pageSize: size }))}
                        className={`px-4 py-2 rounded-lg mr-2 ${
                          printSettings.pageSize === size
                            ? 'bg-blue-500'
                            : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                        }`}
                      >
                        <Text className={`${
                          printSettings.pageSize === size
                            ? 'text-white'
                            : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {size === 'A4' ? 'A4 Paper' : 'Thermal Label'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    Quantity to Print
                  </Text>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => setPrintSettings(prev => ({ 
                        ...prev, 
                        quantity: Math.max(1, (prev.quantity || 1) - 1) 
                      }))}
                      className={`px-3 py-2 rounded-l-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                    >
                      <Ionicons name="remove" size={20} color={isDarkMode ? '#fff' : '#374151'} />
                    </TouchableOpacity>
                    <TextInput
                      value={String(printSettings.quantity || 1)}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 1;
                        const maxQuantity = totalStock || 1;
                        if (value > maxQuantity && maxQuantity > 0) {
                          setErrorMessage(`Cannot print more than available stock (${maxQuantity})`);
                          setErrorModalVisible(true);
                          return;
                        }
                        setPrintSettings(prev => ({ ...prev, quantity: value }));
                      }}
                      keyboardType="numeric"
                      className={`flex-1 px-4 py-2 text-center ${
                        isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                      }`}
                      placeholder={`Stock: ${totalStock || 0}`}
                    />
                    <TouchableOpacity
                      onPress={() => setPrintSettings(prev => ({ 
                        ...prev, 
                        quantity: Math.min(totalStock || 1, (prev.quantity || 1) + 1) 
                      }))}
                      className={`px-3 py-2 rounded-r-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                    >
                      <Ionicons name="add" size={20} color={isDarkMode ? '#fff' : '#374151'} />
                    </TouchableOpacity>
                  </View>
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                    Available stock: {totalStock || 0}
                  </Text>
                </View>
              </View>

              {/* Tabs */}
              <View className="flex-row rounded-lg overflow-hidden mb-4">
                <TouchableOpacity
                  onPress={() => {
                    setActiveQrTab('qr');
                    setQrImageLoading(true);
                    setQrImageError(false);
                    setQrImageLoaded(false);
                    if (product?.qr_code) {
                      Image.prefetch(product.qr_code).then(() => {
                        setQrImageLoading(false);
                        setQrImageLoaded(true);
                      }).catch(() => {
                        setQrImageLoading(false);
                        setQrImageError(true);
                      });
                    } else {
                      setQrImageLoading(false);
                      setQrImageError(true);
                    }
                  }}
                  className={`flex-1 py-2 items-center ${
                    activeQrTab === 'qr'
                      ? isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text className={`font-medium ${
                    activeQrTab === 'qr'
                      ? 'text-white'
                      : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    QR Code
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setActiveQrTab('barcode');
                    setBarcodeImageLoading(true);
                    setBarcodeImageError(false);
                    setBarcodeImageLoaded(false);
                    if (product?.barcode) {
                      Image.prefetch(product.barcode).then(() => {
                        setBarcodeImageLoading(false);
                        setBarcodeImageLoaded(true);
                      }).catch(() => {
                        setBarcodeImageLoading(false);
                        setBarcodeImageError(true);
                      });
                    } else {
                      setBarcodeImageLoading(false);
                      setBarcodeImageError(true);
                    }
                  }}
                  className={`flex-1 py-2 items-center ${
                    activeQrTab === 'barcode'
                      ? isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text className={`font-medium ${
                    activeQrTab === 'barcode'
                      ? 'text-white'
                      : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Barcode
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content - FIXED with reliable image display */}
              <View className="items-center py-4">
                {activeQrTab === 'qr' ? (
                  // QR Code Section
                  product.qr_code ? (
                    <View className="items-center w-full">
                      {/* Show loading only when loading and not loaded */}
                      {qrImageLoading && !qrImageLoaded && !qrImageError && (
                        <View className="items-center py-8">
                          <ActivityIndicator size="large" color="#3B82F6" />
                          <Text className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Loading QR Code...
                          </Text>
                        </View>
                      )}
                      
                      {/* Show image when loaded */}
                      {!qrImageLoading && qrImageLoaded && !qrImageError && (
                        <Image
                          source={{ uri: product.qr_code }}
                          className="w-64 h-64"
                          resizeMode="contain"
                        />
                      )}
                      
                      {/* Show error when error */}
                      {qrImageError && (
                        <View className="items-center py-8">
                          <Ionicons name="qr-code-outline" size={64} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
                          <Text className={`mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Failed to load QR Code
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              setQrImageError(false);
                              setQrImageLoading(true);
                              setQrImageLoaded(false);
                              if (product?.qr_code) {
                                Image.prefetch(product.qr_code).then(() => {
                                  setQrImageLoading(false);
                                  setQrImageLoaded(true);
                                }).catch(() => {
                                  setQrImageLoading(false);
                                  setQrImageError(true);
                                });
                              }
                            }}
                            className="mt-3 px-4 py-2 bg-blue-500 rounded-lg"
                          >
                            <Text className="text-white text-sm font-medium">Retry</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View className="items-center py-8">
                      <Ionicons name="qr-code-outline" size={64} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
                      <Text className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        QR Code not available
                      </Text>
                    </View>
                  )
                ) : (
                  // Barcode Section
                  product.barcode ? (
                    <View className="items-center w-full">
                      {barcodeImageLoading && !barcodeImageLoaded && !barcodeImageError && (
                        <View className="items-center py-8">
                          <ActivityIndicator size="large" color="#3B82F6" />
                          <Text className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Loading Barcode...
                          </Text>
                        </View>
                      )}
                      
                      {!barcodeImageLoading && barcodeImageLoaded && !barcodeImageError && (
                        <Image
                          source={{ uri: product.barcode }}
                          className="w-full h-32"
                          resizeMode="contain"
                        />
                      )}
                      
                      {barcodeImageError && (
                        <View className="items-center py-8">
                          <Ionicons name="barcode-outline" size={64} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
                          <Text className={`mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Failed to load Barcode
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              setBarcodeImageError(false);
                              setBarcodeImageLoading(true);
                              setBarcodeImageLoaded(false);
                              if (product?.barcode) {
                                Image.prefetch(product.barcode).then(() => {
                                  setBarcodeImageLoading(false);
                                  setBarcodeImageLoaded(true);
                                }).catch(() => {
                                  setBarcodeImageLoading(false);
                                  setBarcodeImageError(true);
                                });
                              }
                            }}
                            className="mt-3 px-4 py-2 bg-blue-500 rounded-lg"
                          >
                            <Text className="text-white text-sm font-medium">Retry</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View className="items-center py-8">
                      <Ionicons name="barcode-outline" size={64} color={isDarkMode ? '#4B5563' : '#9CA3AF'} />
                      <Text className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Barcode not available
                      </Text>
                    </View>
                  )
                )}

                {/* Action Buttons */}
                {((activeQrTab === 'qr' && product.qr_code && !qrImageError) || 
                  (activeQrTab === 'barcode' && product.barcode && !barcodeImageError)) && (
                  <>
                    <TouchableOpacity
                      onPress={handlePrintQRBarcode}
                      disabled={isPrinting}
                      className={`mt-4 px-6 py-3 rounded-xl flex-row items-center ${
                        isPrinting ? 'bg-gray-400' : 'bg-blue-500'
                      }`}
                    >
                      {isPrinting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="print-outline" size={20} color="#fff" />
                      )}
                      <Text className="text-white font-semibold ml-2">
                        {isPrinting ? 'Preparing...' : `Print ${activeQrTab === 'qr' ? 'QR Codes' : 'Barcodes'}`}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={async () => {
                        const isQR = activeQrTab === 'qr';
                        const imageUrl = isQR ? product.qr_code : product.barcode;
                        if (imageUrl) {
                          try {
                            const filename = imageUrl.split('/').pop() || `${product.name}_${isQR ? 'qr' : 'barcode'}.svg`;
                            const fileUri = FileSystem.documentDirectory + filename;
                            const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
                            if (downloadResult.status === 200 && await Sharing.isAvailableAsync()) {
                              await Sharing.shareAsync(downloadResult.uri);
                            }
                          } catch (error) {
                            console.error('Download error:', error);
                            setErrorMessage('Failed to download image');
                            setErrorModalVisible(true);
                          }
                        }
                      }}
                      className="mt-3 px-6 py-2 rounded-xl bg-green-500 flex-row items-center"
                    >
                      <Ionicons name="download-outline" size={18} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Download</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#EF4444"
        loading={isDeleting}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        message={successMessage}
        onClose={() => setSuccessModalVisible(false)}
        autoClose={true}
        autoCloseDelay={2500}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={errorModalVisible}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
    </View>
  );
};

export default ProductDetailScreen;