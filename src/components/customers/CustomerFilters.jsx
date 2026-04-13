import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const CustomerFilters = ({
  visible,
  onClose,
  onApply,
  onReset,
  initialFilters,
}) => {
  const { isDarkMode } = useThemeStore();
  const [filters, setFilters] = useState(
    initialFilters || {
      dueStatus: "all",
      minDue: "",
      maxDue: "",
      sortBy: "name",
      sortOrder: "asc",
      dateRange: "all",
      city: "",
    }
  );

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const sortOptions = [
    { label: "Name", value: "name", icon: "sort-alphabetical" },
    { label: "Due Amount", value: "due", icon: "cash" },
    { label: "Date", value: "date", icon: "calendar" },
    { label: "City", value: "city", icon: "map-marker" },
  ];

  const dueStatusOptions = [
    { label: "All", value: "all" },
    { label: "Has Due", value: "hasDue" },
    { label: "No Due", value: "noDue" },
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
      dueStatus: "all",
      minDue: "",
      maxDue: "",
      sortBy: "name",
      sortOrder: "asc",
      dateRange: "all",
      city: "",
    };
    setFilters(resetFilters);
    onReset();
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "" && v !== "all" && v !== null,
  ).length;

  const getStatusButtonStyle = (optionValue) => {
    const isActive = filters.dueStatus === optionValue;
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

  const getDateRangeButtonStyle = (optionValue) => {
    const isActive = filters.dateRange === optionValue;
    return {
      buttonClass: `flex-1 py-2 px-2 rounded-lg ${
        isActive 
          ? "bg-blue-500" 
          : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
      }`,
      textClass: `text-xs font-medium text-center ${
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
                Filter Customers
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

            {/* Due Status Filter */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Due Status
              </Text>
              <View className="flex-row gap-2">
                {dueStatusOptions.map((option) => {
                  const styles = getStatusButtonStyle(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleFilterChange("dueStatus", option.value)}
                      className={styles.buttonClass}
                    >
                      <Text className={styles.textClass}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Due Amount Range */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Due Amount Range
              </Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className={`text-xs mb-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Min ($)
                  </Text>
                  <TextInput
                    value={filters.minDue}
                    onChangeText={(value) => handleFilterChange("minDue", value)}
                    placeholder="0"
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9ca3af'}
                    keyboardType="numeric"
                    className={`rounded-xl px-4 py-3 border ${
                      isDarkMode 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-gray-200 text-gray-800 border-gray-100'
                    }`}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-xs mb-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Max ($)
                  </Text>
                  <TextInput
                    value={filters.maxDue}
                    onChangeText={(value) => handleFilterChange("maxDue", value)}
                    placeholder="Any"
                    placeholderTextColor={isDarkMode ? '#6B7280' : '#9ca3af'}
                    keyboardType="numeric"
                    className={`rounded-xl px-4 py-3 border ${
                      isDarkMode 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-gray-200 text-gray-800 border-gray-100'
                    }`}
                  />
                </View>
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
                placeholder="Enter city name"
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
                Registration Date
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {dateRangeOptions.map((option) => {
                  const styles = getDateRangeButtonStyle(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleFilterChange("dateRange", option.value)}
                      className={styles.buttonClass}
                    >
                      <Text className={styles.textClass}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
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

export default CustomerFilters;