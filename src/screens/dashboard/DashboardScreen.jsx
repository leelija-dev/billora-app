// screens/DashboardScreen.js
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as XLSX from "xlsx";
import { dashboardAPI } from "../../api/dashboard";
import Header from "../../components/common/Header";
import OrderStatusChart from "../../components/dashboard/OrderStatusChart";
import RecentOrdersTable from "../../components/dashboard/RecentOrdersTable";
import RevenueChart from "../../components/dashboard/RevenueChart";
import StatsCard from "../../components/dashboard/StatsCard";
import TopProductsChart from "../../components/dashboard/TopProductsChart";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore, MENU_ITEMS } from "../../store/permissionStore";

const { width: screenWidth } = Dimensions.get("window");

const DashboardScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useThemeStore();
  const { user, company } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();
  const navigation = useNavigation();

  const [timeRange, setTimeRange] = useState("7d");
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    products: 0,
    customers: 0,
    lowStock: 0,
    revenueChange: null,
    ordersChange: null,
    productsChange: null,
    customersChange: null,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesDistribution, setSalesDistribution] = useState([]);
  const [orderStatus, setOrderStatus] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notificationCount] = useState(5);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const exportDropdownRef = useRef(null);

  // Get filtered menu items from permission store (like desktop)
  const menuItems = useMemo(() => {
    const filtered = getFilteredMenuItems();
    // Convert to format expected by Header
    return filtered.map(item => ({
      id: item.id,
      title: item.name,
      screen: item.screen,
      icon: item.icon,
      iconActive: item.iconActive,
      badge: item.badge || null,
    }));
  }, [getFilteredMenuItems]);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      console.warn("User not authenticated, skipping dashboard data fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await dashboardAPI.getOverview(user.id, timeRange);
      const data = response;

      const normalizedStats = {
        revenue: parseFloat(data?.stats?.totalRevenue || 0),
        orders: parseInt(data?.stats?.totalOrders || 0),
        products: parseInt(data?.stats?.totalProducts || 0),
        customers: parseInt(data?.stats?.totalCustomers || 0),
        lowStock: parseInt(data?.stats?.lowStock || 0),
        revenueChange: data?.stats?.revenueTrend ?? null,
        ordersChange: data?.stats?.ordersTrend ?? null,
        productsChange: data?.stats?.productsTrend ?? null,
        customersChange: data?.stats?.customersTrend ?? null,
      };

      const processedRevenueData = (data?.revenueData?.daily || []).map(
        (item) => ({
          date: item.date || "",
          revenue: parseFloat(item.revenue || 0),
        }),
      );

      const processedTopProducts = (data?.topProducts || []).map((item) => ({
        id: item.id,
        name: item.name || "",
        sales: parseFloat(item.sales || 0),
        revenue: parseFloat(item.revenue || 0),
        trend: item.trend || "+0%",
      }));

      const processedRecentOrders = (data?.recentOrders || []).map((item) => ({
        ...item,
        total: parseFloat(item.total || 0),
      }));

      setStats(normalizedStats);
      setRevenueData(processedRevenueData);
      setRecentOrders(processedRecentOrders);
      setSalesDistribution(data?.salesDistribution || []);
      setOrderStatus(data?.orderStatus || {});
      setTopProducts(processedTopProducts);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoadDone(true);
    }
  }, [user?.id, timeRange]);

  useEffect(() => {
    if (user?.id && !initialLoadDone) {
      fetchDashboardData();
    }
  }, [user?.id, initialLoadDone, fetchDashboardData]);

  useEffect(() => {
    if (initialLoadDone && user?.id) {
      fetchDashboardData();
    }
  }, [timeRange, initialLoadDone, user?.id, fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleNavigate = (screen, params = {}) => {
    navigation.navigate(screen, params);
  };

  const handleNotificationPress = () => {
    console.log("Notifications opened");
  };

  const handleSearchPress = () => {
    Alert.alert("Search", "Search functionality will be implemented here");
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          // The actual logout is handled by the Header component
          console.log("Logged out");
        },
      },
    ]);
  };

  // Export functions
  const exportData = {
    stats,
    revenueData,
    topProducts,
    recentOrders,
    company: company || user,
    timeRange,
    generatedAt: new Date().toISOString(),
  };

  const generateExportHTML = () => {
    const formatCurrency = (amount) =>
      `₹${(amount || 0).toLocaleString("en-IN")}`;
    const currentDate = new Date().toLocaleString();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Dashboard Report - ${currentDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { background: linear-gradient(135deg, #6366F1, #8B5CF6); padding: 30px; border-radius: 10px; color: white; margin-bottom: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #6366F1; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #6366F1; color: white; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dashboard Report</h1>
            <p>Generated on: ${currentDate}</p>
            <p>Period: ${timeRange === "7d" ? "Last 7 Days" : timeRange === "30d" ? "Last 30 Days" : timeRange === "90d" ? "Last 3 Months" : "Last 12 Months"}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card"><h3>Total Revenue</h3><div class="stat-value">${formatCurrency(stats.revenue)}</div></div>
            <div class="stat-card"><h3>Total Orders</h3><div class="stat-value">${stats.orders}</div></div>
            <div class="stat-card"><h3>Products</h3><div class="stat-value">${stats.products}</div></div>
            <div class="stat-card"><h3>Customers</h3><div class="stat-value">${stats.customers}</div></div>
          </div>
          
          <h2>Top Products</h2>
          <table><thead><tr><th>Product</th><th>Sales</th><th>Revenue</th></tr></thead><tbody>
            ${topProducts.map((p) => `<tr><td>${p.name}</td><td>${p.sales}</td><td>${formatCurrency(p.revenue)}</td></tr>`).join("")}
          </tbody></table>
          
          <h2>Recent Orders</h2>
          <table><thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>
            ${recentOrders.map((o) => `<tr><td>#${o.orderNumber}</td><td>${o.customer?.name}</td><td>${formatCurrency(o.total)}</td><td>${o.status}</td></tr>`).join("")}
          </tbody></table>
          
          <div class="footer"><p>Confidential - For Internal Use Only</p></div>
        </body>
      </html>
    `;
  };

  const handlePDFExport = async () => {
    try {
      setExporting(true);
      const html = generateExportHTML();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      setShowExportDropdown(false);
    } catch (error) {
      Alert.alert("Error", "Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleExcelExport = async () => {
    try {
      setExporting(true);
      const wsData = [
        ["Dashboard Report", new Date().toLocaleString()],
        [],
        ["Metric", "Value"],
        ["Total Revenue", stats.revenue],
        ["Total Orders", stats.orders],
        ["Products", stats.products],
        ["Customers", stats.customers],
        [],
        ["Top Products", "", ""],
        ["Product Name", "Sales", "Revenue"],
        ...topProducts.map((p) => [p.name, p.sales, p.revenue]),
        [],
        ["Recent Orders", "", "", ""],
        ["Order #", "Customer", "Amount", "Status"],
        ...recentOrders.map((o) => [
          o.orderNumber,
          o.customer?.name,
          o.total,
          o.status,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dashboard");
      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      const filePath = `${FileSystem.documentDirectory}dashboard_${Date.now()}.xlsx`;
      await FileSystem.writeAsStringAsync(filePath, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(filePath);
      setShowExportDropdown(false);
    } catch (error) {
      Alert.alert("Error", "Failed to export Excel");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const html = generateExportHTML();
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert("Error", "Failed to print");
    } finally {
      setIsPrinting(false);
    }
  };

  // Time range options
  const timeRangeOptions = [
    { id: "7d", label: "Last 7 Days" },
    { id: "30d", label: "Last 30 Days" },
    { id: "90d", label: "Last 3 Months" },
    { id: "12m", label: "Last 12 Months" },
  ];

  const getSelectedRangeLabel = () => {
    const option = timeRangeOptions.find((opt) => opt.id === timeRange);
    return option?.label || "Last 7 Days";
  };

  if (loading && !initialLoadDone) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} pb-16`}>
      <Header
        title="Dashboard"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Dashboard"
        navigationItems={menuItems}
        notificationCount={notificationCount}
        onNotificationPress={handleNotificationPress}
        onSearchPress={handleSearchPress}
        onLogout={handleLogout}
        rightComponent={
          <View className="flex-row items-center">
            {/* Export Dropdown */}
            <View>
              <TouchableOpacity
                onPress={() => setShowExportDropdown(!showExportDropdown)}
                className="px-3 py-2 bg-indigo-500 rounded-xl flex-row items-center"
                disabled={exporting}
              >
                <Icon name="export" size={18} color="white" />
                <Text className="text-white text-sm ml-1">Export</Text>
              </TouchableOpacity>

              {showExportDropdown && (
                <View className={`absolute right-0 top-12 rounded-xl overflow-hidden shadow-lg z-50 ${isDarkMode ? "bg-gray-800" : "bg-white"}`} style={{ minWidth: 150 }}>
                  <TouchableOpacity onPress={handlePDFExport} className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <Icon name="file-pdf-box" size={20} color="#ef4444" />
                    <Text className={`ml-3 font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleExcelExport} className="flex-row items-center px-4 py-3">
                    <Icon name="microsoft-excel" size={20} color="#10b981" />
                    <Text className={`ml-3 font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>Excel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        }
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
          style={{borderRadius:14}}
          className="mx-4 mt-4 p-5 rounded-3xl"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white/80 text-sm">Welcome back!</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {company?.name || user?.name || "User"}
              </Text>
              <Text className="text-white/60 text-xs mt-2">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center">
              <Icon name="view-dashboard" size={32} color="white" />
            </View>
          </View>
        </LinearGradient>

        {/* Time Range Filter Section */}
        <View className={`mx-4 mt-6 p-4 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
          <View className="flex-row items-center mb-3">
            <Icon name="calendar-range" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text className={`text-sm font-medium ml-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Filter by Time Period
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {timeRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setTimeRange(option.id)}
                  className={`px-4 py-2 rounded-full ${
                    timeRange === option.id
                      ? "bg-indigo-500"
                      : isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    timeRange === option.id ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View className={`mt-3 pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
            <View className="flex-row justify-between items-center">
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Showing data for: <Text className="font-semibold">{getSelectedRangeLabel()}</Text>
              </Text>
              <TouchableOpacity onPress={handleRefresh} className="flex-row items-center">
                <Icon name="refresh" size={16} color="#6366F1" />
                <Text className="text-indigo-500 text-xs ml-1">Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="px-4 mt-6">
          <View className="flex-row flex-wrap justify-between">
            <StatsCard
              title="Total Revenue"
              value={`₹${(stats.revenue || 0).toLocaleString("en-IN")}`}
              icon="currency-inr"
              trend={stats.revenueChange}
              color="#10B981"
              style={{ width: "48%", marginBottom: 12 }}
            />
            <StatsCard
              title="Total Orders"
              value={(stats.orders || 0).toLocaleString()}
              icon="shopping-bag"
              trend={stats.ordersChange}
              color="#3B82F6"
              style={{ width: "48%", marginBottom: 12 }}
            />
            <StatsCard
              title="Products"
              value={(stats.products || 0).toLocaleString()}
              icon="package-variant"
              trend={stats.productsChange}
              color="#8B5CF6"
              style={{ width: "48%" }}
            />
            <StatsCard
              title="Customers"
              value={(stats.customers || 0).toLocaleString()}
              icon="account-group"
              trend={stats.customersChange}
              color="#F59E0B"
              style={{ width: "48%" }}
            />
          </View>
        </View>

        {/* Low Stock Alert */}
        {stats.lowStock > 0 && (
          <View className="mx-4 mt-4 p-4 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <View className="flex-row items-center">
              <Icon name="alert-circle" size={24} color="#D97706" />
              <View className="flex-1 ml-3">
                <Text className="font-semibold text-yellow-800 dark:text-yellow-400">Low Stock Alert!</Text>
                <Text className="text-sm text-yellow-700 dark:text-yellow-500">
                  You have {stats.lowStock} products running low on stock.
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleNavigate("Products")}>
                <Text className="text-yellow-700 dark:text-yellow-400 text-sm font-semibold">View →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Revenue Chart */}
        <RevenueChart data={revenueData} period={timeRange} />

        {/* Order Status Chart */}
        <OrderStatusChart data={orderStatus} />

        {/* Top Products */}
        <TopProductsChart data={topProducts} onViewAll={() => handleNavigate("Products")} />

        {/* Recent Orders Table */}
        <RecentOrdersTable orders={recentOrders} onViewAll={() => handleNavigate("Orders")} />
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;