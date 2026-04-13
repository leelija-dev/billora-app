import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useMemo } from "react";
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useDashboard } from "../../hooks/useDashboard";
import Header from "../../components/common/Header";
import StatsCard from "../../components/dashboard/StatsCard";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems"; // Import the helper

const { width } = Dimensions.get("window");

const DashboardScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  
  // Use real API data instead of static data
  const { dashboardData, loading, error, refreshData } = useDashboard();
  
  const cardWidth = Math.min(200, width * 0.8);
  const gap = 16;
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [viewMode, setViewMode] = useState("grid");
  const [notificationCount] = useState(5);
  const [refreshing, setRefreshing] = useState(false);

  // Use real API data
  const data = dashboardData;

  // Safely access stats with default values and convert string numbers to actual numbers
  const stats = {
    totalRevenue: typeof data?.stats?.totalRevenue === 'string' ? parseFloat(data.stats.totalRevenue) : (data?.stats?.totalRevenue || 0),
    totalDue: typeof data?.stats?.totalDue === 'string' ? parseFloat(data.stats.totalDue) : (data?.stats?.totalDue || 0),
    totalOrders: typeof data?.stats?.totalOrders === 'string' ? parseInt(data.stats.totalOrders) : (data?.stats?.totalOrders || 0),
    totalCustomers: typeof data?.stats?.totalCustomers === 'string' ? parseInt(data.stats.totalCustomers) : (data?.stats?.totalCustomers || 0),
    totalProducts: typeof data?.stats?.totalProducts === 'string' ? parseInt(data.stats.totalProducts) : (data?.stats?.totalProducts || 0),
    revenueTrend: typeof data?.stats?.revenueTrend === 'string' ? parseFloat(data.stats.revenueTrend) : (data?.stats?.revenueTrend || 0),
    ordersTrend: typeof data?.stats?.ordersTrend === 'string' ? parseFloat(data.stats.ordersTrend) : (data?.stats?.ordersTrend || 0),
    customersTrend: typeof data?.stats?.customersTrend === 'string' ? parseFloat(data.stats.customersTrend) : (data?.stats?.customersTrend || 0),
    productsTrend: typeof data?.stats?.productsTrend === 'string' ? parseFloat(data.stats.productsTrend) : (data?.stats?.productsTrend || 0),
  };

  // Safely access and convert topProducts data
  const topProducts = (data?.topProducts || []).map(product => ({
    ...product,
    sales: typeof product.sales === 'string' ? parseFloat(product.sales) : (product.sales || 0),
    revenue: typeof product.revenue === 'string' ? parseFloat(product.revenue) : (product.revenue || 0),
  }));

  // Safely access and convert recentOrders data
  const recentOrders = (data?.recentOrders || []).map(order => ({
    ...order,
    total: typeof order.total === 'string' ? parseFloat(order.total) : (order.total || 0),
    items: order.items || [],
  }));

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  const formatNumber = (num) => {
    return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: "#FEF3C7", text: "#D97706", darkBg: "#92400E", darkText: "#FCD34D" },
      processing: { bg: "#DBEAFE", text: "#2563EB", darkBg: "#1E3A8A", darkText: "#93C5FD" },
      shipped: { bg: "#E0E7FF", text: "#4F46E5", darkBg: "#3730A3", darkText: "#A5B4FC" },
      delivered: { bg: "#D1FAE5", text: "#059669", darkBg: "#065F46", darkText: "#6EE7B7" },
      cancelled: { bg: "#FEE2E2", text: "#DC2626", darkBg: "#7F1D1D", darkText: "#FCA5A5" },
    };
    return colors[status] || colors.pending;
  };

  const getChartData = () => {
    if (!data?.revenueData) {
      return {
        labels: [],
        datasets: [{ data: [] }]
      };
    }

    const safeMapData = (array, valueKey, labelKey) => {
      if (!Array.isArray(array) || array.length === 0) {
        return { labels: [], data: [] };
      }
      
      const filtered = array.filter(item => 
        item && 
        typeof item[valueKey] === 'number' && 
        !isNaN(item[valueKey]) &&
        item[labelKey]
      );
      
      return {
        labels: filtered.map(item => item[labelKey]),
        data: filtered.map(item => item[valueKey])
      };
    };

    switch (selectedPeriod) {
      case "day": {
        const result = safeMapData(data.revenueData.daily, 'revenue', 'date');
        return {
          labels: result.labels,
          datasets: [{ data: result.data }]
        };
      }
      case "week": {
        const result = safeMapData(data.revenueData.weekly, 'revenue', 'week');
        return {
          labels: result.labels,
          datasets: [{ data: result.data }]
        };
      }
      case "month": {
        const result = safeMapData(data.revenueData.monthly, 'revenue', 'month');
        return {
          labels: result.labels,
          datasets: [
            {
              data: result.data,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        };
      }
      default:
        return {
          labels: [],
          datasets: [{ data: [] }],
        };
    }
  };

  const chartConfig = {
    backgroundColor: isDarkMode ? "#1F2937" : "#ffffff",
    backgroundGradientFrom: isDarkMode ? "#1F2937" : "#ffffff",
    backgroundGradientTo: isDarkMode ? "#1F2937" : "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#6366F1",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: isDarkMode ? "#374151" : "#E5E7EB",
      strokeWidth: 1,
    },
    formatYLabel: (value) => {
      const num = parseFloat(value);
      if (num >= 1000) {
        return `$${Math.round(num / 1000)}k`;
      }
      return `$${Math.round(num)}`;
    },
  };

  const onRefresh = () => {
    setRefreshing(true);
    refreshData();
    setRefreshing(false);
  };

  const handleNavigate = (screen, params = {}) => {
    navigation.navigate(screen, params);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleNotificationPress = () => {
    console.log("Notifications opened");
  };

  const handleSearchPress = () => {
    Alert.alert("Search", "Search functionality will be implemented here");
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => console.log("Logged out"),
      },
    ]);
  };

  // Navigation items for sidebar - Using centralized navigation items with safe values
  const navigationItems = useMemo(() => {
    // Create badges for this screen based on actual data with safe defaults
    const badges = {
      products: stats.totalProducts?.toString() || "0",
      customers: stats.totalCustomers?.toString() || "0",
      orders: stats.totalOrders?.toString() || "0",
      // You can add more badges as needed
    };
    
    // Get navigation items with badges
    return getNavigationItemsWithBadges(badges);
  }, [stats.totalProducts, stats.totalCustomers, stats.totalOrders]);

  // Show loading state if needed
  if (loading) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading...</Text>
      </View>
    );
  }

  // Show error state if needed
  if (error) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <Text className="text-red-500">Error: {error}</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-16`}>
      <Header
        title="Dashboard"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Dashboard"
        navigationItems={navigationItems}
        notificationCount={notificationCount}
        onNotificationPress={handleNotificationPress}
        onSearchPress={handleSearchPress}
        onLogout={handleLogout}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6366F1"]}
            tintColor="#6366F1"
          />
        }
      >
        {/* Welcome Banner */}
        <LinearGradient
          colors={["#6366F1", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="mx-4 mt-4 p-5 rounded-3xl"
          style={{
            shadowColor: "#6366F1",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
            borderRadius: 10
          }}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white/80 text-sm">Welcome back!</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {user?.name || "User"}
              </Text>
              <Text className="text-white/60 text-xs mt-2">
                Here's what's happening with your store today.
              </Text>
            </View>
            <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center">
              <Icon name="view-dashboard" size={32} color="white" />
            </View>
          </View>
        </LinearGradient>

        {/* Stats Cards - Horizontal Scroll */}
        <View className="px-4 mt-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap }}>
              <StatsCard
                icon="💰"
                title="Total Revenue"
                value={formatCurrency(stats.totalRevenue)}
                trend={stats.revenueTrend}
                gradient={["#6366F1", "#8B5CF6"]}
                style={{ width: cardWidth }}
              />
              <StatsCard
                icon="📋"
                title="Total Orders"
                value={formatNumber(stats.totalOrders)}
                trend={stats.ordersTrend}
                gradient={["#F59E0B", "#D97706"]}
                style={{ width: cardWidth }}
              />
              <StatsCard
                icon="👥"
                title="Customers"
                value={formatNumber(stats.totalCustomers)}
                trend={stats.customersTrend}
                gradient={["#10B981", "#059669"]}
                style={{ width: cardWidth }}
              />
              <StatsCard
                icon="📦"
                title="Products"
                value={formatNumber(stats.totalProducts)}
                trend={stats.productsTrend}
                gradient={["#EF4444", "#DC2626"]}
                style={{ width: cardWidth }}
              />
            </View>
          </ScrollView>
        </View>

        {/* Quick Stats Row */}
        <View className="flex-row justify-between px-4 mt-4">
          <View className={`rounded-xl p-4 flex-1 mr-2 border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Avg. Order Value
            </Text>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {formatCurrency(
                stats.totalRevenue / (stats.totalOrders || 1),
              )}
            </Text>
          </View>
          <View className={`rounded-xl p-4 flex-1 ml-2 border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Conversion Rate
            </Text>
            <Text className="text-xl font-bold text-green-600 mt-1">24.8%</Text>
          </View>
        </View>

        {/* Revenue Chart */}
        <View className={`mx-4 mt-6 p-4 rounded-3xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Revenue Overview
              </Text>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total: {formatCurrency(stats.totalRevenue)}
              </Text>
            </View>
            <View className={`flex-row p-1 rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {["day", "week", "month"].map((period) => (
                <TouchableOpacity
                  key={period}
                  onPress={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-xl ${
                    selectedPeriod === period 
                      ? isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                      : ''
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedPeriod === period
                        ? "text-indigo-600"
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <LineChart
            data={getChartData()}
            width={width - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              marginLeft: -16,
              borderRadius: 16,
            }}
            withDots={true}
            withShadow={false}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            segments={5}
          />
        </View>

        {/* Order Status */}
        <View className={`mx-4 mt-6 p-5 rounded-3xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Order Status
            </Text>
            <TouchableOpacity onPress={() => handleNavigate("Orders")}>
              <Text className="text-indigo-600 text-sm font-semibold">
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-around">
            {Object.entries(data?.orderStatus || {}).map(
              ([status, count]) => {
                const colors = getStatusColor(status);
                const bgColor = isDarkMode ? colors.darkBg : colors.bg;
                const textColor = isDarkMode ? colors.darkText : colors.text;
                
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => handleNavigate("Orders", { status })}
                    className="items-center"
                  >
                    <View
                      className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                      style={{ backgroundColor: bgColor }}
                    >
                      <Text
                        className="text-xl font-bold"
                        style={{ color: textColor }}
                      >
                        {count}
                      </Text>
                    </View>
                    <Text className={`text-xs capitalize ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>
        </View>

        {/* Top Products */}
        <View className={`mx-4 mt-6 p-5 rounded-3xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Top Products
            </Text>
            <TouchableOpacity onPress={() => handleNavigate("Products")}>
              <Text className="text-indigo-600 text-sm font-semibold">
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          {topProducts.map((product, index) => (
            <TouchableOpacity
              key={product.id}
              onPress={() =>
                handleNavigate("ProductDetail", { productId: product.id })
              }
              className={`flex-row items-center py-3 ${
                index !== topProducts.length - 1
                  ? isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-100'
                  : ''
              }`}
            >
              <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${
                isDarkMode ? 'bg-purple-900/30' : 'bg-indigo-100'
              }`}>
                <Text className={`font-bold ${isDarkMode ? 'text-purple-400' : 'text-indigo-600'}`}>
                  #{index + 1}
                </Text>
              </View>
              <View className="flex-1">
                <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {product.name}
                </Text>
                <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {product.sales} sales • {formatCurrency(product.revenue)}
                </Text>
              </View>
              <View className="flex-row items-center bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                <Ionicons name="trending-up" size={12} color="#059669" />
                <Text className="text-green-600 dark:text-green-400 text-xs font-semibold ml-1">
                  {product.trend}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <View className={`mx-4 mt-6 mb-8 p-5 rounded-3xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Orders
            </Text>
            <TouchableOpacity onPress={() => handleNavigate("Orders")}>
              <Text className="text-indigo-600 text-sm font-semibold">
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          {recentOrders.map((order, index) => {
            const colors = getStatusColor(order.status);
            const bgColor = isDarkMode ? colors.darkBg : colors.bg;
            const textColor = isDarkMode ? colors.darkText : colors.text;
            
            return (
              <TouchableOpacity
                key={order.id}
                onPress={() =>
                  handleNavigate("OrderDetail", { orderId: order.id })
                }
                className={`flex-row items-center py-3 ${
                  index !== recentOrders.length - 1
                    ? isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-100'
                    : ''
                }`}
              >
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  className="w-12 h-12 min-w-12 min-h-12 rounded-2xl items-center justify-center mr-3"
                  style={{ borderRadius: 40, overflow: 'hidden' }}
                >
                  <Text className="text-white font-bold">
                    #{order.orderNumber.slice(-3)}
                  </Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {order.customer.name}
                  </Text>
                  <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"} •{" "}
                    {formatCurrency(order.total)}
                  </Text>
                </View>
                <View
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: bgColor }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: textColor }}
                  >
                    {order.status}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;