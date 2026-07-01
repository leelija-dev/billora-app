import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  DatePickerIOS,
  DatePickerAndroid,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const StoreFilters = ({
  visible,
  onClose,
  onApply,
  onReset,
  initialFilters,
}) => {
  const { isDarkMode } = useThemeStore();
  const [filters, setFilters] = useState(
    initialFilters || {
      status: "all",
      city: "",
      hasGst: null,
      sortBy: "name",
      sortOrder: "asc",
      dateRange: "all",
      startDate: "",
      endDate: "",
    }
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const sortOptions = [
    { label: "Name", value: "name", icon: "sort-alphabetical" },
    { label: "Date", value: "date", icon: "calendar" },
    { label: "City", value: "city", icon: "city" },
    { label: "Status", value: "status", icon: "checkbox-marked-circle-outline" },
  ];

  const statusOptions = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const dateRangeOptions = [
    { label: "All Time", value: "all" },
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Year", value: "year" },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      status: "all",
      city: "",
      hasGst: null,
      sortBy: "name",
      sortOrder: "asc",
      dateRange: "all",
      startDate: "",
      endDate: "",
    };
    setFilters(resetFilters);
    onReset();
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleFilterChange("startDate", formattedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleFilterChange("endDate", formattedDate);
    }
  };

  const showStartDatePickerAsync = async () => {
    if (Platform.OS === 'android') {
      try {
        const { action, year, month, day } = await DatePickerAndroid.open({
          mode: 'calendar',
        });
        if (action !== DatePickerAndroid.dismissedAction) {
          const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          handleFilterChange("startDate", formattedDate);
        }
      } catch ({ code, message }) {
        console.warn('Cannot open date picker', message);
      }
    } else {
      setShowStartDatePicker(true);
    }
  };

  const showEndDatePickerAsync = async () => {
    if (Platform.OS === 'android') {
      try {
        const { action, year, month, day } = await DatePickerAndroid.open({
          mode: 'calendar',
        });
        if (action !== DatePickerAndroid.dismissedAction) {
          const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          handleFilterChange("endDate", formattedDate);
        }
      } catch ({ code, message }) {
        console.warn('Cannot open date picker', message);
      }
    } else {
      setShowEndDatePicker(true);
    }
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "" && v !== "all" && v !== null,
  ).length;

  const getStatusButtonStyle = (optionValue) => {
    const isActive = filters.status === optionValue;
    return {
      buttonClass: `flex-1 py-3 px-3 rounded-xl ${
        isActive 
          ? "bg-blue-500" 
          : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
      }`,
      textClass: `text-sm font-medium text-center ${
        isActive 
          ? "text-white" 
          : isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`,
    };
  };

  const getGstButtonStyle = (optionValue) => {
    const isActive = filters.hasGst === optionValue;
    return {
      buttonClass: `flex-1 py-3 px-3 rounded-xl ${
        isActive 
          ? "bg-blue-500" 
          : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
      }`,
      textClass: `text-sm font-medium text-center ${
        isActive 
          ? "text-white" 
          : isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`,
    };
  };

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
                Filter Stores
              </Text>
              <Text className="text-white/80 text-sm mt-1">
                {activeFilterCount} active {activeFilterCount === 1 ? 'filter' : 'filters'}
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
            {/* Sort By */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Sort By
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      handleFilterChange("sortBy", option.value);
                      handleFilterChange("sortOrder", "asc");
                    }}
                    className={`flex-1 flex-row items-center justify-center py-3 px-3 rounded-xl border ${
                      filters.sortBy === option.value
                        ? "bg-blue-500 border-blue-600"
                        : isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-gray-200 border-gray-100'
                    }`}
                  >
                    <Icon
                      name={option.icon}
                      size={18}
                      color={
                        filters.sortBy === option.value 
                          ? "#ffffff" 
                          : isDarkMode ? '#9CA3AF' : '#4b5563'
                      }
                    />
                    <Text
                      className={`text-sm font-medium ml-2 ${
                        filters.sortBy === option.value
                          ? "text-white"
                          : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort Order */}
              <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                  onPress={() => handleFilterChange("sortOrder", "asc")}
                  className={`flex-1 flex-row items-center justify-center py-3 px-3 rounded-xl border ${
                    filters.sortOrder === "asc"
                      ? "bg-blue-500 border-blue-600"
                      : isDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-200 border-gray-100'
                  }`}
                >
                  <Icon
                    name="sort-ascending"
                    size={18}
                    color={
                      filters.sortOrder === "asc" 
                        ? "#ffffff" 
                        : isDarkMode ? '#9CA3AF' : '#4b5563'
                    }
                  />
                  <Text
                    className={`text-sm font-medium ml-2 ${
                      filters.sortOrder === "asc"
                        ? "text-white"
                        : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Ascending
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleFilterChange("sortOrder", "desc")}
                  className={`flex-1 flex-row items-center justify-center py-3 px-3 rounded-xl border ${
                    filters.sortOrder === "desc"
                      ? "bg-blue-500 border-blue-600"
                      : isDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-200 border-gray-100'
                  }`}
                >
                  <Icon
                    name="sort-descending"
                    size={18}
                    color={
                      filters.sortOrder === "desc" 
                        ? "#ffffff" 
                        : isDarkMode ? '#9CA3AF' : '#4b5563'
                    }
                  />
                  <Text
                    className={`text-sm font-medium ml-2 ${
                      filters.sortOrder === "desc"
                        ? "text-white"
                        : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    Descending
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Filter */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Status
              </Text>
              <View className="flex-row gap-2">
                {statusOptions.map((option) => {
                  const styles = getStatusButtonStyle(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleFilterChange("status", option.value)}
                      className={styles.buttonClass}
                    >
                      <Text className={styles.textClass}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* GST Filter */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                GST Availability
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleFilterChange("hasGst", null)}
                  className={`flex-1 py-3 px-3 rounded-xl ${
                    filters.hasGst === null
                      ? "bg-blue-500"
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium text-center ${
                      filters.hasGst === null
                        ? "text-white"
                        : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    All
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleFilterChange("hasGst", true)}
                  className={`flex-1 py-3 px-3 rounded-xl ${
                    filters.hasGst === true
                      ? "bg-blue-500"
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium text-center ${
                      filters.hasGst === true
                        ? "text-white"
                        : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    With GST
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleFilterChange("hasGst", false)}
                  className={`flex-1 py-3 px-3 rounded-xl ${
                    filters.hasGst === false
                      ? "bg-blue-500"
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium text-center ${
                      filters.hasGst === false
                        ? "text-white"
                        : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    No GST
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* City Filter */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                City
              </Text>
              <TextInput
                value={filters.city}
                onChangeText={(value) => handleFilterChange("city", value)}
                placeholder="Enter city name..."
                placeholderTextColor={isDarkMode ? '#6B7280' : '#9ca3af'}
                className={`rounded-xl px-4 py-3 border ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-gray-200 text-gray-800 border-gray-100'
                }`}
              />
            </View>

            {/* Date Range Filter */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Date Range
              </Text>
              
              {/* Start Date */}
              <View className="mb-3">
                <Text className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Start Date
                </Text>
                <TouchableOpacity
                  onPress={showStartDatePickerAsync}
                  className={`flex-row items-center justify-between px-4 py-3 rounded-xl border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-100'
                  }`}
                >
                  <Text className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                    {filters.startDate || 'Select start date'}
                  </Text>
                  <Icon name="calendar" size={20} color={isDarkMode ? '#9CA3AF' : '#4B5563'} />
                </TouchableOpacity>
                {Platform.OS === 'ios' && showStartDatePicker && (
                  <DatePickerIOS
                    date={filters.startDate ? new Date(filters.startDate) : new Date()}
                    onDateChange={handleStartDateChange}
                    mode="date"
                  />
                )}
              </View>

              {/* End Date */}
              <View>
                <Text className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  End Date
                </Text>
                <TouchableOpacity
                  onPress={showEndDatePickerAsync}
                  className={`flex-row items-center justify-between px-4 py-3 rounded-xl border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-100'
                  }`}
                >
                  <Text className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                    {filters.endDate || 'Select end date'}
                  </Text>
                  <Icon name="calendar" size={20} color={isDarkMode ? '#9CA3AF' : '#4B5563'} />
                </TouchableOpacity>
                {Platform.OS === 'ios' && showEndDatePicker && (
                  <DatePickerIOS
                    date={filters.endDate ? new Date(filters.endDate) : new Date()}
                    onDateChange={handleEndDateChange}
                    mode="date"
                  />
                )}
              </View>
            </View>
          </ScrollView>

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
                Reset All
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

export default StoreFilters;