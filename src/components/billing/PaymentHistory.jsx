// components/billing/PaymentHistory.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const { width } = Dimensions.get("window");

const PaymentHistory = ({ payments, loading, onViewInvoice, onDownloadInvoice }) => {
  const { isDarkMode } = useThemeStore();

  const getStatusConfig = (status) => {
    const configs = {
      succeeded: { variant: "success", icon: "check-circle", label: "Succeeded" },
      success: { variant: "success", icon: "check-circle", label: "Success" },
      pending: { variant: "warning", icon: "clock", label: "Pending" },
      failed: { variant: "danger", icon: "close-circle", label: "Failed" },
      refunded: { variant: "info", icon: "refresh", label: "Refunded" },
      active: { variant: "success", icon: "check-circle", label: "Active" },
      expired: { variant: "warning", icon: "clock", label: "Expired" },
    };
    return configs[status] || configs.pending;
  };

  const getStatusColor = (variant) => {
    const colors = {
      success: {
        bg: isDarkMode ? "bg-green-900/30" : "bg-green-100",
        text: isDarkMode ? "text-green-400" : "text-green-700",
        dot: "bg-green-500"
      },
      warning: {
        bg: isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100",
        text: isDarkMode ? "text-yellow-400" : "text-yellow-700",
        dot: "bg-yellow-500"
      },
      danger: {
        bg: isDarkMode ? "bg-red-900/30" : "bg-red-100",
        text: isDarkMode ? "text-red-400" : "text-red-700",
        dot: "bg-red-500"
      },
      info: {
        bg: isDarkMode ? "bg-blue-900/30" : "bg-blue-100",
        text: isDarkMode ? "text-blue-400" : "text-blue-700",
        dot: "bg-blue-500"
      },
    };
    return colors[variant] || colors.warning;
  };

  const formatAmount = (amount, currency = "INR") => {
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol} ${parseFloat(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View className={`rounded-3xl p-8 shadow-sm ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}>
        <View className="items-center">
          <View className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <Text className={`mt-4 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Loading payment history...
          </Text>
        </View>
      </View>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <View className={`rounded-3xl p-8 items-center shadow-sm ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}>
        <View className={`p-4 rounded-full ${
          isDarkMode ? "bg-gray-700" : "bg-gray-100"
        }`}>
          <Icon name="receipt" size={48} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
        </View>
        <Text className={`text-lg font-semibold mt-4 ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}>
          No Payment History
        </Text>
        <Text className={`text-sm mt-2 text-center ${
          isDarkMode ? "text-gray-400" : "text-gray-500"
        }`}>
          Your payment history will appear here once you make a purchase
        </Text>
      </View>
    );
  }

  return (
    <View className={`rounded-3xl shadow-sm overflow-hidden ${
      isDarkMode ? "bg-gray-800" : "bg-white"
    }`}>
      {/* Header */}
      <View className={`px-6 py-4 border-b ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      }`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Icon name="history" size={22} color="#3B82F6" />
            <Text className={`ml-2 font-bold text-lg ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              Payment History
            </Text>
          </View>
          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {payments.length} transactions
          </Text>
        </View>
      </View>

      <ScrollView 
        className="max-h-[500px]" 
        showsVerticalScrollIndicator={false}
      >
        {payments.map((payment, index) => {
          const statusConfig = getStatusConfig(payment.payment_status);
          const statusColors = getStatusColor(statusConfig.variant);
          const isLast = index === payments.length - 1;

          return (
            <TouchableOpacity
              key={payment.id || index}
              activeOpacity={0.7}
              onPress={() => onViewInvoice && onViewInvoice(payment)}
              className={`px-6 py-4 ${!isLast ? isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100" : ""}`}
            >
              <View className="flex-row items-start">
                {/* Status Icon */}
                <View className={`p-2 rounded-full mr-4 ${statusColors.bg}`}>
                  <Icon name={statusConfig.icon} size={20} color={
                    statusConfig.variant === 'success' ? '#10B981' :
                    statusConfig.variant === 'warning' ? '#F59E0B' :
                    statusConfig.variant === 'danger' ? '#EF4444' : '#3B82F6'
                  } />
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className={`font-semibold text-base ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      {payment.plan?.name || payment.description || `Plan #${payment.plan_id}`}
                    </Text>
                    <Text className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      {formatAmount(payment.price, payment.currency)}
                    </Text>
                  </View>

                  <View className="flex-row items-center mt-1">
                    <View className={`w-1.5 h-1.5 rounded-full mr-2 ${statusColors.dot}`} />
                    <Text className={`text-xs ${statusColors.text}`}>
                      {statusConfig.label}
                    </Text>
                    <Text className={`text-xs ml-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {formatDate(payment.created_at)}
                    </Text>
                  </View>

                  {payment.planDetails && (
                    <View className="flex-row items-center mt-1.5">
                      <Icon name="calendar" size={12} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                      <Text className={`text-xs ml-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {payment.planDetails.duration_days || "N/A"} days
                      </Text>
                      {payment.startDate && payment.endDate && (
                        <>
                          <Icon name="arrow-right" size={12} color={isDarkMode ? "#6B7280" : "#9CA3AF"} style={{ marginHorizontal: 4 }} />
                          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {formatDate(payment.startDate)} - {formatDate(payment.endDate)}
                          </Text>
                        </>
                      )}
                    </View>
                  )}

                  {payment.paymentId && (
                    <View className="mt-1.5">
                      <Text className={`text-xs font-mono ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        ID: {payment.paymentId}
                      </Text>
                    </View>
                  )}

                  {payment.remarks && (
                    <View className="mt-1.5">
                      <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {payment.remarks}
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  {(payment.invoiceId || onDownloadInvoice) && (
                    <View className="flex-row items-center mt-3 space-x-3">
                      {onViewInvoice && (
                        <TouchableOpacity
                          onPress={() => onViewInvoice(payment)}
                          className={`flex-row items-center px-3 py-1.5 rounded-lg ${
                            isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
                          }`}
                        >
                          <Icon name="eye" size={16} color="#3B82F6" />
                          <Text className={`text-xs font-medium ml-1.5 ${
                            isDarkMode ? "text-blue-400" : "text-blue-600"
                          }`}>
                            View
                          </Text>
                        </TouchableOpacity>
                      )}
                      {onDownloadInvoice && (
                        <TouchableOpacity
                          onPress={() => onDownloadInvoice(payment)}
                          className={`flex-row items-center px-3 py-1.5 rounded-lg ${
                            isDarkMode ? "bg-green-900/30" : "bg-green-50"
                          }`}
                        >
                          <Icon name="download" size={16} color="#10B981" />
                          <Text className={`text-xs font-medium ml-1.5 ${
                            isDarkMode ? "text-green-400" : "text-green-600"
                          }`}>
                            Download
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View className={`px-6 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <View className="flex-row items-center justify-between">
          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Showing {payments.length} transactions
          </Text>
          <TouchableOpacity className="flex-row items-center">
            <Text className={`text-xs font-medium text-blue-600`}>
              View All
            </Text>
            <Icon name="chevron-right" size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PaymentHistory;