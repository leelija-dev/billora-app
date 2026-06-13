// components/customers/CustomerList.js
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "../../store/themeStore";
import CustomerCard from "./CustomerCard";

const { width } = Dimensions.get('window');

const CustomerList = ({
  viewMode = "grid",
  customers = [],
  loading = false,
  onEdit,
  onDelete,
  onPayment,
}) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const stats = useMemo(() => {
    const withDue = customers.filter(c => parseFloat(c.due_amount || 0) > 0).length;
    const totalDue = customers.reduce((sum, c) => sum + (parseFloat(c.due_amount || 0)), 0);
    const active = customers.filter(c => c.status === "active" || !c.deleted_at).length;
    const total = customers.length;
    return { total, withDue, totalDue, active };
  }, [customers]);

  const handleCustomerPress = (customer) => {
    navigation.navigate("CustomerDetail", { customerId: customer.id });
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <View className="flex-row justify-between items-center">
        <View className={`flex-row items-center px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Icon name="account-group" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            {stats.total} {stats.total === 1 ? "customer" : "customers"}
          </Text>
        </View>
        
        <View className="flex-row gap-2">
          {stats.withDue > 0 && (
            <View className={`flex-row items-center px-3 py-1.5 rounded-full ${isDarkMode ? "bg-yellow-900/30" : "bg-yellow-50"}`}>
              <Icon name="cash" size={14} color="#f59e0b" />
              <Text className={`text-xs ml-1 text-yellow-500 font-medium`}>
                ₹{stats.totalDue.toFixed(2)}
              </Text>
            </View>
          )}
          <View className={`flex-row items-center px-3 py-1.5 rounded-full ${isDarkMode ? "bg-green-900/30" : "bg-green-50"}`}>
            <Icon name="account-check" size={14} color="#10b981" />
            <Text className={`text-xs ml-1 text-green-600 font-medium`}>
              {stats.active} Active
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderGridItem = (item) => (
    <View key={item.id} className="w-[48%] mx-[1%] mb-3">
      <CustomerCard
        customer={item}
        onEdit={onEdit}
        onDelete={onDelete}
        onPayment={onPayment}
      />
    </View>
  );

  const renderListItem = (item) => {
    const hasDue = parseFloat(item.due_amount || 0) > 0;
    const dueAmount = parseFloat(item.due_amount || 0);
    
    // Get gradient colors based on customer name
    const getAvatarGradient = () => {
      const gradients = [
        ['#3b82f6', '#2563eb'],
        ['#8b5cf6', '#6d28d9'],
        ['#ec4899', '#be185d'],
        ['#f59e0b', '#b45309'],
        ['#10b981', '#047857'],
        ['#ef4444', '#b91c1c'],
      ];
      const index = (item.name?.length || 0) % gradients.length;
      return gradients[index];
    };

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => handleCustomerPress(item)}
        activeOpacity={0.7}
        className={`mb-3 rounded-2xl overflow-hidden shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
      >
        {/* Header Section with Gradient */}
        <LinearGradient
          colors={getAvatarGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 py-3"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                <Text className="text-white font-bold text-lg">
                  {item.name?.charAt(0) || "U"}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-semibold text-base" numberOfLines={1}>
                  {item.name}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Icon name="phone" size={12} color="#ffffff/80" />
                  <Text className="text-white/80 text-xs ml-1" numberOfLines={1}>
                    {item.phone || "No phone"}
                  </Text>
                </View>
              </View>
            </View>
            {hasDue && (
              <View className="bg-yellow-500/40 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-bold">
                  ₹{dueAmount.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Body Section */}
        <View className="p-4">
          {/* Email */}
          {item.email && (
            <View className="flex-row items-center mb-2">
              <Icon name="email" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <Text className={`ml-2 text-sm flex-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          )}
          
          {/* Address */}
          {(item.address || item.city) && (
            <View className="flex-row items-center mb-3">
              <Icon name="map-marker" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              <Text className={`ml-2 text-sm flex-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} numberOfLines={2}>
                {item.address || "No address"}
                {item.city && `, ${item.city}`}
              </Text>
            </View>
          )}
          
          {/* Divider */}
          <View className="h-px bg-gray-200 dark:bg-gray-700 my-3" />
          
          {/* Footer Section */}
          <View className="flex-row justify-between items-center">
            {/* Created Date */}
            <View className="flex-row items-center">
              <Icon name="calendar" size={14} color={isDarkMode ? "#6b7280" : "#9ca3af"} />
              <Text className={`text-xs ml-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}
              </Text>
            </View>
            
            {/* Status Badge */}
            <View className={`px-2 py-1 rounded-full ${
              hasDue 
                ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              <Text className={`text-xs font-medium ${
                hasDue 
                  ? 'text-yellow-700 dark:text-yellow-400' 
                  : 'text-green-700 dark:text-green-400'
              }`}>
                {hasDue ? 'Due Pending' : 'No Due'}
              </Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View className="flex-row justify-end gap-2 mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            {hasDue && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  if (onPayment) onPayment(item);
                }}
                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex-row items-center"
              >
                <Icon name="credit-card" size={16} color="#8b5cf6" />
                <Text className="text-purple-600 dark:text-purple-400 text-sm ml-2 font-medium">
                  Pay Now
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit(item);
              }}
              className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex-row items-center"
            >
              <Icon name="pencil" size={16} color="#3b82f6" />
              <Text className="text-blue-600 dark:text-blue-400 text-sm ml-2 font-medium">
                Edit
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(item);
              }}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-xl flex-row items-center"
            >
              <Icon name="delete" size={16} color="#ef4444" />
              <Text className="text-red-600 dark:text-red-400 text-sm ml-2 font-medium">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < customers.length; i += 2) {
      const rowItems = customers.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (loading && customers.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Loading customers...
        </Text>
      </View>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <View className="flex-1">
        {renderHeader()}
        <View className="items-center justify-center py-16">
          <View className={`w-24 h-24 rounded-3xl items-center justify-center mb-4 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
            <Icon name="account-group" size={48} color="#9ca3af" />
          </View>
          <Text className={`text-lg font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            No Customers Found
          </Text>
          <Text className={`text-sm text-center mt-2 px-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Tap the + button to add your first customer
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {renderHeader()}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="pb-4">
          {viewMode === "grid" ? renderGridItems() : customers.map(item => renderListItem(item))}
        </View>
      </ScrollView>
    </View>
  );
};

export default CustomerList;