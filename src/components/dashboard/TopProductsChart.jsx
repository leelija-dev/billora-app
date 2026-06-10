// components/dashboard/TopProductsChart.js
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const TopProductsChart = ({ data = [], onViewAll }) => {
  const { isDarkMode } = useThemeStore();

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString("en-IN")}`;

  const renderProductItem = ({ item, index }) => (
    <TouchableOpacity 
      key={item.id} 
      className={`flex-row items-center py-3 ${index !== data.length - 1 ? (isDarkMode ? "border-b border-gray-700" : "border-b border-gray-100") : ""}`}
    >
      <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${isDarkMode ? "bg-purple-900/30" : "bg-indigo-100"}`}>
        <Text className={`font-bold ${isDarkMode ? "text-purple-400" : "text-indigo-600"}`}>#{index + 1}</Text>
      </View>
      <View className="flex-1">
        <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{item.name}</Text>
        <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{item.sales} sales • {formatCurrency(item.revenue)}</Text>
      </View>
      <View className="flex-row items-center bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
        <Icon name="trending-up" size={12} color="#059669" />
        <Text className="text-green-600 dark:text-green-400 text-xs font-semibold ml-1">{item.trend}</Text>
      </View>
    </TouchableOpacity>
  );

  if (data.length === 0) {
    return (
      <View className={`mx-4 mt-6 p-4 rounded-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Top Products</Text>
          {onViewAll && (
            <TouchableOpacity onPress={onViewAll}>
              <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">View All →</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="py-8 items-center">
          <Text className={isDarkMode ? "text-gray-400" : "text-gray-500"}>No product data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`mx-4 mt-6 p-4 rounded-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Top Products</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">View All →</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={data.slice(0, 5)}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        scrollEnabled={false}
      />
    </View>
  );
};

export default TopProductsChart;