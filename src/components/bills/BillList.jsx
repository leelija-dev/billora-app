import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { format } from 'date-fns';
import { LinearGradient } from "expo-linear-gradient";

const BillList = ({
  viewMode = "list",
  searchQuery = "",
  bills = [],
  loading = false,
  onRefresh = () => {},
  onDelete = () => {},
}) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Filter bills
  const filteredBills = useMemo(() => {
    if (!Array.isArray(bills)) return [];
    let filtered = [...bills];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.invoice_no?.toLowerCase().includes(query) ||
          b.customer?.name?.toLowerCase().includes(query) ||
          b.total_amount?.toString().includes(query)
      );
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return filtered;
  }, [bills, searchQuery]);

  const handleBillPress = (bill) => {
    navigation.navigate("BillDetail", { billId: bill.id });
  };

  const onRefreshLocal = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim, marginBottom: 16 }}>
      <View className="flex-row justify-between items-center">
        <View className={`flex-row items-center px-3 py-1.5 rounded-full ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="file-document" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderListItem = (bill) => (
    <TouchableOpacity
      key={bill.id}
      onPress={() => handleBillPress(bill)}
      className={`flex-row rounded-xl mb-3 p-4 shadow-sm ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      <View className="mr-3">
        <LinearGradient
          colors={["#3b82f6", "#2563eb"]}
          className="w-12 h-12 rounded-xl items-center justify-center"
        >
          <Icon name="receipt" size={24} color="#ffffff" />
        </LinearGradient>
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text
              className={`text-base font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}
              numberOfLines={1}
            >
              {bill.invoice_no}
            </Text>
            <Text
              className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
              numberOfLines={1}
            >
              {bill.customer?.name || 'Walk-in Customer'}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-full ${
            bill.paid_amount >= bill.total_amount
              ? 'bg-green-500/20'
              : 'bg-yellow-500/20'
          }`}>
            <Text className={`text-xs font-medium ${
              bill.paid_amount >= bill.total_amount
                ? 'text-green-500'
                : 'text-yellow-500'
            }`}>
              {bill.paid_amount >= bill.total_amount ? 'Paid' : 'Partial'}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center">
            <Icon name="calendar" size={14} color="#9ca3af" />
            <Text className={`text-xs ml-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {format(new Date(bill.created_at), 'dd MMM yyyy')}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Icon name="currency-usd" size={14} color="#10b981" />
            <Text className="text-sm font-bold text-green-500 ml-1">
              ${typeof bill.total_amount === 'number' ? bill.total_amount.toFixed(2) : (Number(bill.total_amount) || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center">
            <Icon name="package-variant" size={14} color="#9ca3af" />
            <Text className={`text-xs ml-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {bill.items?.length || 0} items
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Delete Bill",
                "Are you sure you want to delete this bill?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDelete(bill.id),
                  },
                ]
              );
            }}
          >
            <Icon name="delete" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGridItem = (bill) => (
    <TouchableOpacity
      key={bill.id}
      onPress={() => handleBillPress(bill)}
      className="w-[48%] mx-[1%] mb-3"
    >
      <View className={`rounded-xl p-4 shadow-sm ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <LinearGradient
          colors={["#3b82f6", "#2563eb"]}
          className="w-12 h-12 rounded-xl items-center justify-center mb-3"
        >
          <Icon name="receipt" size={24} color="#ffffff" />
        </LinearGradient>

        <Text
          className={`text-base font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}
          numberOfLines={1}
        >
          {bill.invoice_no}
        </Text>
        
        <Text
          className={`text-xs mb-2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
          numberOfLines={1}
        >
          {bill.customer?.name || 'Walk-in Customer'}
        </Text>

        <View className="flex-row justify-between items-center mb-2">
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {format(new Date(bill.created_at), 'dd MMM')}
          </Text>
          <View className={`px-2 py-0.5 rounded-full ${
            bill.paid_amount >= bill.total_amount
              ? 'bg-green-500/20'
              : 'bg-yellow-500/20'
          }`}>
            <Text className={`text-xs font-medium ${
              bill.paid_amount >= bill.total_amount
                ? 'text-green-500'
                : 'text-yellow-500'
            }`}>
              {bill.paid_amount >= bill.total_amount ? 'Paid' : 'Partial'}
            </Text>
          </View>
        </View>

        <Text className="text-lg font-bold text-green-500">
          ${typeof bill.total_amount === 'number' ? bill.total_amount.toFixed(2) : (Number(bill.total_amount) || 0).toFixed(2)}
        </Text>

        <Text className={`text-xs mt-2 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          {bill.items?.length || 0} items
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredBills.length; i += 2) {
      const rowItems = filteredBills.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (loading && !refreshing && filteredBills.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading bills...
        </Text>
      </View>
    );
  }

  if (!filteredBills || filteredBills.length === 0) {
    return (
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshLocal}
            colors={["#3b82f6"]}
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          />
        }
      >
        <View className="px-4">
          {renderHeader()}
          <View className="items-center justify-center py-16">
            <View className={`w-24 h-24 rounded-3xl items-center justify-center mb-4 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Icon name="file-document" size={48} color="#9ca3af" />
            </View>
            <Text className={`text-lg font-semibold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Bills Found
            </Text>
            <Text className={`text-sm text-center mt-2 px-8 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Tap the + button to create your first bill"}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1">
      {renderHeader()}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshLocal}
            colors={["#3b82f6"]}
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          />
        }
      >
        <View className="pb-4">
          {viewMode === "grid"
            ? renderGridItems()
            : filteredBills.map(bill => renderListItem(bill))}
        </View>
      </ScrollView>
    </View>
  );
};

export default BillList;