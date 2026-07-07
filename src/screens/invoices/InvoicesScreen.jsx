// screens/invoices/InvoicesScreen.js - COMPLETE UPDATED VERSION
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
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
import { ConfirmationModal, SuccessModal } from "../../components/common/CustomModal";
import { useAuthStore } from "../../store/authStore";
import useInvoiceStore from "../../store/invoiceStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import Toast from "react-native-toast-message";

const InvoicesScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  const {
    invoices = [],
    totalInvoices,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    lastPage,
    filters,
    fetchInvoices,
    loadMoreInvoices,
    deleteInvoice,
    cancelInvoice,
    payInvoiceDue,
    setFilters,
    resetFilters,
  } = useInvoiceStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);
  
  // Modal states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [duePayAmount, setDuePayAmount] = useState("");
  const [duePayMethod, setDuePayMethod] = useState("Cash");
  
  // Cancel modal state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState(null);
  const [cancellingInvoice, setCancellingInvoice] = useState(false);

  const scrollViewRef = useRef(null);

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

  // Load invoices on mount
  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      fetchInvoices(1, filters, false).finally(() => {
        setInitialLoading(false);
      });
      return () => {};
    }, [fetchInvoices, filters]),
  );

  // Reset trigger flag when loading more is complete
  useEffect(() => {
    if (!isLoadingMore && !loadingMore) {
      setHasTriggeredLoadMore(false);
    }
  }, [isLoadingMore, loadingMore]);

  // ❌ REMOVED: Auto-search useEffect - now search is applied manually

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInvoices(1, filters, false);
    setRefreshing(false);
  }, [fetchInvoices, filters]);

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

    console.log(`📜 Triggering loadMoreInvoices - currentPage: ${currentPage}, lastPage: ${lastPage}`);
    setIsLoadingMore(true);
    await loadMoreInvoices();
    setIsLoadingMore(false);
    setHasTriggeredLoadMore(false);
  }, [isLoadingMore, loadingMore, loading, hasMore, currentPage, lastPage, loadMoreInvoices]);

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
    
    if (shouldLoadMore && !hasTriggeredLoadMore && !isLoadingMore && !loadingMore && hasMore && !loading) {
      console.log(`🎯 Triggering load more at ${Math.floor(scrollPercentage)}% scroll`);
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, loadingMore, hasMore, loading, handleLoadMore]);

  // ============ MANUAL FILTER HANDLERS ============
  
  // Apply search filter - only when user clicks search or presses Enter
  const handleApplySearch = () => {
    console.log("🔍 Applying search filter:", searchQuery);
    setFilters({ search: searchQuery });
    // Reset to page 1 when applying filter
    fetchInvoices(1, { ...filters, search: searchQuery }, false);
  };

  // Clear search filter
  const handleClearSearch = () => {
    console.log("🧹 Clearing search filter");
    setSearchQuery("");
    setFilters({ search: "" });
    // Reset to page 1 when clearing filter
    fetchInvoices(1, { ...filters, search: "" }, false);
  };

  // Check if search filter is active
  const hasActiveSearch = filters.search !== "";

  const handleAddInvoice = () => {
    navigation.navigate("InvoiceForm");
  };

  const handleViewInvoice = (invoice) => {
    navigation.navigate("InvoiceDetail", { invoiceId: invoice.id });
  };

  const handleEditInvoice = (invoice) => {
    navigation.navigate("InvoiceForm", { invoiceId: invoice.id, isEdit: true });
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteInvoice(invoiceToDelete.id);
      if (result.success) {
        setSuccessMessage("Invoice deleted successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        await fetchInvoices(1, filters, false);
      } else {
        setSuccessMessage(result.error || "Failed to delete invoice");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setSuccessMessage(error.message || "Failed to delete invoice");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setInvoiceToDelete(null);
    }
  };

  const handleCancelClick = (invoice) => {
    if (!invoice?.id || invoice.status === "cancelled") return;
    setInvoiceToCancel(invoice);
    setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
    if (!invoiceToCancel?.id) return;
    setCancellingInvoice(true);
    try {
      const result = await cancelInvoice(invoiceToCancel.id);
      if (result.success) {
        setSuccessMessage("Invoice cancelled successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        await fetchInvoices(1, filters, false);
      } else {
        setSuccessMessage(result.error?.message || "Failed to cancel invoice");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      console.error("Cancel error:", error);
      setSuccessMessage(error.message || "Failed to cancel invoice");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setCancellingInvoice(false);
      setShowCancelConfirm(false);
      setInvoiceToCancel(null);
    }
  };

  const handlePaymentClick = (invoice) => {
    const total = parseFloat(invoice.total_amount || 0);
    const paid = parseFloat(invoice.paid_amount || 0);
    const due = Math.max(0, total - paid);
    
    if (invoice.status === "cancelled" || due <= 0.001) return;
    
    setSelectedPaymentInvoice(invoice);
    setDuePayAmount("");
    setDuePayMethod("Cash");
    setShowPaymentModal(true);
    setIsPaymentProcessing(false);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPaymentInvoice?.id) return;
    
    const total = parseFloat(selectedPaymentInvoice.total_amount || 0);
    const paid = parseFloat(selectedPaymentInvoice.paid_amount || 0);
    const due = Math.max(0, total - paid);
    const amount = parseFloat(duePayAmount);
    
    if (Number.isNaN(amount) || amount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Enter a valid payment amount',
      });
      return;
    }
    
    if (amount > due) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Amount cannot exceed due (₹${due.toFixed(2)})`,
      });
      return;
    }
    
    setIsPaymentProcessing(true);
    try {
      const result = await payInvoiceDue(selectedPaymentInvoice.id, {
        paid_amount: amount,
        payment_method: duePayMethod,
      });
      
      if (result.success) {
        setShowPaymentModal(false);
        setSelectedPaymentInvoice(null);
        setDuePayAmount("");
        setSuccessMessage(`Payment of ₹${amount.toFixed(2)} recorded successfully`);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        await fetchInvoices(1, filters, false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: result.error?.message || 'Payment failed',
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Payment failed',
      });
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleDueAmountChange = (value) => {
    let cleanedValue = value.replace(/[^0-9.]/g, "");
    const decimalCount = (cleanedValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      cleanedValue = cleanedValue.slice(0, cleanedValue.lastIndexOf("."));
    }

    let numValue = cleanedValue === "" ? 0 : parseFloat(cleanedValue);
    if (isNaN(numValue)) numValue = 0;

    const total = parseFloat(selectedPaymentInvoice?.total_amount || 0);
    const paid = parseFloat(selectedPaymentInvoice?.paid_amount || 0);
    const maxAmount = Math.max(0, total - paid);

    if (numValue > maxAmount) {
      numValue = maxAmount;
      cleanedValue = numValue.toString();
    }

    setDuePayAmount(cleanedValue === "" ? "" : cleanedValue);
  };

  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  
  // Calculate stats
  const totalInvoicesCount = totalInvoices || safeInvoices.length;
  const totalAmount = useMemo(() => {
    return safeInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
  }, [safeInvoices]);
  const totalPaidAmount = useMemo(() => {
    return safeInvoices.reduce((sum, inv) => sum + (parseFloat(inv.paid_amount) || 0), 0);
  }, [safeInvoices]);
  const totalDueAmount = useMemo(() => {
    return safeInvoices.reduce((sum, inv) => {
      const total = parseFloat(inv.total_amount) || 0;
      const paid = parseFloat(inv.paid_amount) || 0;
      return sum + Math.max(0, total - paid);
    }, 0);
  }, [safeInvoices]);

  const getStatusConfig = (status) => {
    const configs = {
      paid: { color: "#10b981", icon: "check-circle", label: "Paid" },
      unpaid: { color: "#f59e0b", icon: "clock", label: "Unpaid" },
      overdue: { color: "#ef4444", icon: "alert-circle", label: "Overdue" },
      completed: { color: "#10b981", icon: "check-circle", label: "Completed" },
      cancelled: { color: "#6b7280", icon: "file-document", label: "Cancelled" },
    };
    return configs[status] || configs.unpaid;
  };

  const renderInvoiceItem = (invoice) => {
    const statusConfig = getStatusConfig(invoice.status);
    const total = parseFloat(invoice.total_amount || 0);
    const paid = parseFloat(invoice.paid_amount || 0);
    const due = Math.max(0, total - paid);
    const isCancelled = invoice.status === "cancelled";
    const canPayDue = !isCancelled && due > 0.001;

    return (
      <TouchableOpacity
        key={invoice.id}
        onPress={() => handleViewInvoice(invoice)}
        className={`mb-3 rounded-xl p-4 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className={`font-semibold text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              #{invoice.invoice_number || invoice.id}
            </Text>
            <Text className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {invoice.customer_name || `Customer #${invoice.customer_id}`}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Icon name={statusConfig.icon} size={16} color={statusConfig.color} />
            <Text className={`ml-1 text-xs font-medium`} style={{ color: statusConfig.color }}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Total: ₹{total.toFixed(2)}
            </Text>
            <Text className={`text-xs text-green-600`}>
              Paid: ₹{paid.toFixed(2)}
            </Text>
          </View>
          <Text className={`text-sm font-semibold ${due > 0 ? "text-red-600" : "text-green-600"}`}>
            Due: ₹{due.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            {new Date(invoice.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleEditInvoice(invoice)}
              disabled={isCancelled}
              className={`p-2 rounded-lg ${isCancelled ? "opacity-50" : ""}`}
            >
              <Icon name="pencil" size={18} color={isCancelled ? "#9ca3af" : "#6366f1"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handlePaymentClick(invoice)}
              disabled={!canPayDue}
              className={`p-2 rounded-lg ${!canPayDue ? "opacity-50" : ""}`}
            >
              <Icon name="cash" size={18} color={canPayDue ? "#10b981" : "#9ca3af"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleCancelClick(invoice)}
              disabled={isCancelled}
              className={`p-2 rounded-lg ${isCancelled ? "opacity-50" : ""}`}
            >
              <Icon name="cancel" size={18} color={isCancelled ? "#9ca3af" : "#ef4444"} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteClick(invoice)}
              className="p-2 rounded-lg"
            >
              <Icon name="delete" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading invoices...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} />

      <Header
        title="Invoices"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Invoices"
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
              onPress={handleAddInvoice} 
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30"
            >
              <Icon name="plus" size={24} color="#ffffff" />
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
            placeholder="Search invoices..."
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
                Filter: "{filters.search}"
              </Text>
              <TouchableOpacity onPress={handleClearSearch} className="ml-2">
                <Icon name="close" size={14} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Page Indicator */}
      <View className={`px-4 py-2 flex-row justify-between items-center border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {totalInvoicesCount > 0 ? `Showing ${safeInvoices.length} of ${totalInvoicesCount} invoices` : `${safeInvoices.length} invoices`}
        </Text>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Page {currentPage}/{lastPage}
        </Text>
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
          {/* Stats Cards */}
          <View className="flex-row flex-wrap px-4 py-3">
            <LinearGradient 
              style={{borderRadius: 12}} 
              colors={["#3b82f6", "#2563eb"]} 
              className="rounded-xl p-4 flex-1 mr-2" 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }}
            >
              <Text className="text-white/80 text-xs">Total Invoices</Text>
              <Text className="text-white text-2xl font-bold">{totalInvoicesCount}</Text>
              <View className="flex-row items-center mt-1">
                <Icon name="file-document" size={16} color="#86efac" />
                <Text className="text-white/80 text-xs ml-1">All invoices</Text>
              </View>
            </LinearGradient>

            <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Amount</Text>
              <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹{totalAmount.toLocaleString()}</Text>
              <View className="flex-row items-center mt-1">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Gross total
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row px-4 mb-4">
            <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <View className="flex-row items-center">
                <Icon name="cash" size={20} color="#10b981" />
                <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Paid Amount</Text>
              </View>
              <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹{totalPaidAmount.toLocaleString()}</Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Collected</Text>
            </View>

            <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <View className="flex-row items-center">
                <Icon name="alert-circle" size={20} color="#ef4444" />
                <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Due Amount</Text>
              </View>
              <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹{totalDueAmount.toLocaleString()}</Text>
              <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Pending</Text>
            </View>
          </View>

          {/* Invoice List */}
          <View className="flex-1 px-4 pb-4">
            {loading && safeInvoices.length === 0 ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading invoices...
                </Text>
              </View>
            ) : safeInvoices.length === 0 ? (
              <View className="py-20 items-center">
                <Icon name="file-document" size={80} color={isDarkMode ? '#334155' : '#D1D5DB'} />
                <Text className={`text-lg mt-4 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  No invoices found
                </Text>
                <Text className={`text-sm mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchQuery ? 'Try adjusting your search' : 'Tap the + button to create your first invoice'}
                </Text>
              </View>
            ) : (
              safeInvoices.map(renderInvoiceItem)
            )}

            {/* Loading More Indicator */}
            {(isLoadingMore || loadingMore) && (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading more invoices...
                </Text>
              </View>
            )}

            {/* No More Invoices */}
            {!hasMore && safeInvoices.length > 0 && safeInvoices.length === totalInvoicesCount && (
              <View className="py-4 items-center">
                <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No more invoices to load
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* ============ MODALS ============ */}
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${invoiceToDelete?.invoice_number || invoiceToDelete?.id}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={deleting}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        visible={showCancelConfirm}
        title="Cancel Invoice"
        message={`Are you sure you want to cancel invoice "${invoiceToCancel?.invoice_number || invoiceToCancel?.id}"? This will restore stock and reverse customer due amount.`}
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
        confirmText="Cancel Invoice"
        cancelText="Back"
        confirmButtonColor="#ef4444"
        loading={cancellingInvoice}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className={`w-full max-w-md rounded-2xl p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                Record Payment
              </Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Icon name="close" size={24} color={isDarkMode ? "#9ca3af" : "#6b7280"} />
              </TouchableOpacity>
            </View>

            {selectedPaymentInvoice && (
              <>
                <View className={`mb-4 p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Invoice: #{selectedPaymentInvoice.invoice_number || selectedPaymentInvoice.id}
                  </Text>
                  <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {selectedPaymentInvoice.customer_name}
                  </Text>
                  <View className="flex-row justify-between mt-2">
                    <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Total: ₹{parseFloat(selectedPaymentInvoice.total_amount || 0).toFixed(2)}
                    </Text>
                    <Text className={`text-sm text-red-600`}>
                      Due: ₹{(parseFloat(selectedPaymentInvoice.total_amount || 0) - parseFloat(selectedPaymentInvoice.paid_amount || 0)).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Payment Amount
                  </Text>
                  <View className={`flex-row items-center rounded-lg px-4 h-12 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <Text className={`text-lg ${isDarkMode ? "text-white" : "text-gray-800"}`}>₹</Text>
                    <TextInput
                      className={`flex-1 ml-2 text-lg ${isDarkMode ? "text-white" : "text-gray-800"}`}
                      placeholder="0.00"
                      placeholderTextColor="#9ca3af"
                      value={duePayAmount}
                      onChangeText={handleDueAmountChange}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View className="mb-6">
                  <Text className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Payment Method
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {["Cash", "Card", "UPI", "Bank Transfer", "Cheque"].map((method) => (
                      <TouchableOpacity
                        key={method}
                        onPress={() => setDuePayMethod(method)}
                        className={`px-4 py-2 rounded-lg border ${
                          duePayMethod === method
                            ? "border-blue-500 bg-blue-50"
                            : isDarkMode
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            duePayMethod === method
                              ? "text-blue-600 font-medium"
                              : isDarkMode
                              ? "text-gray-300"
                              : "text-gray-600"
                          }`}
                        >
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handlePaymentSubmit}
                  disabled={isPaymentProcessing || !duePayAmount}
                  className={`w-full py-3 rounded-lg ${
                    isPaymentProcessing || !duePayAmount
                      ? "bg-gray-300"
                      : "bg-blue-500"
                  }`}
                >
                  <Text className="text-white font-semibold text-center">
                    {isPaymentProcessing ? "Processing..." : "Record Payment"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default InvoicesScreen;