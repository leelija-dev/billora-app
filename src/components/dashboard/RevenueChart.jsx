// components/dashboard/RevenueChart.js
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useThemeStore } from "../../store/themeStore";

const { width: screenWidth } = Dimensions.get("window");

const RevenueChart = ({ data = [], period = "7d" }) => {
  const { isDarkMode } = useThemeStore();

  const chartData = {
    labels: data.map(item => {
      if (period === "7d") return item.date?.split("-")[2] || "";
      if (period === "30d") return `W${item.week || ""}`;
      return item.month?.substring(0, 3) || "";
    }),
    datasets: [{ data: data.map(item => item.revenue || 0) }],
  };

  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const averageRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString("en-IN")}`;

  const chartConfig = {
    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
    backgroundGradientFrom: isDarkMode ? "#1F2937" : "#FFFFFF",
    backgroundGradientTo: isDarkMode ? "#1F2937" : "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#6366F1" },
    formatYLabel: (value) => {
      const num = parseFloat(value);
      if (num >= 1000) return `₹${Math.round(num / 1000)}k`;
      return `₹${Math.round(num)}`;
    },
  };

  if (data.length === 0) {
    return (
      <View className={`mx-4 mt-6 p-4 rounded-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        <Text className={`text-lg font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Revenue Overview</Text>
        <View className="h-[220px] items-center justify-center">
          <Text className={isDarkMode ? "text-gray-400" : "text-gray-500"}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`mx-4 mt-6 p-4 rounded-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
      <View className="mb-4">
        <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Revenue Overview</Text>
        <View className="flex-row mt-2">
          <View className="flex-1">
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total</Text>
            <Text className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{formatCurrency(totalRevenue)}</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Average</Text>
            <Text className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{formatCurrency(averageRevenue)}</Text>
          </View>
        </View>
      </View>
      <LineChart
        data={chartData}
        width={screenWidth - 64}
        height={220}
        chartConfig={chartConfig}
        bezier
        withInnerLines
        withOuterLines
        withDots
        withShadow={false}
        segments={4}
      />
    </View>
  );
};

export default RevenueChart;