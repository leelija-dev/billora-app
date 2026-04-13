// screens/customers/CustomersScreen.js
import { useNavigation } from "@react-navigation/native";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useCustomers } from "../../hooks/useCustomers";
import Header from "../../components/common/Header";
import CustomerFilters from "../../components/customers/CustomerFilters";
import CustomerList from "../../components/customers/CustomerList";
import TrashedCustomersModal from "../../components/customers/TrashedCustomersModal";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems"; // Import the helper

const CustomersScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { 
    customers = [], 
    loading, 
    error, 
    refreshCustomers, 
    searchCustomers,
    getCustomersByCity,
    deleteCustomer,
    getTrashedCustomers,
    restoreCustomer,
    forceDeleteCustomer
  } = useCustomers() || {};

  const [showFilters, setShowFilters] = useState(false);
  const [showTrashed, setShowTrashed] = useState(false);
  const [trashedCustomers, setTrashedCustomers] = useState([]);
  const [selectedCity, setSelectedCity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    dueStatus: "all",
    minDue: "",
    maxDue: "",
    sortBy: "name",
    sortOrder: "asc",
    dateRange: "all",
    city: "",
  });

  // Calculate statistics safely from customers array
  const totalCustomers = customers?.length || 0;
  
  // Calculate total due amount from all customers
  const totalDue = useMemo(() => {
    if (!customers?.length) return 0;
    return customers.reduce((sum, customer) => {
      // Check different possible field names for due amount
      const dueAmount = customer.due_amount || customer.due || customer.balance || 0;
      return sum + (parseFloat(dueAmount) || 0);
    }, 0);
  }, [customers]);

  const customersWithDue = useMemo(() => {
    if (!customers?.length) return 0;
    return customers.filter(c => {
      const dueAmount = c.due_amount || c.due || c.balance || 0;
      return parseFloat(dueAmount) > 0;
    }).length;
  }, [customers]);

  const averageDue = totalCustomers > 0 ? totalDue / totalCustomers : 0;

  // Get unique cities from customers
  const uniqueCities = useMemo(() => {
    if (!customers?.length) return [];
    const cities = [...new Set(customers.map(c => c.city).filter(Boolean))];
    return cities;
  }, [customers]);

  // Build cities list with "All Cities" option
  const allCities = useMemo(() => {
    return [
      {
        id: "all",
        name: "All Cities",
        icon: "map-marker-radius",
        count: customers?.length || 0,
        color: "#3b82f6",
      },
      ...uniqueCities.map(city => ({
        id: city,
        name: city,
        icon: "map-marker",
        count: customers?.filter(c => c.city === city)?.length || 0,
        color: "#8b5cf6",
      }))
    ];
  }, [customers, uniqueCities]);

  // Calculate real stats
  const stats = {
    total: totalCustomers,
    withDue: customersWithDue,
    totalDue: totalDue,
    averageDue: averageDue,
    cities: uniqueCities.length,
  };

  const handleAddCustomer = () => {
    navigation.navigate("AddCustomer");
  };

  const handleViewTrashed = async () => {
    const trashed = await getTrashedCustomers();
    setTrashedCustomers(trashed || []);
    setShowTrashed(true);
  };

  const handleRestoreCustomer = async (customerId) => {
    Alert.alert(
      "Restore Customer",
      "Are you sure you want to restore this customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async () => {
            const result = await restoreCustomer(customerId);
            if (result?.success) {
              Alert.alert("Success", "Customer restored successfully");
              const trashed = await getTrashedCustomers();
              setTrashedCustomers(trashed || []);
              await refreshCustomers?.();
            } else {
              Alert.alert("Error", result?.error || "Failed to restore customer");
            }
          },
        },
      ]
    );
  };

  const handlePermanentDelete = async (customerId) => {
    Alert.alert(
      "Permanently Delete Customer",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: async () => {
            const result = await forceDeleteCustomer(customerId);
            if (result?.success) {
              Alert.alert("Success", "Customer permanently deleted");
              const trashed = await getTrashedCustomers();
              setTrashedCustomers(trashed || []);
            } else {
              Alert.alert("Error", result?.error || "Failed to delete customer");
            }
          },
        },
      ]
    );
  };

  const handleFilterPress = () => {
    setShowFilters(true);
  };

  const handleFiltersClose = () => {
    setShowFilters(false);
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    setSelectedCity(filters.city || "all");
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setActiveFilters({
      dueStatus: "all",
      minDue: "",
      maxDue: "",
      sortBy: "name",
      sortOrder: "asc",
      dateRange: "all",
      city: "",
    });
    setSelectedCity("all");
    refreshCustomers?.();
  };

  const handleCitySelect = (cityId) => {
    setSelectedCity(cityId);
    if (cityId === "all") {
      refreshCustomers?.();
    } else {
      getCustomersByCity?.(cityId);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchCustomers?.(query);
    } else {
      refreshCustomers?.();
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleDeleteCustomer = async (customerId) => {
    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteCustomer(customerId);
            if (result?.success) {
              Alert.alert("Success", "Customer deleted successfully");
              await refreshCustomers?.();
            } else {
              Alert.alert("Error", result?.error || "Failed to delete customer");
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCustomers?.();
    } finally {
      setRefreshing(false);
    }
  };

  // Navigation items for sidebar - Using centralized navigation items
  const navigationItems = useMemo(() => {
    // Create badges for this screen
    const badges = {
      customers: stats.total.toString(),
      // You can add other dynamic badges here if needed
      // products: "0",
      // bills: "0",
    };
    
    // Get navigation items with badges
    return getNavigationItemsWithBadges(badges);
  }, [stats.total]);

  // Show loading state
  if (loading && customers.length === 0) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading customers...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <Text className="text-red-500">Error: {error}</Text>
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
        title="Customers"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Customers"
        navigationItems={navigationItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleViewTrashed}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Icon name="delete-restore" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
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
              onPress={handleAddCustomer}
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
            placeholder="Search by name, email, phone, address..."
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
            onPress={handleFilterPress}
            className={`ml-2 p-2 border-l ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <Icon name="tune" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
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
        {/* Cities Scroll - Like Categories in Products */}
        <View className="py-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4"
          >
            {allCities.map((city) => (
              <TouchableOpacity
                key={city.id}
                onPress={() => handleCitySelect(city.id)}
                className={`flex-row items-center mr-3 px-4 py-2.5 rounded-full border ${
                  selectedCity === city.id
                    ? "bg-blue-500 border-blue-500"
                    : isDarkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-white'
                } shadow-sm`}
              >
                <Icon
                  name={city.icon}
                  size={18}
                  color={
                    selectedCity === city.id 
                      ? "#ffffff" 
                      : isDarkMode ? '#9CA3AF' : city.color
                  }
                />
                <Text
                  className={`ml-2 font-medium ${
                    selectedCity === city.id
                      ? "text-white"
                      : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {city.name}
                </Text>
                <View
                  className={`ml-2 px-2 py-0.5 rounded-full ${
                    selectedCity === city.id
                      ? "bg-white/20"
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selectedCity === city.id
                        ? "text-white"
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {city.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats Cards - Similar to Products */}
        <View className="flex-row justify-between px-4 py-3">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Customers
            </Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {stats.total}
            </Text>
          </View>
          <View className={`rounded-xl p-3 flex-1 mx-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              With Due
            </Text>
            <Text className="text-2xl font-bold text-orange-500">{stats.withDue}</Text>
          </View>
          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Due
            </Text>
            <Text className="text-2xl font-bold text-red-500">
              ${typeof stats.totalDue === 'number' ? stats.totalDue.toFixed(2) : '0.00'}
            </Text>
          </View>
        </View>

        {/* Additional Stats Row */}
        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row items-center">
              <Icon name="cash" size={20} color="#10b981" />
              <Text className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Average Due
              </Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              ${typeof stats.averageDue === 'number' ? stats.averageDue.toFixed(2) : '0.00'}
            </Text>
          </View>

          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row items-center">
              <Icon name="map-marker" size={20} color="#8b5cf6" />
              <Text className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Cities
              </Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {stats.cities}
            </Text>
          </View>
        </View>

        {/* Customer List */}
        <View className="flex-1 px-4 pb-4">
          <CustomerList
            customers={customers}
            viewMode={viewMode}
            searchQuery={searchQuery}
            sortBy={activeFilters.sortBy}
            filters={activeFilters}
            onDelete={handleDeleteCustomer}
          />
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <CustomerFilters
        visible={showFilters}
        onClose={handleFiltersClose}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={activeFilters}
      />

      {/* Trashed Customers Modal */}
      <TrashedCustomersModal
        visible={showTrashed}
        onClose={() => setShowTrashed(false)}
        customers={trashedCustomers}
        onRestore={handleRestoreCustomer}
        onPermanentDelete={handlePermanentDelete}
      />
    </View>
  );
};

export default CustomersScreen;