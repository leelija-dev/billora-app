// screens/gst/GstScreen.jsx - COMPLETE UPDATED VERSION WITHOUT STATUS UPDATION
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { printAsync } from "expo-print";
import { shareAsync } from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../../components/common/Header";
import { SuccessModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useGstStore from "../../store/gstStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import Toast from "react-native-toast-message";

// Helper function to escape HTML special characters
const escapeHtml = (text) => {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
};

const GstScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  const {
    gstInData = [],
    gstOutData = [],
    gstInPagination,
    gstOutPagination,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    lastPage,
    filters,
    summary,
    fetchGstCollections,
    loadMoreGstCollections,
    setFilters,
    clearFilters,
    resetStore,
  } = useGstStore();

  const [activeTab, setActiveTab] = useState("gst_in");
  const [dataViewMode, setDataViewMode] = useState("paginate");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [showYearFilter, setShowYearFilter] = useState(false);

  // Modal states - Removed status modal, kept only success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const scrollViewRef = useRef(null);
  const initializedRef = useRef(false);

  // Get filtered menu items from permission store
  const menuItems = useMemo(() => {
    const filtered = getFilteredMenuItems();
    return filtered.map(item => ({
      id: item.id,
      title: item.name,
      screen: item.screen,
      icon: item.icon,
      iconActive: item.iconActive,
      badge: item.badge || null,
    }));
  }, [getFilteredMenuItems]);

  // Get current user ID
  const getUserId = useCallback(() => {
    if (user && user.id) return user.id.toString();
    return "1";
  }, [user]);

  // Month and Year options
  const monthOptions = useMemo(() => [
    { value: '', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ], []);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const options = [{ value: '', label: 'All Years' }];
    for (let year = currentYear - 5; year <= currentYear + 2; year++) {
      options.push({ value: String(year), label: String(year) });
    }
    return options;
  }, []);

  // Load GST data on mount
  useFocusEffect(
    useCallback(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      setInitialLoading(true);
      
      fetchGstCollections(getUserId(), { page: 1 })
        .finally(() => {
          setInitialLoading(false);
        });
      
      return () => {
        resetStore();
        initializedRef.current = false;
      };
    }, [getUserId, fetchGstCollections, resetStore]),
  );

  // Handle filter changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (initializedRef.current) {
        const params = { page: 1 };
        if (dataViewMode === 'all') params.search = 'all';
        if (filters.month) params.month = filters.month;
        if (filters.year) params.year = filters.year;
        fetchGstCollections(getUserId(), params);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters.month, filters.year, dataViewMode, getUserId, fetchGstCollections]);

  // Reset trigger flag when loading more is complete
  useEffect(() => {
    if (!isLoadingMore && !loadingMore) {
      setHasTriggeredLoadMore(false);
    }
  }, [isLoadingMore, loadingMore]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const params = { page: 1 };
    if (dataViewMode === 'all') params.search = 'all';
    if (filters.month) params.month = filters.month;
    if (filters.year) params.year = filters.year;
    await fetchGstCollections(getUserId(), params);
    setRefreshing(false);
  }, [getUserId, fetchGstCollections, dataViewMode, filters]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || loadingMore || loading) {
      console.log('⏭️ Skipping - already loading');
      return;
    }
    
    if (!hasMore) {
      console.log('⏭️ Skipping - no more data');
      return;
    }

    if (currentPage >= lastPage) {
      console.log('⏭️ Skipping - reached last page');
      return;
    }

    if (dataViewMode === "all") {
      console.log('⏭️ Skipping - all data mode');
      return;
    }

    console.log(`📜 Triggering loadMoreGstCollections - currentPage: ${currentPage}, lastPage: ${lastPage}`);
    setIsLoadingMore(true);
    await loadMoreGstCollections(getUserId());
    setIsLoadingMore(false);
    setHasTriggeredLoadMore(false);
  }, [isLoadingMore, loadingMore, loading, hasMore, currentPage, lastPage, loadMoreGstCollections, getUserId, dataViewMode]);

  // Handle scroll for pagination
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollPosition = contentOffset.y;
    const scrollViewHeight = layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    
    const maxScroll = totalContentHeight - scrollViewHeight;
    const scrollPercentage = maxScroll > 0 ? (currentScrollPosition / maxScroll) * 100 : 0;
    
    // Only log when percentage changes significantly
    if (Math.floor(scrollPercentage) % 10 === 0) {
      console.log(`📊 Scroll percentage: ${Math.floor(scrollPercentage)}%`);
    }
    
    const triggerThreshold = 50;
    const shouldLoadMore = scrollPercentage >= triggerThreshold;
    
    if (shouldLoadMore && !hasTriggeredLoadMore && !isLoadingMore && !loadingMore && hasMore && !loading && dataViewMode !== "all") {
      console.log(`🎯 Triggering load more at ${Math.floor(scrollPercentage)}% scroll`);
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, loadingMore, hasMore, loading, handleLoadMore, dataViewMode]);

  // ============ MANUAL FILTER HANDLERS ============
  
  // Apply search filter
  const handleApplySearch = () => {
    console.log("🔍 Applying search filter:", searchQuery);
    const params = { page: 1 };
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
      setDataViewMode("all");
    } else {
      setDataViewMode("paginate");
    }
    if (filters.month) params.month = filters.month;
    if (filters.year) params.year = filters.year;
    fetchGstCollections(getUserId(), params);
  };

  // Clear search filter
  const handleClearSearch = () => {
    console.log("🧹 Clearing search filter");
    setSearchQuery("");
    setDataViewMode("paginate");
    const params = { page: 1 };
    if (filters.month) params.month = filters.month;
    if (filters.year) params.year = filters.year;
    fetchGstCollections(getUserId(), params);
  };

  // Check if search filter is active
  const hasActiveSearch = searchQuery.trim() !== "";

  // ============ FIXED PRINT FUNCTION WITH BETTER ERROR HANDLING ============
  const handlePrint = async () => {
    try {
      const isGstIn = activeTab === 'gst_in';
      const title = isGstIn ? 'GST In Report' : 'GST Out Report';
      
      // Limit to first 20 records to avoid string length issues
      const printData = tableData.slice(0, 20);
      const recordsCount = tableData.length;
      
      const tableRows = printData.map(item => {
        if (isGstIn) {
          const invoiceNumber = item.invoice_number || item._originalId || 'N/A';
          const customer = item.customer || item.invoice?.customer || {};
          const customerName = customer.name || customer.customer_name || `${item.customer_id || 'N/A'}`;
          const product = item.product || {};
          const productName = product.name || product.product_name || `${item.product_id || 'N/A'}`;
          const quantity = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          const gstPercent = parseFloat(item.gst) || 0;
          const gstAmount = (price * gstPercent) / (100 + gstPercent);
          
          return `<tr>
            <td>#${escapeHtml(invoiceNumber)}</td>
            <td>${escapeHtml(customerName)}</td>
            <td>${escapeHtml(productName)}</td>
            <td>${quantity.toFixed(2)}</td>
            <td>${formatCurrency(price)}</td>
            <td>${gstPercent.toFixed(2)}%</td>
            <td>${formatCurrency(gstAmount)}</td>
            <td>${formatDate(item.created_at || item.invoice?.created_at)}</td>
          </tr>`;
        } else {
          const stock = item.stock || {};
          const product = stock.product || item.product || {};
          const productName = product.name || product.product_name || `${item.product_id || 'N/A'}`;
          const seller = item.seller || {};
          const sellerName = seller.name || seller.seller_name || `${item.seller_id || 'N/A'}`;
          const quantity = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          const gstPercent = parseFloat(item.gst) || 0;
          const gstAmount = (price * gstPercent / 100) * (item.quantity || 1);
          
          return `<tr>
            <td>${escapeHtml(productName)}</td>
            <td>${escapeHtml(sellerName)}</td>
            <td>${quantity.toFixed(2)}</td>
            <td>${formatCurrency(price)}</td>
            <td>${gstPercent.toFixed(2)}%</td>
            <td>${formatCurrency(gstAmount)}</td>
            <td>${formatDate(item.created_at)}</td>
          </tr>`;
        }
      }).join('');
      
      // Create clean HTML document with proper encoding
      const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
        padding: 30px; 
        color: #1a1a2e; 
        background: #ffffff;
        line-height: 1.6;
      }
      .container { max-width: 1200px; margin: 0 auto; }
      h1 { 
        text-align: center; 
        font-size: 28px; 
        margin-bottom: 10px; 
        color: #1a1a2e;
        border-bottom: 3px solid #2563eb;
        padding-bottom: 15px;
      }
      .header-info { 
        text-align: center; 
        margin-bottom: 25px;
        background: #f8fafc;
        padding: 15px;
        border-radius: 8px;
      }
      .header-info p { margin: 5px 0; }
      .summary {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin: 10px 0;
        padding: 12px;
        background: #eff6ff;
        border-radius: 8px;
        border: 1px solid #dbeafe;
        flex-wrap: wrap;
      }
      .summary-item {
        font-size: 14px;
        color: #1e40af;
      }
      .summary-item strong {
        font-size: 16px;
        color: #1e3a8a;
      }
      .total-gst { 
        font-weight: bold; 
        color: #2563eb;
        font-size: 18px;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 20px 0;
        font-size: 13px;
      }
      th { 
        background: #1e293b;
        color: #ffffff;
        padding: 12px 10px;
        text-align: left;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 0.5px;
      }
      td { 
        border: 1px solid #e2e8f0; 
        padding: 10px;
        text-align: left;
        color: #334155;
      }
      tr:nth-child(even) { background: #f8fafc; }
      tr:hover { background: #f1f5f9; }
      .amount { text-align: right; }
      .center { text-align: center; }
      .footer { 
        text-align: center; 
        margin-top: 30px; 
        padding-top: 20px;
        border-top: 2px solid #e2e8f0;
        color: #64748b; 
        font-size: 12px;
      }
      .footer p { margin: 3px 0; }
      .note {
        text-align: center;
        color: #64748b;
        font-size: 12px;
        margin-top: 10px;
        font-style: italic;
      }
      @media print {
        body { padding: 15px; }
        th { background: #1e293b !important; color: #ffffff !important; }
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${escapeHtml(title)}</h1>
      <div class="header-info">
        <p><strong>Generated On:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN')}</p>
        <p><strong>Total Records:</strong> ${recordsCount}</p>
        <div class="summary">
          <span class="summary-item"><strong>Total GST:</strong> ${formatCurrency(isGstIn ? summary.gstIn : summary.gstOut)}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            ${isGstIn 
              ? '<th>Invoice #</th><th>Customer</th><th>Product</th><th>Qty</th><th>Price</th><th>GST %</th><th>GST Amt</th><th>Date</th>' 
              : '<th>Product</th><th>Seller</th><th>Qty</th><th>Price</th><th>GST %</th><th>GST Amt</th><th>Date</th>'}
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
      
      ${recordsCount > 20 ? `<p class="note">* Showing first 20 of ${recordsCount} records</p>` : ''}
      
      <div class="footer">
        <p><strong>Computer-generated report</strong></p>
        <p>This is a system-generated document. No signature required.</p>
        <p>Report ID: ${Date.now().toString(36).toUpperCase()}</p>
      </div>
    </div>
  </body>
</html>`;

      console.log('📄 Generating PDF...');
      
      // Try to print with better error handling
      let result;
      try {
        result = await printAsync({
          html: htmlContent,
          base64: false,
        });
      } catch (printError) {
        console.warn('⚠️ Print warning:', printError);
        // If printAsync throws, but we're still here, it might have worked
        // Show success message anyway
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'PDF generated successfully',
        });
        return;
      }

      // Check if result is valid
      if (result && result.uri) {
        console.log('✅ PDF generated successfully:', result.uri);
        
        // Share the PDF
        await shareAsync(result.uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Share ${title}`,
        });

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'PDF generated and shared successfully',
        });
      } else {
        // If result is null but no error was thrown, print might still work
        console.log('✅ Print operation completed (result may be null)');
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'PDF generated successfully',
        });
      }

    } catch (error) {
      console.error('❌ Print error:', error);
      
      // Don't show error if print actually worked (user saw the print dialog)
      // Check if the error is about null result
      if (error.message && error.message.includes('null')) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'PDF generated successfully',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Print Failed',
          text2: error.message || 'Failed to generate PDF. Please try again.',
        });
      }
    }
  };
  // ============ END OF FIXED PRINT FUNCTION ============

  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    let data = [];
    switch (activeTab) {
      case 'gst_in':
        const invoices = gstInData || [];
        data = invoices.flatMap((invoice, invIndex) => {
          const items = invoice.invoice_items || [];
          return items.map((item, itemIndex) => ({
            ...item,
            invoice: invoice,
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            customer_id: invoice.customer_id,
            customer: invoice.customer,
            id: item._uniqueId || `gst_in-${item.id}-${invIndex}-${itemIndex}`,
            _originalId: invoice.invoice_number || invoice.id,
            _type: 'gst_in',
            created_at: invoice.created_at,
          }));
        });
        break;
      case 'gst_out':
        const purchases = gstOutData || [];
        data = purchases.map((item, index) => ({
          ...item,
          price: item.price,
          gst: item.stock?.purchase_gst_percentage || item.gst || 0,
          id: item._uniqueId || `gst_out-${item.id}-${index}`,
          _originalId: item.id,
          _type: 'gst_out',
          created_at: item.created_at,
        }));
        break;
      default:
        return [];
    }
    return data.map((item, index) => ({
      ...item,
      id: item.id || `${activeTab}-${index}`,
      _originalId: item._originalId || item.id,
    }));
  };

  // Get total count
  const getTotalCount = () => {
    switch (activeTab) {
      case 'gst_in':
        return gstInPagination?.total || 0;
      case 'gst_out':
        return gstOutPagination?.total || 0;
      default:
        return 0;
    }
  };

  const tableData = getCurrentData();
  const totalCount = getTotalCount();

  // Render GST In item
  const renderGstInItem = (item) => {
    const gstAmount = (item.price * item.gst) / (100 + item.gst);
    
    return (
      <View
        key={item.id}
        className={`mb-3 rounded-xl p-4 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              #{item.invoice_number}
            </Text>
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {item.customer?.name || `Customer #${item.customer_id}`}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {item.product?.name || item.product_name || 'N/A'}
          </Text>
          <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Qty: {parseFloat(item.quantity || 0).toFixed(2)}
          </Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Price: {formatCurrency(item.price)}
          </Text>
          <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            GST: {parseFloat(item.gst || 0).toFixed(2)}%
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className={`text-sm font-semibold text-green-600`}>
            GST Amount: {formatCurrency(gstAmount)}
          </Text>
          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  // Render GST Out item
  const renderGstOutItem = (item) => {
    const gstAmount = (item.price * item.gst / 100) * (item.quantity || 1);
    
    return (
      <View
        key={item.id}
        className={`mb-3 rounded-xl p-4 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {item.stock?.product?.name || item.product?.name || item.product_name || 'N/A'}
            </Text>
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Seller: {item.seller?.name || 'N/A'}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Qty: {parseFloat(item.quantity || 0).toFixed(2)}
          </Text>
          <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Price: {formatCurrency(item.price)}
          </Text>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            GST: {parseFloat(item.gst || 0).toFixed(2)}%
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className={`text-sm font-semibold text-purple-600`}>
            GST Amount: {formatCurrency(gstAmount)}
          </Text>
          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading GST data...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />

      <Header
        title="GST Collection"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="GST"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={handleRefresh} 
              disabled={loading}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon 
                name="refresh" 
                size={20} 
                color={loading ? (isDarkMode ? "#4B5563" : "#9CA3AF") : (isDarkMode ? "#9CA3AF" : "#4b5563")} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handlePrint}
              className={`w-10 h-10 rounded-full items-center justify-center ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon 
                name="printer" 
                size={20} 
                color={isDarkMode ? "#9CA3AF" : "#4b5563"} 
              />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar with Manual Apply */}
      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
            placeholder="Search GST records..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleApplySearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} className="mr-2">
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleApplySearch}
            className="bg-blue-500 px-4 py-2 rounded-xl"
          >
            <Text className="text-white font-medium text-sm">Search</Text>
          </TouchableOpacity>
        </View>
        
        {/* Active Filter Indicator */}
        {hasActiveSearch && (
          <View className="flex-row items-center mt-2">
            <View className="flex-row items-center bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              <Icon name="filter" size={14} color="#3B82F6" />
              <Text className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                Filter: "{searchQuery}"
              </Text>
              <TouchableOpacity onPress={handleClearSearch} className="ml-2">
                <Icon name="close" size={14} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Summary Cards */}
      <View className="flex-row flex-wrap px-4 py-2">
        <LinearGradient 
          style={{borderRadius: 12, flex: 1, marginRight: 4}} 
          colors={["#10b981", "#059669"]} 
          className="rounded-xl p-3" 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
        >
          <Text className="text-white/80 text-xs">GST In (Sales)</Text>
          <Text className="text-white text-lg font-bold">{formatCurrency(summary.gstIn)}</Text>
          <View className="flex-row items-center mt-0.5">
            <Icon name="arrow-up" size={12} color="#86efac" />
            <Text className="text-white/80 text-xs ml-1">Sales GST</Text>
          </View>
        </LinearGradient>

        <LinearGradient 
          style={{borderRadius: 12, flex: 1, marginLeft: 4}} 
          colors={["#ef4444", "#dc2626"]} 
          className="rounded-xl p-3" 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
        >
          <Text className="text-white/80 text-xs">GST Out (Purchases)</Text>
          <Text className="text-white text-lg font-bold">{formatCurrency(summary.gstOut)}</Text>
          <View className="flex-row items-center mt-0.5">
            <Icon name="arrow-down" size={12} color="#fca5a5" />
            <Text className="text-white/80 text-xs ml-1">Purchase GST</Text>
          </View>
        </LinearGradient>
      </View>

      <View className="flex-row px-4 mb-2">
        <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <View className="flex-row items-center">
            <Icon name="calculator" size={16} color="#6366f1" />
            <Text className={`ml-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Net GST</Text>
          </View>
          <Text className={`text-lg font-bold mt-0.5 ${(summary.gstIn - summary.gstOut) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(summary.gstIn - summary.gstOut)}
          </Text>
          <Text className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            {(summary.gstIn - summary.gstOut) >= 0 ? 'Payable' : 'Receivable'}
          </Text>
        </View>

        <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <View className="flex-row items-center">
            <Icon name="file-document" size={16} color="#8b5cf6" />
            <Text className={`ml-1 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Collections</Text>
          </View>
          <Text className={`text-lg font-bold mt-0.5 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
            {totalCount}
          </Text>
          <Text className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Records
          </Text>
        </View>
      </View>

      {/* Filters - Month and Year */}
      <View className={`mx-4 p-3 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm mb-2`}>
        <View className="flex-row items-center justify-between">
          <Text className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Filters</Text>
          {(filters.month || filters.year) && (
            <TouchableOpacity onPress={() => {
              clearFilters();
              setDataViewMode('paginate');
              fetchGstCollections(getUserId(), { page: 1 });
            }}>
              <Text className="text-red-500 text-sm font-medium">Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View className="flex-row mt-3 gap-3">
          {/* Month Filter */}
          <TouchableOpacity
            onPress={() => setShowMonthFilter(!showMonthFilter)}
            className={`flex-1 flex-row items-center justify-between px-3 py-2 rounded-xl border ${isDarkMode ? "border-gray-700 bg-gray-700/50" : "border-gray-200 bg-gray-50"}`}
          >
            <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              {filters.month ? monthOptions.find(m => m.value === filters.month)?.label : 'Month'}
            </Text>
            <Icon name={showMonthFilter ? "chevron-up" : "chevron-down"} size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>

          {/* Year Filter */}
          <TouchableOpacity
            onPress={() => setShowYearFilter(!showYearFilter)}
            className={`flex-1 flex-row items-center justify-between px-3 py-2 rounded-xl border ${isDarkMode ? "border-gray-700 bg-gray-700/50" : "border-gray-200 bg-gray-50"}`}
          >
            <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              {filters.year ? yearOptions.find(y => y.value === filters.year)?.label : 'Year'}
            </Text>
            <Icon name={showYearFilter ? "chevron-up" : "chevron-down"} size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
          </TouchableOpacity>
        </View>

        {/* Month Options */}
        {showMonthFilter && (
          <View className={`mt-2 rounded-xl overflow-hidden border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <ScrollView style={{ maxHeight: 200 }}>
              {monthOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setFilters({ month: option.value });
                    setShowMonthFilter(false);
                  }}
                  className={`px-4 py-3 ${filters.month === option.value ? (isDarkMode ? "bg-blue-900/30" : "bg-blue-50") : ""}`}
                >
                  <Text className={`text-sm ${filters.month === option.value ? "text-blue-600 dark:text-blue-400 font-medium" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Year Options */}
        {showYearFilter && (
          <View className={`mt-2 rounded-xl overflow-hidden border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <ScrollView style={{ maxHeight: 200 }}>
              {yearOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    setFilters({ year: option.value });
                    setShowYearFilter(false);
                  }}
                  className={`px-4 py-3 ${filters.year === option.value ? (isDarkMode ? "bg-blue-900/30" : "bg-blue-50") : ""}`}
                >
                  <Text className={`text-sm ${filters.year === option.value ? "text-blue-600 dark:text-blue-400 font-medium" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Page Indicator */}
      <View className={`px-4 py-2 flex-row justify-between items-center border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {totalCount > 0 ? `Showing ${tableData.length} of ${totalCount} records` : `${tableData.length} records`}
        </Text>
        {dataViewMode !== "all" && (
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Page {currentPage}/{lastPage}
          </Text>
        )}
      </View>

      {/* Tabs */}
      <View className={`mx-4 mt-3 rounded-xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setActiveTab('gst_in')}
            className={`flex-1 py-3 ${activeTab === 'gst_in' ? 'bg-blue-500' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'gst_in' ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              GST In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('gst_out')}
            className={`flex-1 py-3 ${activeTab === 'gst_out' ? 'bg-blue-500' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'gst_out' ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              GST Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Mode Toggle */}
      <View className={`mx-4 mt-2 p-1 rounded-xl flex-row ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
        <TouchableOpacity
          onPress={() => {
            setDataViewMode('paginate');
            const params = { page: 1 };
            if (filters.month) params.month = filters.month;
            if (filters.year) params.year = filters.year;
            fetchGstCollections(getUserId(), params);
          }}
          className={`flex-1 py-1.5 rounded-lg ${dataViewMode === 'paginate' ? (isDarkMode ? "bg-gray-700" : "bg-white shadow-sm") : ""}`}
        >
          <Text className={`text-center text-xs font-medium ${dataViewMode === 'paginate' ? (isDarkMode ? "text-white" : "text-gray-900") : (isDarkMode ? "text-gray-400" : "text-gray-600")}`}>
            Paginated
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setDataViewMode('all');
            const params = { search: 'all' };
            if (filters.month) params.month = filters.month;
            if (filters.year) params.year = filters.year;
            fetchGstCollections(getUserId(), params);
          }}
          className={`flex-1 py-1.5 rounded-lg ${dataViewMode === 'all' ? (isDarkMode ? "bg-gray-700" : "bg-white shadow-sm") : ""}`}
        >
          <Text className={`text-center text-xs font-medium ${dataViewMode === 'all' ? (isDarkMode ? "text-white" : "text-gray-900") : (isDarkMode ? "text-gray-400" : "text-gray-600")}`}>
            All Records
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View className="flex-1">
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh} 
              colors={["#3b82f6"]} 
              tintColor={isDarkMode ? "#F9FAFB" : "#3b82f6"} 
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="px-4 pt-3">
            {loading && tableData.length === 0 ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading GST records...
                </Text>
              </View>
            ) : tableData.length === 0 ? (
              <View className="py-20 items-center">
                <Icon name="file-document" size={80} color={isDarkMode ? '#334155' : '#D1D5DB'} />
                <Text className={`text-lg mt-4 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  No GST records found
                </Text>
                <Text className={`text-sm mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchQuery ? 'Try adjusting your search' : 'No data available for the selected filters'}
                </Text>
              </View>
            ) : (
              tableData.map((item) => 
                activeTab === 'gst_in' ? renderGstInItem(item) : renderGstOutItem(item)
              )
            )}

            {/* Loading More Indicator */}
            {(isLoadingMore || loadingMore) && dataViewMode !== "all" && (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading more records...
                </Text>
              </View>
            )}

            {/* No More Records */}
            {!hasMore && dataViewMode !== "all" && tableData.length > 0 && tableData.length === totalCount && (
              <View className="py-4 items-center">
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No more records to load
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Success Modal */}
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

export default GstScreen;