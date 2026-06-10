// components/reports/ReportPrintPreview.js
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ReportPrintPreview = ({ data, isDarkMode, format = 'a4' }) => {
  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return `₹${num.toFixed(2)}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    const statusText = (status || 'completed').toLowerCase();
    switch (statusText) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status) => {
    const statusText = (status || 'completed').toLowerCase();
    switch (statusText) {
      case 'completed':
        return '#d1fae5';
      case 'pending':
        return '#fed7aa';
      case 'cancelled':
        return '#fee2e2';
      default:
        return '#f3f4f6';
    }
  };

  if (!data || !data.reports) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Icon name="file-document-outline" size={60} color="#9ca3af" />
        <Text className="text-gray-500 text-center mt-4">No data available for printing</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <Text className={`text-2xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Reports Dashboard
        </Text>
        <Text className={`text-center text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Generated on: {new Date(data.generatedAt).toLocaleString()}
        </Text>
        <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Period: {data.dateRange || 'Last 30 Days'} ({data.startDate || 'N/A'} - {data.endDate || 'N/A'})
        </Text>
      </View>

      {/* Store Info */}
      {data.storeInfo && (
        <View className="mb-6 p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
          <Text className={`text-center font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {data.storeInfo.name}
          </Text>
          <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {data.storeInfo.address}
          </Text>
          <Text className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {data.storeInfo.phone} | {data.storeInfo.email}
          </Text>
        </View>
      )}

      {/* Summary Cards */}
      <View className="mb-6">
        <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Summary
        </Text>
        <View className="flex-row flex-wrap justify-between">
          <View className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 mb-2" style={{ width: '48%' }}>
            <Text className="text-xs text-green-600 dark:text-green-400">Total Revenue</Text>
            <Text className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatCurrency(data.totals?.totalSales || data.summary?.totalSalesAmount || 0)}
            </Text>
          </View>
          <View className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-2" style={{ width: '48%' }}>
            <Text className="text-xs text-blue-600 dark:text-blue-400">Total Orders</Text>
            <Text className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {data.reports.length}
            </Text>
          </View>
          <View className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30" style={{ width: '48%' }}>
            <Text className="text-xs text-purple-600 dark:text-purple-400">Products Sold</Text>
            <Text className="text-lg font-bold text-purple-700 dark:text-purple-300">
              {data.totals?.totalItems || data.summary?.totalSalesItems || 0}
            </Text>
          </View>
          <View className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30" style={{ width: '48%' }}>
            <Text className="text-xs text-orange-600 dark:text-orange-400">Total Due</Text>
            <Text className="text-lg font-bold text-orange-700 dark:text-orange-300">
              {formatCurrency(data.totals?.totalDue || data.summary?.totalDue || 0)}
            </Text>
          </View>
        </View>
      </View>

      {/* Reports List */}
      <View>
        <Text className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Report Details ({data.reports.length} records)
        </Text>
        
        {data.reports.map((report, index) => (
          <View
            key={report.id || index}
            className={`mb-3 p-3 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Invoice #{report.invoice_number || report.id}
                </Text>
                <Text className={`text-sm font-semibold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  {report.customer_name || 'Deleted Customer'}
                </Text>
              </View>
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: getStatusBgColor(report.status) }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: getStatusColor(report.status) }}
                >
                  {((report.status || 'completed') + '').toUpperCase()}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-1">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date:</Text>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {formatDate(report.created_at)}
              </Text>
            </View>

            <View className="flex-row justify-between mb-1">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Store:</Text>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {report.store_name || 'Deleted Store'}
              </Text>
            </View>

            <View className="flex-row justify-between mb-1">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total:</Text>
              <Text className="text-xs font-semibold text-green-600">
                {formatCurrency(report.total_amount)}
              </Text>
            </View>

            <View className="flex-row justify-between mb-1">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Paid:</Text>
              <Text className="text-xs text-blue-600">
                {formatCurrency(report.paid_amount)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Items:</Text>
              <Text className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {report.total_items || 0}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Text className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Confidential - For Internal Use Only
        </Text>
        <Text className={`text-xs text-center mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Generated by {data.user?.name || 'System'} | {new Date(data.generatedAt).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
};

export default ReportPrintPreview;