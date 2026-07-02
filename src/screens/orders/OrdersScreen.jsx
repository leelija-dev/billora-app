import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useThemeStore } from '../../store/themeStore';
import Header from '../../components/common/Header';
import StatsCard from '../../components/dashboard/StatsCard';
import Toast from 'react-native-toast-message';
import { generateA4InvoiceHTML, generateThermalInvoiceHTML } from '../../utils/invoiceTemplates';

const { width } = Dimensions.get('window');

// Constants
const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', icon: 'clock-outline' },
  { value: 'processing', label: 'Processing', icon: 'cog-outline' },
  { value: 'ready_to_serve', label: 'Ready to Serve', icon: 'food' },
  { value: 'completed', label: 'Completed', icon: 'check-circle-outline' },
  { value: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending', icon: 'clock-outline' },
  { value: 'completed', label: 'Completed', icon: 'check-circle-outline' },
  { value: 'failed', label: 'Failed', icon: 'alert-circle-outline' },
];

const OrdersScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const {
    orders,
    stats,
    loading,
    filters,
    fetchOrders,
    setFilters,
    clearFilters,
    setCurrentUserId,
    setSelectedOrder,
    updateOrderStatus,
    updatePaymentStatus,
  } = useOrderStore();

  // State
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(filters.dateFrom ? new Date(filters.dateFrom) : null);
  const [endDate, setEndDate] = useState(filters.dateTo ? new Date(filters.dateTo) : null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
  const [editOrderStatus, setEditOrderStatus] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showStats, setShowStats] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Set current user ID in store
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      if (user?.id) {
        fetchOrders(1, user.id).finally(() => {
          setInitialLoading(false);
        });
      }
      return () => {};
    }, [user?.id])
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (user?.id) {
        setFilters({ search: searchTerm }, user.id);
      }
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, setFilters, user?.id]);

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchOrders(1, user.id);
    }
    setRefreshing(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    clearFilters();
    if (user?.id) {
      fetchOrders(1, user.id);
    }
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      const dateStr = selectedDate.toISOString().split('T')[0];
      setFilters({ dateFrom: dateStr }, user.id);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      const dateStr = selectedDate.toISOString().split('T')[0];
      setFilters({ dateTo: dateStr }, user.id);
    }
  };

  const handlePrintOrder = (order) => {
    setSelectedOrderForPrint(order);
    setShowPrintModal(true);
  };

  const handleStatusChange = (order) => {
    setSelectedOrderForStatus(order);
    setEditOrderStatus(order.order_status);
    setEditPaymentStatus(order.payment_status);
    setShowStatusModal(true);
  };

  const handleStatusModalSave = async () => {
    if (!selectedOrderForStatus) return;
    setUpdating(true);
    
    try {
      const statusChanged = editOrderStatus !== selectedOrderForStatus.order_status;
      const paymentStatusChanged = editPaymentStatus !== selectedOrderForStatus.payment_status;

      if (statusChanged) {
        await updateOrderStatus(selectedOrderForStatus.id, editOrderStatus);
      }
      if (paymentStatusChanged) {
        await updatePaymentStatus(selectedOrderForStatus.id, editPaymentStatus);
      }
      
      setShowStatusModal(false);
      setSelectedOrderForStatus(null);
      
      if (user?.id) {
        await fetchOrders(1, user.id);
      }
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Order updated successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update status',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintInvoice = async (type) => {
    if (!selectedOrderForPrint) return;

    try {
      const modifiedOrder = {
        ...selectedOrderForPrint,
        id: selectedOrderForPrint.order_id || selectedOrderForPrint.id,
        invoice_number: selectedOrderForPrint.order_id || selectedOrderForPrint.id,
        payment_mode: selectedOrderForPrint.payment_method,
      };

      let html = '';
      if (type === 'a4') {
        html = generateA4InvoiceHTML(modifiedOrder, true);
      } else if (type === 'thermal') {
        html = generateThermalInvoiceHTML(modifiedOrder, true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invalid print type',
        });
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${type === 'a4' ? 'A4 Invoice' : 'Thermal Receipt'}`,
      });
      
      setShowPrintModal(false);
      setSelectedOrderForPrint(null);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Invoice generated successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to generate invoice',
      });
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };

  const toggleStats = () => {
    setShowStats(!showStats);
  };

  // Memoized filtered orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        (order.order_id && order.order_id.toString().toLowerCase().includes(searchLower)) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(searchLower)) ||
        (order.customer_phone && order.customer_phone.toLowerCase().includes(searchLower)) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(searchLower))
      );
    }

    if (filters.status) {
      filtered = filtered.filter(order => order.order_status === filters.status);
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter(order => order.payment_status === filters.paymentStatus);
    }

    return filtered;
  }, [orders, filters]);

  // Helper functions
  const getStatusColor = useCallback((status, isDark) => {
    const colors = {
      pending: isDark ? '#FBBF24' : '#F59E0B',
      processing: isDark ? '#60A5FA' : '#3B82F6',
      ready_to_serve: isDark ? '#A78BFA' : '#8B5CF6',
      completed: isDark ? '#34D399' : '#10B981',
      cancelled: isDark ? '#F87171' : '#EF4444',
      failed: isDark ? '#F87171' : '#EF4444',
    };
    return colors[status] || (isDark ? '#94A3B8' : '#6B7280');
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusLabel = useCallback((status, type) => {
    const statuses = type === 'order' ? ORDER_STATUSES : PAYMENT_STATUSES;
    return statuses.find(s => s.value === status)?.label || status;
  }, []);

  const getStatusIcon = useCallback((status, type) => {
    const statuses = type === 'order' ? ORDER_STATUSES : PAYMENT_STATUSES;
    return statuses.find(s => s.value === status)?.icon || 'clock-outline';
  }, []);

  // Stats Section Component
  const StatsSection = useCallback(() => {
    if (!showStats) return null;

    const statsData = [
      {
        id: 1,
        title: "Total Orders",
        value: stats.total || 0,
        icon: "cart",
        color: "#4F46E5",
        trend: 12,
        onPress: () => console.log("Total Orders clicked"),
      },
      {
        id: 2,
        title: "Revenue",
        value: `₹${(stats.revenue || 0).toLocaleString()}`,
        icon: "currency-inr",
        color: "#10B981",
        trend: 8,
        onPress: () => console.log("Revenue clicked"),
      },
      {
        id: 3,
        title: "Pending",
        value: stats.pending || 0,
        icon: "clock-outline",
        color: "#F59E0B",
        trend: -3,
        onPress: () => console.log("Pending clicked"),
      },
      {
        id: 4,
        title: "Processing",
        value: stats.processing || 0,
        icon: "cog-outline",
        color: "#8B5CF6",
        trend: 5,
        onPress: () => console.log("Processing clicked"),
      },
      {
        id: 5,
        title: "Completed",
        value: stats.completed || 0,
        icon: "check-circle",
        color: "#10B981",
        trend: 10,
        onPress: () => console.log("Completed clicked"),
      },
      {
        id: 6,
        title: "Cancelled",
        value: stats.cancelled || 0,
        icon: "close-circle",
        color: "#EF4444",
        trend: -2,
        onPress: () => console.log("Cancelled clicked"),
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
                trend={item.trend}
                onPress={item.onPress}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }, [stats, showStats, isDarkMode]);

  // Order Card Component with Price Breakdown
  const OrderCard = useCallback(({ order, onView }) => {
    const remainingDue = parseFloat(order.total_amount || 0) - parseFloat(order.paid_amount || 0);
    const orderColor = getStatusColor(order.order_status, isDarkMode);
    const paymentColor = getStatusColor(order.payment_status, isDarkMode);
    
    // Calculate price breakdown
    const subtotal = parseFloat(order.subtotal || order.total_amount || 0);
    const discount = parseFloat(order.discount_amount || order.discount || 0);
    const tax = parseFloat(order.tax_amount || order.tax || 0);
    const total = parseFloat(order.total_amount || 0);
    const paidAmount = parseFloat(order.paid_amount || 0);
    
    return (
      <TouchableOpacity
        onPress={() => onView(order)}
        className={`rounded-2xl p-4 mb-3 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}
        activeOpacity={0.7}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: orderColor }}
              />
              <Text className={`font-mono text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                #{order.order_id}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <TouchableOpacity 
                onPress={() => handleStatusChange(order)} 
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              >
                <Icon name="pencil" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handlePrintOrder(order)} 
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              >
                <Icon name="printer" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
              <View 
                className="px-2 py-1 rounded-full flex-row items-center"
                style={{ backgroundColor: `${orderColor}20` }}
              >
                <Icon name={getStatusIcon(order.order_status, 'order')} size={12} color={orderColor} />
                <Text className="ml-1 text-xs font-medium" style={{ color: orderColor }}>
                  {getStatusLabel(order.order_status, 'order')}
                </Text>
              </View>
            </View>
          </View>

          {/* Customer Info */}
          <View className="flex-row items-center mt-3">
            <View 
              className="w-9 h-9 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }}
            >
              <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {order.customer_name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {order.customer_name}
              </Text>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {order.customer_phone || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Date & Items */}
          <View className={`flex-row items-center justify-between mt-3 pt-3 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <View className="flex-row items-center">
              <Icon name="calendar" size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              <Text className={`text-xs ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatDate(order.created_at)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Icon name="cart" size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} />
              <Text className={`text-xs ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {order.total_items || 0} items
              </Text>
            </View>
          </View>

          {/* Price Breakdown Card */}
          <View 
            className={`mt-3 rounded-xl p-3 ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}
          >
            <View className="flex-row justify-between items-center mb-1">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subtotal</Text>
              <Text className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ₹{subtotal.toFixed(2)}
              </Text>
            </View>
            
            {discount > 0 && (
              <View className="flex-row justify-between items-center mb-1">
                <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Discount</Text>
                <Text className={`text-xs font-medium text-red-500`}>
                  -₹{discount.toFixed(2)}
                </Text>
              </View>
            )}
            
            {tax > 0 && (
              <View className="flex-row justify-between items-center mb-1">
                <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tax</Text>
                <Text className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  +₹{tax.toFixed(2)}
                </Text>
              </View>
            )}
            
            <View className={`flex-row justify-between items-center pt-2 mt-1 border-t ${
              isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Total</Text>
              <Text className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                ₹{total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Payment Summary */}
          <View className="flex-row items-center justify-between mt-3">
            <View>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Paid</Text>
              <Text className="text-sm font-bold text-green-600 dark:text-green-400">
                ₹{paidAmount.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Due</Text>
              <Text className={`text-sm font-bold ${
                remainingDue > 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                ₹{remainingDue.toFixed(2)}
              </Text>
            </View>
            <View 
              className="px-2 py-1 rounded-full flex-row items-center"
              style={{ backgroundColor: `${paymentColor}20` }}
            >
              <Icon name={getStatusIcon(order.payment_status, 'payment')} size={12} color={paymentColor} />
              <Text className="ml-1 text-xs font-medium" style={{ color: paymentColor }}>
                {getStatusLabel(order.payment_status, 'payment')}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [isDarkMode, getStatusColor, getStatusLabel, getStatusIcon, formatDate]);

  // Grid Order Card Component (simplified for grid view)
  const GridOrderCard = useCallback(({ order, onView }) => {
    const remainingDue = parseFloat(order.total_amount || 0) - parseFloat(order.paid_amount || 0);
    const orderColor = getStatusColor(order.order_status, isDarkMode);
    const total = parseFloat(order.total_amount || 0);
    
    return (
      <TouchableOpacity
        onPress={() => onView(order)}
        className={`rounded-2xl p-4 mb-3 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}
        style={{ width: (width - 48) / 2 }}
        activeOpacity={0.7}
      >
        <View className="items-center">
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mb-2"
            style={{ backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }}
          >
            <Text className={`text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {order.customer_name?.charAt(0) || 'U'}
            </Text>
          </View>
          
          <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} text-center`}>
            {order.customer_name}
          </Text>
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center`}>
            #{order.order_id}
          </Text>

          <View 
            className="px-2 py-1 rounded-full flex-row items-center mt-2"
            style={{ backgroundColor: `${orderColor}20` }}
          >
            <Icon name={getStatusIcon(order.order_status, 'order')} size={12} color={orderColor} />
            <Text className="ml-1 text-xs font-medium" style={{ color: orderColor }}>
              {getStatusLabel(order.order_status, 'order')}
            </Text>
          </View>

          <View className="w-full mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <View className="flex-row justify-between">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</Text>
              <Text className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                ₹{total.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Due</Text>
              <Text className={`text-sm font-bold ${
                remainingDue > 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                ₹{remainingDue.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-1 mt-3">
            <TouchableOpacity 
              onPress={() => handleStatusChange(order)} 
              className="p-2 rounded-lg flex-1 items-center"
              style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            >
              <Icon name="pencil" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handlePrintOrder(order)} 
              className="p-2 rounded-lg flex-1 items-center"
              style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            >
              <Icon name="printer" size={16} color={isDarkMode ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [isDarkMode, getStatusColor, getStatusLabel, getStatusIcon]);

  // Loading state
  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}
        />
        <Header title="Orders" showBack={false} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading orders...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}
      />

      <Header
        title="Orders"
        showBack={false}
        rightComponent={
          <View className="flex-row items-center">
            {/* Refresh Button */}
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={loading}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Icon
                name="refresh"
                size={20}
                color={
                  loading
                    ? isDarkMode ? "#4B5563" : "#9CA3AF"
                    : isDarkMode ? "#9CA3AF" : "#4b5563"
                }
              />
            </TouchableOpacity>

            {/* View Mode Toggle */}
            <TouchableOpacity
              onPress={toggleViewMode}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Icon
                name={viewMode === "list" ? "view-grid" : "view-list"}
                size={22}
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

      {/* Search Bar */}
      <View className={`px-4 py-3 border-b ${
        isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
      }`}>
        <View className="flex-row items-center">
          <View
            className={`flex-1 flex-row items-center h-12 rounded-2xl px-4 mr-3 border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <Icon name="magnify" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />

            <TextInput
              className={`flex-1 ml-3 text-[15px] ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
              placeholder="Search orders..."
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={searchTerm}
              onChangeText={setSearchTerm}
              selectionColor="#3B82F6"
            />

            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <Icon
                  name="close-circle"
                  size={18}
                  color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            className={`w-12 h-12 rounded-2xl items-center justify-center ${
              isDarkMode
                ? "bg-gray-800 border border-gray-700"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <Icon
              name="filter-variant"
              size={22}
              color={(filters.status || filters.paymentStatus) ? "#3B82F6" : (isDarkMode ? "#F9FAFB" : "#374151")}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View className={`px-4 py-3 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              onPress={() => setFilters({ status: '' }, user.id)}
              className={`px-3 py-1.5 rounded-full ${
                !filters.status 
                  ? 'bg-blue-500' 
                  : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
              activeOpacity={0.7}
            >
              <Text className={`text-xs ${
                !filters.status 
                  ? 'text-white' 
                  : isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                All Status
              </Text>
            </TouchableOpacity>
            {ORDER_STATUSES.map((status) => (
              <TouchableOpacity
                key={status.value}
                onPress={() => setFilters({ status: status.value }, user.id)}
                className={`px-3 py-1.5 rounded-full ${
                  filters.status === status.value 
                    ? 'bg-blue-500' 
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
                activeOpacity={0.7}
              >
                <Text className={`text-xs ${
                  filters.status === status.value 
                    ? 'text-white' 
                    : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row flex-wrap gap-2 mt-2">
            <TouchableOpacity
              onPress={() => setFilters({ paymentStatus: '' }, user.id)}
              className={`px-3 py-1.5 rounded-full ${
                !filters.paymentStatus 
                  ? 'bg-blue-500' 
                  : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}
              activeOpacity={0.7}
            >
              <Text className={`text-xs ${
                !filters.paymentStatus 
                  ? 'text-white' 
                  : isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                All Payment
              </Text>
            </TouchableOpacity>
            {PAYMENT_STATUSES.map((status) => (
              <TouchableOpacity
                key={status.value}
                onPress={() => setFilters({ paymentStatus: status.value }, user.id)}
                className={`px-3 py-1.5 rounded-full ${
                  filters.paymentStatus === status.value 
                    ? 'bg-blue-500' 
                    : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
                activeOpacity={0.7}
              >
                <Text className={`text-xs ${
                  filters.paymentStatus === status.value 
                    ? 'text-white' 
                    : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => setShowStartDatePicker(true)}
              className={`flex-1 px-3 py-2 rounded-lg border ${
                isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}
              activeOpacity={0.7}
            >
              <Text className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {startDate ? startDate.toLocaleDateString() : 'Start Date'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowEndDatePicker(true)}
              className={`flex-1 px-3 py-2 rounded-lg border ${
                isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}
              activeOpacity={0.7}
            >
              <Text className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {endDate ? endDate.toLocaleDateString() : 'End Date'}
              </Text>
            </TouchableOpacity>
          </View>

          {(filters.status || filters.paymentStatus || filters.dateFrom || filters.dateTo) && (
            <TouchableOpacity onPress={handleClearFilters} className="mt-3" activeOpacity={0.7}>
              <Text className="text-sm text-blue-600 dark:text-blue-400">Clear Filters</Text>
            </TouchableOpacity>
          )}

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
            />
          )}
        </View>
      )}

      {/* Orders List */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={['#3B82F6']}
            tintColor={isDarkMode ? '#F9FAFB' : '#3B82F6'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading orders...
            </Text>
          </View>
        ) : filteredOrders.length > 0 ? (
          <>
            {viewMode === 'list' ? (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onView={handleViewOrder}
                />
              ))
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {filteredOrders.map((order) => (
                  <GridOrderCard
                    key={order.id}
                    order={order}
                    onView={handleViewOrder}
                  />
                ))}
              </View>
            )}
            <View className="py-4 items-center">
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Showing {filteredOrders.length} orders
              </Text>
            </View>
          </>
        ) : (
          <View className="py-20 items-center">
            <Icon name="cart" size={80} color={isDarkMode ? '#334155' : '#D1D5DB'} />
            <Text className={`text-lg mt-4 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              No orders found
            </Text>
            <Text className={`text-sm mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm || filters.status || filters.paymentStatus
                ? 'Try adjusting your filters'
                : 'Orders will appear here'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Print Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPrintModal}
        onRequestClose={() => {
          setShowPrintModal(false);
          setSelectedOrderForPrint(null);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className={`rounded-t-3xl p-6 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <View className="items-center mb-4">
              <View 
                className={`w-12 h-1 rounded-full ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              />
            </View>

            <Text className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Print Options
            </Text>
            <Text className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Order #{selectedOrderForPrint?.order_id}
            </Text>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => handlePrintInvoice('a4')}
                className={`py-3 px-4 rounded-xl flex-row items-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
                activeOpacity={0.7}
              >
                <Icon name="file-document" size={24} color="#3B82F6" />
                <View className="ml-3">
                  <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Print A4 Invoice
                  </Text>
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Standard A4 paper format
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handlePrintInvoice('thermal')}
                className={`py-3 px-4 rounded-xl flex-row items-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
                activeOpacity={0.7}
              >
                <Icon name="printer" size={24} color="#10B981" />
                <View className="ml-3">
                  <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Print Thermal Receipt
                  </Text>
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    80mm thermal printer format
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowPrintModal(false);
                  setSelectedOrderForPrint(null);
                }}
                className={`mt-2 py-3 px-4 rounded-xl border ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Text className={`text-center font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showStatusModal}
        onRequestClose={() => {
          setShowStatusModal(false);
          setSelectedOrderForStatus(null);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className={`rounded-t-3xl p-6 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <View className="items-center mb-4">
              <View 
                className={`w-12 h-1 rounded-full ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              />
            </View>

            <Text className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Update Status
            </Text>
            <Text className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Order #{selectedOrderForStatus?.order_id}
            </Text>

            <View className="space-y-4">
              <View>
                <Text className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Order Status
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {ORDER_STATUSES.map((option) => {
                    const isSelected = editOrderStatus === option.value;
                    const color = getStatusColor(option.value, isDarkMode);
                    
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setEditOrderStatus(option.value)}
                        className={`px-4 py-2 rounded-xl flex-row items-center border-2 ${
                          isSelected 
                            ? 'border-blue-500' 
                            : isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}
                        style={{
                          backgroundColor: isSelected 
                            ? isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF'
                            : isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
                        }}
                        activeOpacity={0.7}
                      >
                        <Icon 
                          name={option.icon} 
                          size={16} 
                          color={isSelected ? color : isDarkMode ? '#94A3B8' : '#6B7280'} 
                        />
                        <Text 
                          className="ml-1.5 text-xs font-medium"
                          style={{
                            color: isSelected ? color : isDarkMode ? '#D1D5DB' : '#374151',
                          }}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Payment Status
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {PAYMENT_STATUSES.map((option) => {
                    const isSelected = editPaymentStatus === option.value;
                    const color = getStatusColor(option.value, isDarkMode);
                    
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setEditPaymentStatus(option.value)}
                        className={`px-4 py-2 rounded-xl flex-row items-center border-2 ${
                          isSelected 
                            ? 'border-blue-500' 
                            : isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}
                        style={{
                          backgroundColor: isSelected 
                            ? isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF'
                            : isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
                        }}
                        activeOpacity={0.7}
                      >
                        <Icon 
                          name={option.icon} 
                          size={16} 
                          color={isSelected ? color : isDarkMode ? '#94A3B8' : '#6B7280'} 
                        />
                        <Text 
                          className="ml-1.5 text-xs font-medium"
                          style={{
                            color: isSelected ? color : isDarkMode ? '#D1D5DB' : '#374151',
                          }}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  onPress={handleStatusModalSave}
                  disabled={
                    editOrderStatus === selectedOrderForStatus?.order_status &&
                    editPaymentStatus === selectedOrderForStatus?.payment_status
                  }
                  className={`flex-1 rounded-xl py-3.5 items-center justify-center ${
                    editOrderStatus === selectedOrderForStatus?.order_status &&
                    editPaymentStatus === selectedOrderForStatus?.payment_status
                      ? 'bg-gray-400 dark:bg-gray-600'
                      : 'bg-blue-500'
                  }`}
                  activeOpacity={0.7}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-sm font-semibold">Save Changes</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowStatusModal(false);
                    setSelectedOrderForStatus(null);
                  }}
                  className={`flex-1 rounded-xl py-3.5 items-center justify-center border ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrdersScreen;