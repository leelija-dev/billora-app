// components/reports/ReportPrintPreview.js
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ReportPrintPreview = ({ data, isDarkMode, format = 'a4' }) => {
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getTypeColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'sales': return '#10b981';
      case 'purchases': return '#f59e0b';
      case 'inventory': return '#8b5cf6';
      case 'profits': return '#ec4899';
      default: return '#3b82f6';
    }
  };

  return (
    <View className={`flex-1 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <View className="items-center mb-8 pb-6 border-b-2 border-gray-300">
        <Text className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {data.storeInfo.name}
        </Text>
        <Text className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {data.storeInfo.address}
        </Text>
        <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {data.storeInfo.phone} | {data.storeInfo.email}
        </Text>
        <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          GST: {data.storeInfo.gst}
        </Text>
      </View>

      {/* Title */}
      <Text className={`text-2xl font-bold text-center mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        REPORTS SUMMARY
      </Text>

      {/* Info Grid */}
      <View className={`flex-row justify-between mb-6 p-4 rounded-lg border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
      }`}>
        <View>
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Report Period
          </Text>
          <Text className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {data.dateRange}
          </Text>
        </View>
        <View>
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Generated On
          </Text>
          <Text className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {formatDate(data.generatedAt)}
          </Text>
        </View>
        <View>
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Report Type
          </Text>
          <Text className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {data.reportType.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View className="flex-row flex-wrap gap-4 mb-6">
        <View className="flex-1 min-w-[150px] p-4 bg-blue-500 rounded-lg">
          <Text className="text-white text-sm opacity-90">Total Reports</Text>
          <Text className="text-white text-2xl font-bold">{data.totals.totalReports}</Text>
        </View>
        <View className="flex-1 min-w-[150px] p-4 bg-green-500 rounded-lg">
          <Text className="text-white text-sm opacity-90">Total Sales</Text>
          <Text className="text-white text-2xl font-bold">${formatCurrency(data.totals.totalSales)}</Text>
        </View>
        <View className="flex-1 min-w-[150px] p-4 bg-orange-500 rounded-lg">
          <Text className="text-white text-sm opacity-90">Total Purchases</Text>
          <Text className="text-white text-2xl font-bold">${formatCurrency(data.totals.totalPurchases)}</Text>
        </View>
        <View className="flex-1 min-w-[150px] p-4 bg-purple-500 rounded-lg">
          <Text className="text-white text-sm opacity-90">Total Profit</Text>
          <Text className="text-white text-2xl font-bold">${formatCurrency(data.totals.totalProfit)}</Text>
        </View>
      </View>

      {/* Reports Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Table Header */}
          <View className={`flex-row py-3 px-2 border-b-2 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'
          }`}>
            <Text className={`w-12 font-bold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>#</Text>
            <Text className={`w-20 font-bold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>ID</Text>
            <Text className={`w-32 font-bold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Name</Text>
            <Text className={`w-24 font-bold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Type</Text>
            <Text className={`w-24 font-bold text-right ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Amount ($)</Text>
            <Text className={`w-20 font-bold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Status</Text>
            <Text className={`w-28 font-bold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Date</Text>
          </View>

          {/* Table Rows */}
          {data.reports.map((report, index) => (
            <View key={index} className={`flex-row py-3 px-2 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-50') : ''}`}>
              <Text className={`w-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{index + 1}</Text>
              <Text className={`w-20 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{report.id || 'N/A'}</Text>
              <Text className={`w-32 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{report.name || 'N/A'}</Text>
              <View className="w-24">
                <View style={{ backgroundColor: `${getTypeColor(report.type)}20` }} className="px-2 py-1 rounded inline-block">
                  <Text style={{ color: getTypeColor(report.type) }} className="text-xs font-medium">
                    {(report.type || 'N/A').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text className={`w-24 text-right font-medium ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                ${formatCurrency(report.amount || 0)}
              </Text>
              <Text className={`w-20 ${
                report.status === 'completed' 
                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                  : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              } font-medium`}>
                {(report.status || 'N/A').toUpperCase()}
              </Text>
              <Text className={`w-28 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {formatDate(report.date)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className={`mt-8 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} items-center`}>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          This is a computer generated report for {data.dateRange}
        </Text>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Generated by Your Store Management System
        </Text>
        <Text className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          © {new Date().getFullYear()} All rights reserved
        </Text>
      </View>
    </View>
  );
};

export default ReportPrintPreview;