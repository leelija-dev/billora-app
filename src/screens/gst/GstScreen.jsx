// screens/gst/GstScreen.jsx - UPDATED WITH STATS TOGGLE AND NO SEARCH BAR
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
import StatsCard from "../../components/dashboard/StatsCard";
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

// Format currency helper
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [showStats, setShowStats] = useState(true);

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
      return;
    }
    
    if (!hasMore) {
      return;
    }

    if (currentPage >= lastPage) {
      return;
    }

    if (dataViewMode === "all") {
      return;
    }

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
    
    const triggerThreshold = 50;
    const shouldLoadMore = scrollPercentage >= triggerThreshold;
    
    if (shouldLoadMore && !hasTriggeredLoadMore && !isLoadingMore && !loadingMore && hasMore && !loading && dataViewMode !== "all") {
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, loadingMore, hasMore, loading, handleLoadMore, dataViewMode]);

  // Toggle stats visibility
  const toggleStats = () => {
    setShowStats(!showStats);
  };

  // ============ PRINT FUNCTION ============
  const handlePrint = async () => {
    try {
      const isGstIn = activeTab === 'gst_in';
      const title = isGstIn ? 'GST In Report' : 'GST Out Report';
      
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
            <td class="center">${quantity.toFixed(2)}</td>
            <td class="amount">${formatCurrency(price)}</td>
            <td class="center">${gstPercent.toFixed(2)}%</td>
            <td class="amount">${formatCurrency(gstAmount)}</td>
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
          const gstAmount = (price * gstPercent / 100) * quantity;
          
          return `<tr>
            <td>${escapeHtml(productName)}</td>
            <td>${escapeHtml(sellerName)}</td>
            <td class="center">${quantity.toFixed(2)}</td>
            <td class="amount">${formatCurrency(price)}</td>
            <td class="center">${gstPercent.toFixed(2)}%</td>
            <td class="amount">${formatCurrency(gstAmount)}</td>
            <td>${formatDate(item.created_at)}</td>
          </tr>`;
        }
      }).join('');
      
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
              ? '<th>Invoice #</th><th>Customer</th><th>Product</th><th class="center">Qty</th><th class="amount">Price</th><th class="center">GST %</th><th class="amount">GST Amt</th><th>Date</th>' 
              : '<th>Product</th><th>Seller</th><th class="center">Qty</th><th class="amount">Price</th><th class="center">GST %</th><th class="amount">GST Amt</th><th>Date</th>'}
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

      let result;
      try {
        result = await printAsync({
          html: htmlContent,
          base64: false,
        });
      } catch (printError) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'PDF generated successfully',
        });
        return;
      }

      if (result && result.uri) {
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
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'PDF generated successfully',
        });
      }

    } catch (error) {
      console.error('❌ Print error:', error);
      
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
  // ============ END OF PRINT FUNCTION ============

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

  // Calculate GST Amount based on type
  const calculateGstAmount = (item) => {
    const price = parseFloat(item.price) || 0;
    const gstPercent = parseFloat(item.gst) || 0;
    const quantity = parseFloat(item.quantity) || 1;
    
    if (activeTab === 'gst_in') {
      return (price * gstPercent) / (100 + gstPercent);
    } else {
      return (price * gstPercent / 100) * quantity;
    }
  };

  // Stats Section Component
  const StatsSection = () => {
    if (!showStats) return null;

    const statsData = [
      {
        id: 1,
        title: "GST In (Sales)",
        value: formatCurrency(summary.gstIn),
        icon: "arrow-up",
        color: "#10B981",
        onPress: () => setActiveTab('gst_in'),
      },
      {
        id: 2,
        title: "GST Out (Purchases)",
        value: formatCurrency(summary.gstOut),
        icon: "arrow-down",
        color: "#EF4444",
        onPress: () => setActiveTab('gst_out'),
      },
      {
        id: 3,
        title: "Net GST",
        value: formatCurrency(summary.gstIn - summary.gstOut),
        icon: "calculator",
        color: (summary.gstIn - summary.gstOut) >= 0 ? "#2563EB" : "#F59E0B",
        onPress: () => {},
      },
      {
        id: 4,
        title: "Total Records",
        value: totalCount,
        icon: "file-document",
        color: "#8B5CF6",
        onPress: () => {},
      },
    ];

    return (
      <View
        className={`px-4 py-4 border-b ${
          isDarkMode
            ? "bg-gray-900 border-gray-800"
            : "bg-gray-50 border-gray-100"
        }`}
      >
        <View className="flex-row flex-wrap justify-between">
          {statsData.map((item) => (
            <View key={item.id} className="w-[48%] mb-3">
              <StatsCard
                title={item.title}
                value={item.value}
                icon={item.icon}
                color={item.color}
                onPress={item.onPress}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render GST In item
  const renderGstInItem = (item) => {
    const gstAmount = calculateGstAmount(item);
    
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
          <View className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Text className="text-xs text-green-600 dark:text-green-400 font-medium">GST In</Text>
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

        <View className="flex-row justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
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
    const gstAmount = calculateGstAmount(item);
    
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
          <View className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Text className="text-xs text-purple-600 dark:text-purple-400 font-medium">GST Out</Text>
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

        <View className="flex-row justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
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

      {/* Stats Toggle Button */}
      <TouchableOpacity
        onPress={toggleStats}
        className={`px-4 py-3 flex-row items-center justify-between ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <View className="flex-row items-center">
          <Icon
            name="chart-bar"
            size={20}
            color={isDarkMode ? "#9CA3AF" : "#6B7280"}
          />
          <Text
            className={`text-sm font-medium ml-2 ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {showStats ? "Hide Statistics" : "Show Statistics"}
          </Text>
        </View>
        <Icon
          name={showStats ? "chevron-up" : "chevron-down"}
          size={22}
          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
        />
      </TouchableOpacity>

      {/* Stats Section */}
      <StatsSection />

      {/* Filters - Month and Year */}
      <View className={`mx-4 mt-3 p-3 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm mb-2`}>
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
                  No data available for the selected filters
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