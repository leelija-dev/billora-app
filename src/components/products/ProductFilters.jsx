// components/products/ProductFilters.js
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
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

const ProductFilters = ({
  visible,
  onClose,
  onApply,
  onReset,
  initialFilters,
  stats,
}) => {
  const { isDarkMode } = useThemeStore();
  const [filters, setFilters] = useState(
    initialFilters || {
      minPrice: "",
      maxPrice: "",
      inStock: null,
      sortBy: "name",
      sortOrder: "asc",
      supplier: "",
      brand: "",
    },
  );

  const sortOptions = [
    { label: "Name", value: "name", icon: "sort-ascending" },
    { label: "Price", value: "price", icon: "currency-usd" },
    { label: "Stock", value: "stock", icon: "package" },
    { label: "Rating", value: "rating", icon: "star" },
  ];

  const stockOptions = [
    { label: "All", value: null },
    { label: "In Stock", value: true },
    { label: "Out of Stock", value: false },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      inStock: null,
      sortBy: "name",
      sortOrder: "asc",
      supplier: "",
      brand: "",
    });
    onReset();
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "",
  ).length;

  const getStockButtonStyle = (optionValue) => {
    const isActive = filters.inStock === optionValue;
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
                Filter Products
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
            {stats && (
              <View className={`p-4 rounded-xl mb-6 border ${
                isDarkMode 
                  ? 'bg-blue-900/30 border-blue-800' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <Text className={`text-sm font-semibold mb-2 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-800'
                }`}>
                  Quick Overview
                </Text>
                <View className="flex-row justify-between">
                  <View>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      Total Products
                    </Text>
                    <Text className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-blue-800'
                    }`}>
                      {stats.total || 0}
                    </Text>
                  </View>
                  <View>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      Total Value
                    </Text>
                    <Text className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-blue-800'
                    }`}>
                      ${stats.totalValue?.toLocaleString() || 0}
                    </Text>
                  </View>
                  <View>
                    <Text className={`text-xs ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      Low Stock
                    </Text>
                    <Text className="text-lg font-bold text-orange-600">
                      {stats.lowStock || 0}
                    </Text>
                  </View>
                </View>
              </View>
            )}

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
                    onPress={() => handleFilterChange("sortBy", option.value)}
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
              <View className="flex-row gap-2">
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

            {/* Price Range */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Price Range
              </Text>
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text className={`text-xs mb-1 font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Min ($)
                  </Text>
                  <TextInput
                    value={filters.minPrice}
                    onChangeText={(value) =>
                      handleFilterChange("minPrice", value)
                    }
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
                <Text className={`text-lg font-bold ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  -
                </Text>
                <View className="flex-1">
                  <Text className={`text-xs mb-1 font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Max ($)
                  </Text>
                  <TextInput
                    value={filters.maxPrice}
                    onChangeText={(value) =>
                      handleFilterChange("maxPrice", value)
                    }
                    placeholder="1000"
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

            {/* Stock Status */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Stock Status
              </Text>
              <View className="flex-row gap-2">
                {stockOptions.map((option) => {
                  const styles = getStockButtonStyle(option.value);
                  return (
                    <TouchableOpacity
                      key={option.label}
                      onPress={() =>
                        handleFilterChange("inStock", option.value)
                      }
                      className={styles.buttonClass}
                    >
                      <Text className={styles.textClass}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Supplier Filter */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Supplier
              </Text>
              <TextInput
                value={filters.supplier}
                onChangeText={(value) => handleFilterChange("supplier", value)}
                placeholder="Enter supplier name..."
                placeholderTextColor={isDarkMode ? '#6B7280' : '#9ca3af'}
                className={`rounded-xl px-4 py-3 border ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-gray-200 text-gray-800 border-gray-100'
                }`}
              />
            </View>

            {/* Brand Filter */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Brand
              </Text>
              <TextInput
                value={filters.brand}
                onChangeText={(value) => handleFilterChange("brand", value)}
                placeholder="Enter brand name..."
                placeholderTextColor={isDarkMode ? '#6B7280' : '#9ca3af'}
                className={`rounded-xl px-4 py-3 border ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-gray-200 text-gray-800 border-gray-100'
                }`}
              />
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

export default ProductFilters;