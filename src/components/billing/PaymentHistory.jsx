// components/billing/PaymentHistory.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

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
      success: isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700",
      warning: isDarkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700",
      danger: isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700",
      info: isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-700",
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

  if (loading) {
    return (
      <View className={`rounded-2xl p-8 ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}>
        <View className="items-center">
          <View className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </View>
      </View>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <View className={`rounded-2xl p-8 items-center ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}>
        <Icon name="file-document" size={48} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
        <Text className={`text-lg font-medium mt-3 ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}>
          No payment history
        </Text>
        <Text className={`mt-1 ${
          isDarkMode ? "text-gray-400" : "text-gray-500"
        }`}>
          Your payment history will appear here once you make a purchase
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className={`rounded-2xl overflow-hidden ${
      isDarkMode ? "bg-gray-800" : "bg-white"
    }`} showsVerticalScrollIndicator={false}>
      {payments.map((payment, index) => {
        const statusConfig = getStatusConfig(payment.payment_status);
        const statusColor = getStatusColor(statusConfig.variant);

        return (
          <View
            key={payment.id || index}
            className={`p-4 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <View className="flex-row items-center justify-between">
              {/* Date and Plan Details */}
              <View className="flex-1 mr-4">
                <Text className={`font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  {payment.plan?.name || `Plan #${payment.plan_id}`}
                </Text>
                {payment.planDetails && (
                  <Text className={`text-xs mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    Duration: {payment.planDetails.duration_days || "N/A"} days
                  </Text>
                )}
                {payment.startDate && payment.endDate && (
                  <Text className={`text-xs mt-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    Period: {formatDate(payment.startDate)} - {formatDate(payment.endDate)}
                  </Text>
                )}
                <Text className={`text-xs mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  {formatDate(payment.created_at)}
                </Text>
              </View>

              {/* Amount and Status */}
              <View className="items-end">
                <Text className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  {formatAmount(payment.price, payment.currency)}
                </Text>
                <View className={`px-2 py-1 rounded-full mt-1 flex-row items-center ${statusColor}`}>
                  <Icon name={statusConfig.icon} size={12} />
                  <Text className={`text-xs font-medium ml-1`}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Details */}
            <View className="mt-3 pt-3 border-t">
              <View className="flex-row items-center justify-between">
                <Text className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  {payment.description || "Plan Purchase"}
                </Text>
                {payment.paymentId && (
                  <Text className={`text-xs font-mono ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    ID: {payment.paymentId}
                  </Text>
                )}
              </View>
              {payment.remarks && (
                <Text className={`text-xs mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Remarks: {payment.remarks}
                </Text>
              )}
            </View>

            {/* Actions */}
            {payment.invoiceId && (
              <View className="flex-row items-center mt-3 space-x-2">
                {onViewInvoice && (
                  <TouchableOpacity
                    onPress={() => onViewInvoice(payment)}
                    className={`p-2 rounded-lg ${
                      isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
                    }`}
                  >
                    <Icon name="eye" size={18} color="#3B82F6" />
                  </TouchableOpacity>
                )}
                {onDownloadInvoice && (
                  <TouchableOpacity
                    onPress={() => onDownloadInvoice(payment)}
                    className={`p-2 rounded-lg ${
                      isDarkMode ? "bg-green-900/30" : "bg-green-50"
                    }`}
                  >
                    <Icon name="download" size={18} color="#10B981" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

export default PaymentHistory;
