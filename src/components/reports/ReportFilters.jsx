// components/reports/ReportFilters.js
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { formatDate } from "../../utils/dateFormatter";

const ReportFilters = ({
  visible,
  onClose,
  onApply,
  onReset,
  initialFilters,
  summary,
  isDarkMode,
}) => {
  const [filters, setFilters] = useState(
    initialFilters || {
      startDate: new Date(),
      endDate: new Date(),
      reportType: "all",
      groupBy: "day",
      showCharts: true,
    }
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const reportTypes = [
    { label: "All Reports", value: "all", icon: "file-document-multiple" },
    { label: "Sales", value: "sales", icon: "cash" },
    { label: "Purchases", value: "purchases", icon: "cart" },
    { label: "Inventory", value: "inventory", icon: "package" },
    { label: "Profits", value: "profits", icon: "chart-line" },
  ];

  const groupByOptions = [
    { label: "Daily", value: "day" },
    { label: "Weekly", value: "week" },
    { label: "Monthly", value: "month" },
    { label: "Quarterly", value: "quarter" },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      handleFilterChange("startDate", selectedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      handleFilterChange("endDate", selectedDate);
    }
  };

  const handleApply = () => {
    onApply({
      ...filters,
      startDate: formatDate(filters.startDate, 'YYYY-MM-DD'),
      endDate: formatDate(filters.endDate, 'YYYY-MM-DD'),
    });
  };

  const handleReset = () => {
    const today = new Date();
    setFilters({
      startDate: today,
      endDate: today,
      reportType: "all",
      groupBy: "day",
      showCharts: true,
    });
    onReset?.();
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "" && v !== "all" && v !== "day"
  ).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className={`rounded-t-3xl max-h-[90%] ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Header */}
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            className="flex-row justify-between items-center p-5 rounded-t-3xl"
          >
            <View>
              <Text className="text-xl font-semibold text-white">
                Filter Reports
              </Text>
              <Text className="text-white/80 text-sm mt-1">
                {activeFilterCount} active filters
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Content */}
          <ScrollView
            className="p-5 max-h-[70%]"
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Stats Summary */}
            {summary && (
              <View className={`p-4 rounded-xl mb-6 border ${
                isDarkMode 
                  ? 'bg-blue-900/30 border-blue-800' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <Text className={`text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-800'
                }`}>
                  Period Summary
                </Text>
                <View className="flex-row justify-between">
                  <View>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      Total Sales
                    </Text>
                    <Text className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-blue-800'
                    }`}>
                      ${summary.totalSales?.toLocaleString() || 0}
                    </Text>
                  </View>
                  <View>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      Total Profit
                    </Text>
                    <Text className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-blue-800'
                    }`}>
                      ${summary.totalProfit?.toLocaleString() || 0}
                    </Text>
                  </View>
                  <View>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      Orders
                    </Text>
                    <Text className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-blue-800'
                    }`}>
                      {summary.totalOrders || 0}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Date Range */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Date Range
              </Text>
              
              {/* Start Date */}
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(true)}
                className={`mb-3 p-4 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-100 border-gray-200'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Icon name="calendar-start" size={20} color="#3b82f6" />
                    <Text className={`ml-3 text-base ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {formatDate(filters.startDate, 'MMM DD, YYYY')}
                    </Text>
                  </View>
                  <Icon name="chevron-down" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>

              {/* End Date */}
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(true)}
                className={`p-4 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-100 border-gray-200'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Icon name="calendar-end" size={20} color="#3b82f6" />
                    <Text className={`ml-3 text-base ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {formatDate(filters.endDate, 'MMM DD, YYYY')}
                    </Text>
                  </View>
                  <Icon name="chevron-down" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Report Type */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Report Type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {reportTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => handleFilterChange("reportType", type.value)}
                    className={`flex-row items-center px-4 py-3 rounded-xl border ${
                      filters.reportType === type.value
                        ? "bg-blue-500 border-blue-600"
                        : isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <Icon
                      name={type.icon}
                      size={18}
                      color={filters.reportType === type.value ? "#ffffff" : "#9ca3af"}
                    />
                    <Text
                      className={`ml-2 text-sm ${
                        filters.reportType === type.value
                          ? "text-white"
                          : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Group By */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Group By
              </Text>
              <View className="flex-row gap-2">
                {groupByOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleFilterChange("groupBy", option.value)}
                    className={`flex-1 py-3 px-3 rounded-xl border ${
                      filters.groupBy === option.value
                        ? "bg-blue-500 border-blue-600"
                        : isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium text-center ${
                        filters.groupBy === option.value
                          ? "text-white"
                          : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Show Charts */}
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => handleFilterChange("showCharts", !filters.showCharts)}
                className={`flex-row items-center justify-between p-4 rounded-xl border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-100 border-gray-200'
                }`}
              >
                <View className="flex-row items-center">
                  <Icon name="chart-bar" size={20} color="#3b82f6" />
                  <Text className={`ml-3 text-base ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    Show Charts
                  </Text>
                </View>
                <View className={`w-12 h-6 rounded-full ${
                  filters.showCharts ? 'bg-blue-500' : 'bg-gray-400'
                } p-1`}>
                  <View className={`w-4 h-4 rounded-full bg-white transform ${
                    filters.showCharts ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Date Pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              value={filters.startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              maximumDate={filters.endDate}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={filters.endDate}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              minimumDate={filters.startDate}
              maximumDate={new Date()}
            />
          )}

          {/* Footer */}
          <View className={`flex-row gap-3 p-5 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <TouchableOpacity
              onPress={handleReset}
              className={`flex-1 py-4 rounded-xl items-center border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gray-200 border-gray-100'
              }`}
            >
              <Text className={`font-semibold ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Reset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              className="flex-1 bg-blue-500 py-4 rounded-xl items-center border border-blue-600"
            >
              <Text className="text-white font-semibold">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ReportFilters;