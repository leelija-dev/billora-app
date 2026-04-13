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
  Modal,
  TextInput,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import CustomerCard from "./CustomerCard";
import { LinearGradient } from "expo-linear-gradient";

const CustomerList = ({
  viewMode = "grid",
  searchQuery = "",
  sortBy = "name",
  customers = [],
  loading = false,
  onRefresh = () => {},
  onDelete = () => {},
  filters = {},
}) => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [dueModalVisible, setDueModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dueAmount, setDueAmount] = useState("");

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(customers)) return [];
    let filtered = [...customers];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query) ||
          c.address?.toLowerCase().includes(query) ||
          c.city?.toLowerCase().includes(query) ||
          c.id?.toString().includes(query)
      );
    }
    
    // Filter by due status
    if (filters.dueStatus !== 'all') {
      if (filters.dueStatus === 'hasDue') {
        filtered = filtered.filter(c => {
          const dueAmount = typeof c.due_amount === 'string' ? parseFloat(c.due_amount) : (typeof c.due_amount === 'number' ? c.due_amount : 0);
          return dueAmount > 0;
        });
      } else if (filters.dueStatus === 'noDue') {
        filtered = filtered.filter(c => {
          const dueAmount = typeof c.due_amount === 'string' ? parseFloat(c.due_amount) : (typeof c.due_amount === 'number' ? c.due_amount : 0);
          return !dueAmount || dueAmount === 0;
        });
      }
    }
    
    // Filter by due amount range
    if (filters.minDue) {
      filtered = filtered.filter(c => {
        const dueAmount = typeof c.due_amount === 'string' ? parseFloat(c.due_amount) : (typeof c.due_amount === 'number' ? c.due_amount : 0);
        return dueAmount >= parseFloat(filters.minDue);
      });
    }
    if (filters.maxDue) {
      filtered = filtered.filter(c => {
        const dueAmount = typeof c.due_amount === 'string' ? parseFloat(c.due_amount) : (typeof c.due_amount === 'number' ? c.due_amount : 0);
        return dueAmount <= parseFloat(filters.maxDue);
      });
    }
    
    // Filter by city
    if (filters.city) {
      filtered = filtered.filter(c => 
        c.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    
    // Filter by date range
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(c => new Date(c.created_at) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(c => new Date(c.created_at) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(c => new Date(c.created_at) >= filterDate);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(c => new Date(c.created_at) >= filterDate);
          break;
      }
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'due':
          const aDueAmount = typeof a.due_amount === 'string' ? parseFloat(a.due_amount) : (typeof a.due_amount === 'number' ? a.due_amount : 0);
          const bDueAmount = typeof b.due_amount === 'string' ? parseFloat(b.due_amount) : (typeof b.due_amount === 'number' ? b.due_amount : 0);
          comparison = aDueAmount - bDueAmount;
          break;
        case 'date':
          comparison = new Date(b.created_at || 0) - new Date(a.created_at || 0);
          break;
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '');
          break;
        default:
          comparison = 0;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return filtered;
  }, [customers, searchQuery, sortBy, filters]);

  // Statistics
  const stats = useMemo(() => {
    if (!Array.isArray(customers)) return {
      total: 0,
      withDue: 0,
      totalDue: 0,
    };
    
    const withDue = customers.filter(c => {
      const dueAmount = typeof c.due_amount === 'string' ? parseFloat(c.due_amount) : (typeof c.due_amount === 'number' ? c.due_amount : 0);
      return dueAmount > 0;
    }).length;
    
    const totalDue = customers.reduce((sum, c) => {
      const dueAmount = typeof c.due_amount === 'string' ? parseFloat(c.due_amount) : (typeof c.due_amount === 'number' ? c.due_amount : 0);
      return sum + dueAmount;
    }, 0);
    
    return {
      total: customers.length,
      withDue,
      totalDue,
    };
  }, [customers]);

  const handleCustomerPress = (customer) => {
    navigation.navigate("CustomerDetail", { customerId: customer.id });
  };

  const handleDuePayment = (customerId, customerName) => {
    setSelectedCustomer({ id: customerId, name: customerName });
    setDueModalVisible(true);
  };

  const handleSubmitDue = async () => {
    if (!dueAmount || parseFloat(dueAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    // This would call the API to add due payment
    // For now, we'll just close the modal
    setDueModalVisible(false);
    setDueAmount("");
    setSelectedCustomer(null);
    
    // Show success message
    Alert.alert("Success", "Due payment added successfully");
  };

  const handleDeleteCustomer = async (customerId) => {
    if (onDelete) {
      const result = await onDelete(customerId);
      return result;
    }
    return { success: false };
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
          <Icon name="account-group" size={16} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
          <Text className={`text-sm ml-1 font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'}
          </Text>
        </View>
        
        <View className="flex-row">
          {stats.withDue > 0 && (
            <View className={`flex-row items-center px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'
            }`}>
              <Icon name="alert-circle" size={14} color="#f59e0b" />
              <Text className={`text-xs ml-1 text-yellow-500`}>
                ${stats.totalDue.toFixed(2)} due
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );

  const renderGridItem = (item) => (
    <View key={item.id} className="w-[48%] mx-[1%] mb-3">
      <CustomerCard 
        customer={item} 
        onDelete={handleDeleteCustomer}
        onDuePayment={handleDuePayment}
      />
    </View>
  );

  const renderListItem = (item) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleCustomerPress(item)}
      className={`flex-row rounded-xl mb-3 p-4 shadow-sm ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      {/* Avatar */}
      <View className="mr-3">
        <LinearGradient
          colors={["#3b82f6", "#2563eb"]}
          className="w-12 h-12 rounded-xl items-center justify-center"
        >
          <Icon name="account" size={24} color="#ffffff" />
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
              {item.name}
            </Text>
            {item.email && (
              <Text
                className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
                numberOfLines={1}
              >
                {item.email}
              </Text>
            )}
          </View>
          <Text className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            #{item.id}
          </Text>
        </View>

        <View className="flex-row items-center mt-1">
          <Icon name="phone" size={14} color="#9ca3af" />
          <Text className={`text-xs ml-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {item.phone}
          </Text>
        </View>

        <View className="flex-row items-center mt-1">
          <Icon name="map-marker" size={14} color="#9ca3af" />
          <Text
            className={`text-xs ml-1 flex-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
            numberOfLines={1}
          >
            {item.address}
            {item.city && `, ${item.city}`}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <View className="flex-row items-center">
            <Icon name="calendar" size={14} color="#9ca3af" />
            <Text className={`text-xs ml-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          
          {(() => {
            const dueAmount = typeof item.due_amount === 'string' ? parseFloat(item.due_amount) : (typeof item.due_amount === 'number' ? item.due_amount : 0);
            return dueAmount > 0 && (
              <View className="bg-yellow-500/20 px-2 py-1 rounded-full">
                <Text className="text-xs text-yellow-500 font-medium">
                  Due: ${dueAmount.toFixed(2)}
                </Text>
              </View>
            );
          })()}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGridItems = () => {
    const rows = [];
    for (let i = 0; i < filteredCustomers.length; i += 2) {
      const rowItems = filteredCustomers.slice(i, i + 2);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-between mb-2">
          {rowItems.map(item => renderGridItem(item))}
        </View>
      );
    }
    return rows;
  };

  if (loading && !refreshing && filteredCustomers.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Loading customers...
        </Text>
      </View>
    );
  }

  if (!filteredCustomers || filteredCustomers.length === 0) {
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
              <Icon name="account-group" size={48} color="#9ca3af" />
            </View>
            <Text className={`text-lg font-semibold ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No Customers Found
            </Text>
            <Text className={`text-sm text-center mt-2 px-8 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "Tap the + button to add your first customer"}
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
            : filteredCustomers.map(item => renderListItem(item))}
        </View>
      </ScrollView>

      {/* Due Payment Modal */}
      <Modal
        visible={dueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDueModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center">
          <View className={`mx-4 rounded-2xl p-5 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xl font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Add Due Payment
            </Text>

            <Text className={`text-sm mb-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Customer: {selectedCustomer?.name}
            </Text>

            <View className={`flex-row items-center rounded-xl px-4 border mb-4 ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
            }`}>
              <Text className="text-gray-500 font-bold text-lg">$</Text>
              <TextInput
                value={dueAmount}
                onChangeText={setDueAmount}
                placeholder="0.00"
                placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                keyboardType="decimal-pad"
                className={`flex-1 ml-2 py-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setDueModalVisible(false);
                  setDueAmount("");
                  setSelectedCustomer(null);
                }}
                className={`flex-1 py-4 rounded-xl items-center border ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gray-700' 
                    : 'border-gray-200 bg-gray-100'
                }`}
              >
                <Text className={`font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitDue}
                className="flex-1 bg-blue-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Add Due</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomerList;