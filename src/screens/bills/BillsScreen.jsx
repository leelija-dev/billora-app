import { useNavigation } from "@react-navigation/native";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useBills } from "../../hooks/useBills";
import Header from "../../components/common/Header";
import BillList from "../../components/bills/BillList";
import { format } from 'date-fns';
import { getNavigationItemsWithBadges } from "../../constants/navigationItems"; // Import the helper

const BillsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const {
    bills = [],
    loading,
    error,
    refreshBills,
    searchBills,
    filterByDateRange,
    deleteBill,
    totalAmount = 0,
    totalPaid = 0,
  } = useBills() || {
    bills: [],
    loading: true,
    error: null,
    refreshBills: async () => {},
    searchBills: async () => {},
    filterByDateRange: async () => {},
    deleteBill: async () => {},
    totalAmount: 0,
    totalPaid: 0,
  };

  // Safely convert to numbers and provide defaults
  const safeTotalAmount = typeof totalAmount === 'number' ? totalAmount : Number(totalAmount) || 0;
  const safeTotalPaid = typeof totalPaid === 'number' ? totalPaid : Number(totalPaid) || 0;

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [refreshing, setRefreshing] = useState(false);
  const [dateRangeModal, setDateRangeModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    dateRange: 'all',
  });

  // Use refs to track state without causing re-renders
  const lastRefreshTime = useRef(Date.now());
  const isRefreshing = useRef(false);
  const isMounted = useRef(true);

  // Calculate statistics with safe values
  const totalBills = bills?.length || 0;
  const averageBillValue = totalBills > 0 
    ? (safeTotalAmount / totalBills).toFixed(2) 
    : '0.00';

  // Initial fetch only - like ProductsScreen
  useEffect(() => {
    refreshBills?.();
  }, []);

  const handleCreateBill = () => {
    navigation.navigate("CreateBill");
  };

  const handleFilterPress = () => {
    setShowFilters(true);
  };

  const handleDateRangeApply = async () => {
    setDateRangeModal(false);
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    await filterByDateRange(formattedStartDate, formattedEndDate);
    setActiveFilters({ dateRange: 'custom' });
  };

  const handleResetFilters = () => {
    setActiveFilters({ dateRange: 'all' });
    refreshBills?.();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchBills?.(query);
    } else {
      refreshBills?.();
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleDeleteBill = async (billId) => {
    Alert.alert(
      "Delete Bill",
      "Are you sure you want to delete this bill?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log('Deleting bill:', billId);
            const result = await deleteBill(billId);
            
            if (result?.success) {
              Alert.alert("Success", "Bill deleted successfully");
              refreshBills?.();
            } else {
              Alert.alert("Error", result?.error || "Failed to delete bill");
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBills?.();
    setRefreshing(false);
  };

  // Navigation items for sidebar - Using centralized navigation items
  const navigationItems = useMemo(() => {
    // Create badges for this screen
    const badges = {
      bills: totalBills.toString(),
      // You can add other dynamic badges here if needed
      // products: "0",
      // customers: "0",
      // stocks: "0",
    };
    
    // Get navigation items with badges
    return getNavigationItemsWithBadges(badges);
  }, [totalBills]);

  // Show loading state
  if (loading && bills.length === 0 && !refreshing) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="file-document" size={32} color="#3b82f6" />
        </View>
        <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Loading bills...
        </Text>
        <Text className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Please wait a moment
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-16`}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={isDarkMode ? "#111827" : "#ffffff"} 
      />
      
      <Header
        title="Bills & Invoices"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Bills"
        navigationItems={navigationItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={toggleViewMode}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon
                name={viewMode === "grid" ? "view-grid" : "view-list"}
                size={22}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateBill}
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30"
            >
              <Icon name="plus" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            className={`flex-1 ml-3 text-base ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}
            placeholder="Search by invoice no., customer..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setDateRangeModal(true)}
            className={`ml-2 p-2 border-l relative ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <Icon name="calendar-range" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            {activeFilters.dateRange !== 'all' && (
              <View className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"}
          />
        }
      >
        {/* Stats Cards */}
        <View className="flex-row flex-wrap px-4 py-3">
          <LinearGradient
            colors={["#3b82f6", "#2563eb"]}
            className="rounded-xl p-4 flex-1 mr-2"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius:8
            }}
          >
            <Text className="text-white/80 text-xs">Total Bills</Text>
            <Text className="text-white text-2xl font-bold">{totalBills}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="file-document" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">All time</Text>
            </View>
          </LinearGradient>

          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Revenue
            </Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              ${safeTotalAmount.toFixed(2)}
            </Text>
            <View className="flex-row items-center mt-1">
              <Icon name="cash" size={16} color="#10b981" />
              <Text className={`text-xs ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Collected: ${safeTotalPaid.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row items-center">
              <Icon name="receipt" size={20} color="#f59e0b" />
              <Text className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Average Bill
              </Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              ${averageBillValue}
            </Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Per transaction
            </Text>
          </View>

          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row items-center">
              <Icon name="cash-multiple" size={20} color="#8b5cf6" />
              <Text className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Pending
              </Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              ${(safeTotalAmount - safeTotalPaid).toFixed(2)}
            </Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              To be collected
            </Text>
          </View>
        </View>

        {/* Bill List */}
        <View className="flex-1 px-4 pb-4">
          <BillList
            bills={bills}
            viewMode={viewMode}
            searchQuery={searchQuery}
            onRefresh={onRefresh}
            onDelete={handleDeleteBill}
            loading={loading}
          />
        </View>
      </ScrollView>

      {/* Date Range Modal */}
      <Modal
        visible={dateRangeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDateRangeModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center">
          <View className={`mx-4 rounded-2xl p-5 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xl font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Select Date Range
            </Text>

            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              className={`mb-4 p-4 rounded-xl border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <Text className={`text-xs mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Start Date
              </Text>
              <Text className={`text-base ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {format(startDate, 'PPP')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              className={`mb-6 p-4 rounded-xl border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <Text className={`text-xs mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                End Date
              </Text>
              <Text className={`text-base ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {format(endDate, 'PPP')}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) setStartDate(selectedDate);
                }}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDateRangeModal(false)}
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
                onPress={handleDateRangeApply}
                className="flex-1 bg-blue-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Apply</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleResetFilters}
              className="mt-3 py-3 rounded-xl items-center"
            >
              <Text className="text-blue-500 font-semibold">Reset to All Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BillsScreen;