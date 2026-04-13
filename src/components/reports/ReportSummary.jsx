// components/reports/ReportSummary.js
import { View, Text, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";

const ReportSummary = ({ summary, isDarkMode, dateRange }) => {
  const {
    totalSales = 0,
    totalPurchases = 0,
    totalProfit = 0,
    totalOrders = 0,
    averageOrderValue = 0,
    totalItemsSold = 0,
    lowStockItems = 0,
  } = summary;

  const formatCurrency = (value) => {
    return `$${parseFloat(value || 0).toFixed(2)}`;
  };

  const summaryCards = [
    {
      id: 'sales',
      title: "Total Sales",
      value: formatCurrency(totalSales),
      icon: "cash",
      colors: ["#10b981", "#059669"],
    },
    {
      id: 'purchases',
      title: "Total Purchases",
      value: formatCurrency(totalPurchases),
      icon: "cart",
      colors: ["#f59e0b", "#d97706"],
    },
    {
      id: 'profit',
      title: "Total Profit",
      value: formatCurrency(totalProfit),
      icon: "chart-line",
      colors: ["#3b82f6", "#2563eb"],
    },
    {
      id: 'orders',
      title: "Orders",
      value: totalOrders.toString(),
      icon: "shopping",
      colors: ["#8b5cf6", "#7c3aed"],
    },
  ];

  // Calculate snap interval based on card width + margin
  const CARD_WIDTH = 200;
  const CARD_MARGIN = 12; // 3 * 4 = 12px (mr-3)
  const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

  return (
    <View className="px-4 py-3">
      {/* Date Range Indicator */}
      <View className={`flex-row items-center mb-4 p-3 rounded-xl shadow-sm ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <Icon name="calendar-clock" size={20} color="#3b82f6" />
        <Text className={`ml-2 text-base font-medium ${
          isDarkMode ? 'text-white' : 'text-gray-800'
        }`}>
          {dateRange || "Today"} Report
        </Text>
        <View className="ml-auto flex-row items-center">
          <Icon name="refresh" size={18} color="#9ca3af" />
          <Text className={`ml-1 text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Auto-updated
          </Text>
        </View>
      </View>

      {/* Horizontal Scrolling Summary Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-4"
       
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
      >
        {summaryCards.map((card, index) => (
          <View 
            key={card.id} 
            style={[
              {
                width: 200, // Fixed width instead of min-width
                marginRight: 12, // mr-3 = 12px
              },
              index === 0 && { marginLeft: 0 }
            ]}
          >
            <LinearGradient
              colors={card.colors}
              className="p-4 rounded-xl shadow-lg"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1,borderRadius:10 }} // Ensure gradient fills the View
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                  <Icon name={card.icon} size={20} color="#ffffff" />
                </View>
                <Text className="text-white/60 text-xs">This period</Text>
              </View>
              <Text className="text-white/80 text-xs font-medium">{card.title}</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {card.value}
              </Text>
              <View className="flex-row items-center mt-2">
                <Icon name="trending-up" size={16} color="#ffffff" />
                <Text className="text-white/80 text-xs ml-1">
                  vs last period
                </Text>
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      {/* Additional Stats */}
      <View className={`flex-row justify-between p-4 rounded-xl ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } shadow-sm`}>
        <View className="items-center flex-1">
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Avg Order Value
          </Text>
          <Text className={`text-lg font-bold mt-1 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {formatCurrency(averageOrderValue)}
          </Text>
        </View>
        
        <View className={`w-px h-10 mx-2 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`} />
        
        <View className="items-center flex-1">
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Items Sold
          </Text>
          <Text className={`text-lg font-bold mt-1 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {totalItemsSold}
          </Text>
        </View>
        
        <View className={`w-px h-10 mx-2 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`} />
        
        <View className="items-center flex-1">
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Low Stock
          </Text>
          <Text className={`text-lg font-bold mt-1 ${
            lowStockItems > 0 
              ? 'text-orange-500' 
              : isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {lowStockItems}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ReportSummary;