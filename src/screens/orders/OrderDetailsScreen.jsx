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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useThemeStore } from '../../store/themeStore';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import Toast from 'react-native-toast-message';
import { generateA4InvoiceHTML, generateThermalInvoiceHTML } from '../../utils/invoiceTemplates';

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

const OrderDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params;
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const {
    orders,
    selectedOrder,
    loading,
    updateOrderStatus,
    updatePaymentStatus,
    updateOrderPayment,
    setSelectedOrder,
    fetchOrders,
  } = useOrderStore();

  // State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [updating, setUpdating] = useState(false);

  // Computed values
  const remainingAmount = useMemo(() => {
    if (!selectedOrder) return 0;
    return parseFloat(selectedOrder.total_amount || 0) - parseFloat(selectedOrder.paid_amount || 0);
  }, [selectedOrder]);

  const isFullyPaid = useMemo(() => remainingAmount <= 0, [remainingAmount]);
  const paidPercentage = useMemo(() => {
    if (!selectedOrder || selectedOrder.total_amount === 0) return 0;
    return (parseFloat(selectedOrder.paid_amount || 0) / parseFloat(selectedOrder.total_amount || 0)) * 100;
  }, [selectedOrder]);

  // Effects
  useEffect(() => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setEditStatus(order.order_status);
      setEditPaymentStatus(order.payment_status);
    }
  }, [orderId, orders]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (user?.id) {
      await fetchOrders(1, user.id);
    }
    setIsRefreshing(false);
  }, [user]);

  const handlePaymentAmountChange = useCallback((value) => {
    const sanitized = value.replace(/[^\d.]/g, '');
    const decimalCount = (sanitized.match(/\./g) || []).length;
    if (decimalCount > 1) return;
    setPaymentAmount(sanitized);
  }, []);

  const handleBothUpdates = useCallback(async () => {
    setUpdating(true);
    try {
      const statusChanged = editStatus !== selectedOrder?.order_status;
      const paymentStatusChanged = editPaymentStatus !== selectedOrder?.payment_status;

      if (statusChanged) {
        await updateOrderStatus(orderId, editStatus);
      }
      if (paymentStatusChanged) {
        await updatePaymentStatus(orderId, editPaymentStatus);
      }

      if (user?.id) {
        await fetchOrders(1, user.id);
      }

      setShowStatusModal(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Order updated successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update order',
      });
    } finally {
      setUpdating(false);
    }
  }, [editStatus, editPaymentStatus, orderId, selectedOrder, updateOrderStatus, updatePaymentStatus, user]);

  const handlePaymentAmountUpdate = useCallback(async () => {
    if (!paymentAmount || paymentAmount === '.') {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: 'Please enter a valid payment amount',
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: 'Amount must be greater than 0',
      });
      return;
    }

    if (amount > remainingAmount) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Amount cannot exceed remaining due of ₹${remainingAmount.toFixed(2)}`,
      });
      return;
    }

    setUpdating(true);
    try {
      await updateOrderPayment(orderId, user.id, paymentAmount);
      setPaymentAmount('');
      setShowPaymentModal(false);
      if (user?.id) {
        await fetchOrders(1, user.id);
      }
      Toast.show({
        type: 'success',
        text1: 'Payment Added',
        text2: `₹${amount.toFixed(2)} added successfully`,
      });
    } catch (error) {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: 'Failed to add payment',
      });
    } finally {
      setUpdating(false);
    }
  }, [paymentAmount, remainingAmount, orderId, user, updateOrderPayment, fetchOrders]);

  const handlePrintInvoice = useCallback(async (type) => {
    if (!selectedOrder) return;

    try {
      const modifiedOrder = {
        ...selectedOrder,
        id: selectedOrder.order_id || selectedOrder.id,
        invoice_number: selectedOrder.order_id || selectedOrder.id,
        payment_mode: selectedOrder.payment_method,
      };

      const html = type === 'a4' 
        ? generateA4InvoiceHTML(modifiedOrder, true)
        : generateThermalInvoiceHTML(modifiedOrder, true);

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${type === 'a4' ? 'A4 Invoice' : 'Thermal Receipt'}`,
      });
    } catch (error) {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: 'Failed to generate invoice',
      });
    }
  }, [selectedOrder]);

  // Render helpers
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

  const getStatusBgColor = useCallback((status, isDark) => {
    const color = getStatusColor(status, isDark);
    return `${color}20`;
  }, [getStatusColor]);

  const renderInfoRow = useCallback((label, value, icon) => {
    if (!value) return null;
    
    return (
      <View 
        className={`flex-row items-center py-2.5 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-100'
        } last:border-0`}
      >
        <View className="w-8">
          <Icon name={icon} size={20} color={isDarkMode ? '#94A3B8' : '#64748B'} />
        </View>
        <View className="flex-1">
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {label}
          </Text>
          <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {value}
          </Text>
        </View>
      </View>
    );
  }, [isDarkMode]);

  const renderOrderItem = useCallback((item, index) => (
    <View 
      key={index} 
      className={`flex-row items-center py-3 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-100'
      } last:border-0`}
    >
      <View className="flex-1">
        <Text className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {item.product?.name || item.name}
        </Text>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Qty: {item.quantity} × ₹{parseFloat(item.price || 0).toFixed(2)}
        </Text>
      </View>
      <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        ₹{(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toFixed(2)}
      </Text>
    </View>
  ), [isDarkMode]);

  // Loading state
  if (!selectedOrder) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#111827' : '#F9FAFB'}
        />
        <Header title="Order Details" showBackButton={true}
        showSidebar={false} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading order details...
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
        title={`Order #${selectedOrder.order_id}`}
        showBackButton={true}
        showSidebar={false}
        rightComponent={
          <TouchableOpacity
            onPress={() => setShowStatusModal(true)}
            className="px-3 py-1.5 bg-blue-500 rounded-lg"
          >
            <Text className="text-white text-xs font-medium">Update</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            colors={['#3B82F6']}
            tintColor={isDarkMode ? '#F9FAFB' : '#3B82F6'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary Card */}
        <View className="mx-4 mt-4">
          <View 
            className={`rounded-2xl p-5 border shadow-sm ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            style={{ shadowColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Order Date
                </Text>
                <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <View className="items-end">
                <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Order Time
                </Text>
                <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {new Date(selectedOrder.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            <View 
              className={`flex-row items-center justify-between pt-4 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <View className="flex-row items-center gap-2">
                <View 
                  className="px-3 py-1.5 rounded-full flex-row items-center"
                  style={{ backgroundColor: getStatusBgColor(selectedOrder.order_status, isDarkMode) }}
                >
                  <Icon 
                    name={ORDER_STATUSES.find(s => s.value === selectedOrder.order_status)?.icon || 'clock-outline'} 
                    size={14} 
                    color={getStatusColor(selectedOrder.order_status, isDarkMode)} 
                  />
                  <Text 
                    className="ml-1.5 text-xs font-medium"
                    style={{ color: getStatusColor(selectedOrder.order_status, isDarkMode) }}
                  >
                    {ORDER_STATUSES.find(s => s.value === selectedOrder.order_status)?.label || selectedOrder.order_status}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <View 
                  className="px-3 py-1.5 rounded-full flex-row items-center"
                  style={{ backgroundColor: getStatusBgColor(selectedOrder.payment_status, isDarkMode) }}
                >
                  <Icon 
                    name={PAYMENT_STATUSES.find(s => s.value === selectedOrder.payment_status)?.icon || 'clock-outline'} 
                    size={14} 
                    color={getStatusColor(selectedOrder.payment_status, isDarkMode)} 
                  />
                  <Text 
                    className="ml-1.5 text-xs font-medium"
                    style={{ color: getStatusColor(selectedOrder.payment_status, isDarkMode) }}
                  >
                    {PAYMENT_STATUSES.find(s => s.value === selectedOrder.payment_status)?.label || selectedOrder.payment_status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Progress Card */}
        <View 
          className={`mx-4 mt-4 rounded-2xl p-5 border shadow-sm ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          style={{ shadowColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Payment Status
            </Text>
            {!isFullyPaid && (
              <TouchableOpacity
                onPress={() => setShowPaymentModal(true)}
                className="px-3 py-1.5 bg-green-500 rounded-lg"
              >
                <Text className="text-white text-xs font-medium">Add Payment</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Paid
              </Text>
              <Text className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ₹{parseFloat(selectedOrder.paid_amount || 0).toFixed(2)} of ₹{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}
              </Text>
            </View>
            <View className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <View 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${Math.min(paidPercentage, 100)}%` }}
              />
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Remaining Balance
            </Text>
            <Text className={`text-base font-bold ${
              isFullyPaid 
                ? isDarkMode ? 'text-green-400' : 'text-green-600'
                : isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              {isFullyPaid ? '✅ Paid in Full' : `₹${remainingAmount.toFixed(2)}`}
            </Text>
          </View>
        </View>

        {/* Customer Info Card */}
        <View 
          className={`mx-4 mt-4 rounded-2xl p-5 border shadow-sm ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          style={{ shadowColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }}
        >
          <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3`}>
            Customer Details
          </Text>
          {renderInfoRow('Customer Name', selectedOrder.customer_name, 'account-outline')}
          {renderInfoRow('Phone Number', selectedOrder.customer_phone, 'phone-outline')}
          {renderInfoRow('Payment Method', selectedOrder.payment_method?.replace('_', ' ') || 'N/A', 'credit-card-outline')}
        </View>

        {/* Order Items Card */}
        <View 
          className={`mx-4 mt-4 rounded-2xl p-5 border shadow-sm ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
          style={{ shadowColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Order Items
            </Text>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedOrder.items?.length || 0} items
            </Text>
          </View>

          <View className="mb-3">
            {selectedOrder.items?.map(renderOrderItem)}
          </View>

          <View 
            className={`pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <View className="flex-row items-center justify-between">
              <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Subtotal
              </Text>
              <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ₹{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}
              </Text>
            </View>
            <View 
              className={`flex-row items-center justify-between pt-2 mt-2 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <Text className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Total
              </Text>
              <Text className="text-lg font-bold text-blue-600 dark:text-blue-400">
                ₹{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes Card */}
        {selectedOrder.notes && (
          <View 
            className={`mx-4 mt-4 rounded-2xl p-5 border shadow-sm ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            style={{ shadowColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)' }}
          >
            <Text className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
              Order Notes
            </Text>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-5`}>
              {selectedOrder.notes}
            </Text>
          </View>
        )}

        {/* Action Buttons - Fixed with proper text visibility */}
        <View className="px-4 mt-6 mb-8">
          <View className="flex-row gap-3">
            {/* A4 Invoice Button */}
            <TouchableOpacity
              onPress={() => handlePrintInvoice('a4')}
              className="flex-1 bg-blue-500 rounded-xl py-3.5 flex-row items-center justify-center shadow-sm shadow-blue-500/30"
              activeOpacity={0.8}
            >
              <Icon name="file-pdf-box" size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold ml-2">
                A4 Invoice
              </Text>
            </TouchableOpacity>

            {/* Thermal Receipt Button */}
            <TouchableOpacity
              onPress={() => handlePrintInvoice('thermal')}
              className={`flex-1 rounded-xl py-3.5 flex-row items-center justify-center border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-100 border-gray-200'
              }`}
              activeOpacity={0.8}
            >
              <Icon 
                name="receipt" 
                size={18} 
                color={isDarkMode ? '#60A5FA' : '#3B82F6'} 
              />
              <Text className={`text-sm font-semibold ml-2 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Thermal Receipt
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Status Update Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showStatusModal}
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className={`rounded-t-3xl p-6 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Modal Handle */}
            <View className="items-center mb-4">
              <View 
                className={`w-12 h-1 rounded-full ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              />
            </View>

            <Text className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Update Order Status
            </Text>

            <View className="space-y-6">
              {/* Order Status */}
              <View>
                <Text className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Order Status
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {ORDER_STATUSES.map((option) => {
                    const isSelected = editStatus === option.value;
                    const color = getStatusColor(option.value, isDarkMode);
                    
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => setEditStatus(option.value)}
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

              {/* Payment Status */}
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

              {/* Action Buttons - Fixed with proper text visibility */}
              <View className="flex-row gap-3 mt-2">
                 <TouchableOpacity
                  onPress={() => setShowStatusModal(false)}
                  className={`flex-1 rounded-xl py-3.5 items-center justify-center border ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700' 
                      : 'border-gray-300 bg-white'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className={`text-sm font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleBothUpdates}
                  disabled={
                    editStatus === selectedOrder?.order_status &&
                    editPaymentStatus === selectedOrder?.payment_status
                  }
                  className={`flex-1 rounded-xl py-3.5 items-center justify-center ${
                    editStatus === selectedOrder?.order_status &&
                    editPaymentStatus === selectedOrder?.payment_status
                      ? 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-blue-500'
                  }`}
                  activeOpacity={0.8}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-sm font-semibold">
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>

               
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal - Fixed with proper button text visibility */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={() => {
          setShowPaymentModal(false);
          setPaymentAmount('');
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View 
            className={`rounded-t-3xl p-6 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Modal Handle */}
            <View className="items-center mb-4">
              <View 
                className={`w-12 h-1 rounded-full ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              />
            </View>

            <Text className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Add Payment
            </Text>

            <View className="space-y-4">
              <View 
                className={`rounded-xl p-4 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Total Amount
                  </Text>
                  <Text className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    ₹{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Already Paid
                  </Text>
                  <Text className="text-base font-semibold text-green-600 dark:text-green-400">
                    ₹{parseFloat(selectedOrder.paid_amount || 0).toFixed(2)}
                  </Text>
                </View>
                <View 
                  className={`flex-row items-center justify-between mt-2 pt-2 border-t ${
                    isDarkMode ? 'border-gray-600' : 'border-gray-300'
                  }`}
                >
                  <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Due Amount
                  </Text>
                  <Text className="text-base font-bold text-red-600 dark:text-red-400">
                    ₹{remainingAmount.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View>
                <Text className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Enter Payment Amount
                </Text>
                <View 
                  className={`flex-row items-center px-4 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text className={`text-lg font-bold mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ₹
                  </Text>
                  <TextInput
                    className={`flex-1 py-3 text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}
                    placeholder="0.00"
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                    value={paymentAmount}
                    onChangeText={handlePaymentAmountChange}
                    keyboardType="decimal-pad"
                    autoFocus
                    selectionColor="#3B82F6"
                  />
                </View>
                {paymentAmount && parseFloat(paymentAmount) > 0 && (
                  <Text className={`text-xs mt-2 ${
                    parseFloat(paymentAmount) >= remainingAmount 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {parseFloat(paymentAmount) >= remainingAmount
                      ? '✅ This payment will complete the order'
                      : `⚠️ Remaining due: ₹${(remainingAmount - parseFloat(paymentAmount)).toFixed(2)}`}
                  </Text>
                )}
              </View>

              {/* Action Buttons - Fixed with proper text visibility */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handlePaymentAmountUpdate}
                  disabled={
                    !paymentAmount ||
                    parseFloat(paymentAmount) <= 0 ||
                    parseFloat(paymentAmount) > remainingAmount ||
                    updating
                  }
                  className={`flex-1 rounded-xl py-3.5 items-center justify-center ${
                    !paymentAmount ||
                    parseFloat(paymentAmount) <= 0 ||
                    parseFloat(paymentAmount) > remainingAmount ||
                    updating
                      ? 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-blue-500'
                  }`}
                  activeOpacity={0.8}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-sm font-semibold">
                      Add Payment
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount('');
                  }}
                  className={`flex-1 rounded-xl py-3.5 items-center justify-center border ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-700' 
                      : 'border-gray-300 bg-white'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className={`text-sm font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick amount buttons */}
              {remainingAmount > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {[remainingAmount, remainingAmount / 2, Math.round(remainingAmount * 0.75 * 100) / 100]
                    .filter(amount => amount > 0 && amount !== remainingAmount)
                    .slice(0, 2)
                    .map((amount) => (
                      <TouchableOpacity
                        key={amount}
                        onPress={() => setPaymentAmount(amount.toFixed(2))}
                        className={`px-4 py-2 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}
                      >
                        <Text className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          ₹{amount.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  <TouchableOpacity
                    onPress={() => setPaymentAmount(remainingAmount.toFixed(2))}
                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"
                  >
                    <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      Pay Full ₹{remainingAmount.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OrderDetailsScreen;