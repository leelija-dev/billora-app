// components/dashboard/RecentOrdersTable.js
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useThemeStore } from "../../store/themeStore";

const RecentOrdersTable = ({ orders = [], onViewAll }) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();

  const formatCurrency = (amount) => `₹${(amount || 0).toLocaleString("en-IN")}`;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    const colors = {
      completed: { bg: "#D1FAE5", text: "#059669", darkBg: "#065F46", darkText: "#6EE7B7" },
      delivered: { bg: "#D1FAE5", text: "#059669", darkBg: "#065F46", darkText: "#6EE7B7" },
      pending: { bg: "#FEF3C7", text: "#D97706", darkBg: "#92400E", darkText: "#FCD34D" },
      processing: { bg: "#DBEAFE", text: "#2563EB", darkBg: "#1E3A8A", darkText: "#93C5FD" },
      shipped: { bg: "#E0E7FF", text: "#4F46E5", darkBg: "#3730A3", darkText: "#A5B4FC" },
      cancelled: { bg: "#FEE2E2", text: "#DC2626", darkBg: "#7F1D1D", darkText: "#FCA5A5" },
    };
    return colors[statusLower] || colors.pending;
  };

  const getOrderNumberDisplay = (order) => {
    // Try different possible field names for order number
    const orderNumber = order.orderNumber || order.order_number || order.invoice_number || order.id;
    if (!orderNumber) return "N/A";
    
    // Convert to string and handle
    const orderNumStr = String(orderNumber);
    if (orderNumStr.length > 8) {
      return `#${orderNumStr.slice(-6)}`;
    }
    return `#${orderNumStr}`;
  };

  const getCustomerName = (order) => {
    if (order.customer?.name) return order.customer.name;
    if (order.customer_name) return order.customer_name;
    return "Unknown Customer";
  };

  const getCustomerInitial = (order) => {
    const name = getCustomerName(order);
    return name.charAt(0).toUpperCase();
  };

  const handleOrderPress = (order) => {
    const orderId = order.id || order.order_id;
    if (orderId) {
      navigation.navigate("OrderDetail", { orderId: orderId });
    } else {
      Alert.alert("Error", "Order details not available");
    }
  };

  const renderOrderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const bgColor = isDarkMode ? statusColor.darkBg : statusColor.bg;
    const textColor = isDarkMode ? statusColor.darkText : statusColor.text;

    return (
      <TouchableOpacity
        key={item.id || item.order_id}
        onPress={() => handleOrderPress(item)}
        className={`flex-row items-center py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}
      >
        <View className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-3">
          <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            {getOrderNumberDisplay(item)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {getCustomerName(item)}
          </Text>
          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {item.items?.length || 0} items • {formatCurrency(item.total)}
          </Text>
        </View>
        <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: bgColor }}>
          <Text className="text-xs font-semibold" style={{ color: textColor }}>
            {(item.status || "pending").toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (orders.length === 0) {
    return (
      <View className={`mx-4 mt-6 mb-8 p-4 rounded-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Recent Orders</Text>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>You have 0 orders this period</Text>
          </View>
          {onViewAll && (
            <TouchableOpacity onPress={onViewAll}>
              <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">View All →</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="py-8 items-center">
          <Icon name="package-variant" size={48} color={isDarkMode ? "#4B5563" : "#9CA3AF"} />
          <Text className={`text-center mt-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            No recent orders
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`mx-4 mt-6 mb-8 p-4 rounded-3xl ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}>
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Recent Orders</Text>
          <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
            You have {orders.length} order{orders.length !== 1 ? "s" : ""} this period
          </Text>
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">View All →</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={orders.slice(0, 5)}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => item?.id?.toString() || item?.order_id?.toString() || index.toString()}
        scrollEnabled={false}
      />
    </View>
  );
};

export default RecentOrdersTable;