// components/dashboard/OrderStatusChart.js
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import { useThemeStore } from "../../store/themeStore";

const { width: screenWidth } = Dimensions.get("window");

const OrderStatusChart = ({ data = {} }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();

  const statusColors = {
    completed: "#10B981",
    pending: "#F59E0B",
    processing: "#3B82F6",
    cancelled: "#EF4444",
    shipped: "#8B5CF6",
  };

  const pieData = Object.entries(data).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    population: value,
    color: statusColors[key] || "#6B7280",
    legendFontColor: isDarkMode ? "#9CA3AF" : "#4B5563",
    legendFontSize: 12,
  }));

  const totalOrders = Object.values(data).reduce((sum, val) => sum + val, 0);

  const handleStatusPress = (status) => {
    navigation.navigate("Orders", { status: status.toLowerCase() });
  };

  if (totalOrders === 0) {
    return (
      <View className={`mx-4 mt-6 p-4 rounded-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        <Text className={`text-lg font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Order Status</Text>
        <View className="h-[200px] items-center justify-center">
          <Text className={isDarkMode ? "text-gray-400" : "text-gray-500"}>No order data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`mx-4 mt-6 p-4 rounded-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
      <Text className={`text-lg font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Order Status</Text>
      <PieChart
        data={pieData}
        width={screenWidth - 64}
        height={200}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
      <View className="flex-row flex-wrap justify-center mt-4">
        {pieData.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleStatusPress(item.name)}
            className="flex-row items-center mx-2 mb-2"
          >
            <View className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: item.color }} />
            <Text className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              {item.name}: {item.population}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default OrderStatusChart;