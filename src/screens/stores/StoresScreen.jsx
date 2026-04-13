import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
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
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useStores } from "../../hooks/useStores";
import Header from "../../components/common/Header";
import StoreFilters from "../../components/stores/StoreFilters";
import StoreList from "../../components/stores/StoreList";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems"; // Import the helper

const StoresScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const {
    stores = [],
    loading,
    error,
    refreshStores,
    searchStores,
    deleteStore,
  } = useStores() || {};

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: "all",
    city: "",
    hasGst: null,
    sortBy: "name",
    sortOrder: "asc",
    dateRange: "all",
  });

  // Simple refresh callback like ProductsScreen
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshStores();
    } finally {
      setRefreshing(false);
    }
  };

  // Simple initial fetch like ProductsScreen
  useEffect(() => {
    refreshStores();
  }, []);

 

  // Calculate dynamic stats from real stores
  const totalStores = stores?.length || 0;
  const activeStores = useMemo(() => 
    Array.isArray(stores) ? stores.filter(store => store.status).length : 0, 
    [stores]
  );
  
  // Get unique cities
  const uniqueCities = useMemo(() => {
    if (!Array.isArray(stores)) return [];
    const cities = new Set(stores.map(s => s.city).filter(Boolean));
    return Array.from(cities);
  }, [stores]);

  // Get latest update date
  const latestUpdate = useMemo(() => {
    if (!Array.isArray(stores) || stores.length === 0) return 'N/A';
    const dates = stores.map(s => new Date(s.updated_at).getTime());
    return new Date(Math.max(...dates)).toLocaleDateString();
  }, [stores]);

  const handleAddStore = () => {
    navigation.navigate("AddStore");
  };

  const handleFilterPress = () => {
    setShowFilters(true);
  };

  const handleFiltersClose = () => {
    setShowFilters(false);
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    setSortBy(filters.sortBy);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setActiveFilters({
      status: "all",
      city: "",
      hasGst: null,
      sortBy: "name",
      sortOrder: "asc",
      dateRange: "all",
    });
    setSortBy("name");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchStores(query);
    } else {
      onRefresh();
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleDeleteStore = async (storeId) => {
    Alert.alert(
      "Delete Store",
      "Are you sure you want to delete this store?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log('Deleting store:', storeId);
            const result = await deleteStore(storeId);
            console.log('Delete result:', result);
            
            if (result?.success) {
              Alert.alert("Success", "Store deleted successfully");
              await onRefresh();
            } else {
              Alert.alert("Error", result?.error || "Failed to delete store");
            }
          },
        },
      ]
    );
  };

  // Navigation items for sidebar - Using centralized navigation items
  const navigationItems = useMemo(() => {
    // Create badges for this screen
    const badges = {
      stores: totalStores.toString(),
      // You can add other dynamic badges here if needed
    };
    
    // Get navigation items with badges
    return getNavigationItemsWithBadges(badges);
  }, [totalStores]);

  // Show loading state
  if (loading && stores.length === 0 && !refreshing) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="store" size={32} color="#3b82f6" />
        </View>
        <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Loading stores...
        </Text>
        <Text className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Please wait a moment
        </Text>
      </View>
    );
  }

  // Show error state
  if (error && stores.length === 0) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center px-6`}>
        <View className={`w-20 h-20 rounded-3xl items-center justify-center mb-4 ${
          isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
        }`}>
          <Icon name="alert-circle" size={40} color="#ef4444" />
        </View>
        <Text className={`text-lg font-semibold text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Failed to Load Stores
        </Text>
        <Text className={`text-sm text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          className="mt-6 bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
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
        title="Stores"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Stores"
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
              onPress={handleAddStore}
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
            placeholder="Search by name, email, GST, mobile, address, city..."
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
            className={`ml-2 p-2 border-l relative ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <Icon name="tune" size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            {Object.values(activeFilters).some(v => v && v !== "" && v !== "all" && v !== null) && (
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
          >
            <Text className="text-white/80 text-xs">Total Stores</Text>
            <Text className="text-white text-2xl font-bold">{totalStores}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="store" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">All stores</Text>
            </View>
          </LinearGradient>

          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Active Stores
            </Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {activeStores}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {totalStores > 0 ? ((activeStores / totalStores) * 100).toFixed(0) : 0}% active
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row items-center">
              <Icon name="city" size={20} color="#8b5cf6" />
              <Text className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Cities
              </Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {uniqueCities.length}
            </Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Locations
            </Text>
          </View>

          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row items-center">
              <Icon name="calendar" size={20} color="#f97316" />
              <Text className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Latest Update
              </Text>
            </View>
            <Text className={`text-sm font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} numberOfLines={1}>
              {latestUpdate}
            </Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Recent activity
            </Text>
          </View>
        </View>

        {/* Filter Chips */}
        {(activeFilters.status !== 'all' || activeFilters.city || activeFilters.hasGst !== null) && (
          <View className="px-4 mb-3 flex-row flex-wrap">
            {activeFilters.status !== 'all' && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status: {activeFilters.status}
                </Text>
                <TouchableOpacity 
                  onPress={() => setActiveFilters({...activeFilters, status: 'all'})}
                  className="ml-2"
                >
                  <Icon name="close" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            )}
            {activeFilters.city && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  City: {activeFilters.city}
                </Text>
                <TouchableOpacity 
                  onPress={() => setActiveFilters({...activeFilters, city: ''})}
                  className="ml-2"
                >
                  <Icon name="close" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            )}
            {activeFilters.hasGst !== null && (
              <View className={`flex-row items-center mb-2 px-3 py-1.5 rounded-full ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  GST: {activeFilters.hasGst ? 'With GST' : 'No GST'}
                </Text>
                <TouchableOpacity 
                  onPress={() => setActiveFilters({...activeFilters, hasGst: null})}
                  className="ml-2"
                >
                  <Icon name="close" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Sort Options */}
        <View className="flex-row px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setSortBy('name')}
                className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${
                  sortBy === 'name'
                    ? "bg-blue-500 border-blue-500"
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                }`}
              >
                <Icon
                  name="sort-alphabetical"
                  size={16}
                  color={sortBy === 'name' ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"}
                />
                <Text
                  className={`ml-2 text-sm ${
                    sortBy === 'name'
                      ? "text-white"
                      : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Name
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSortBy('date')}
                className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${
                  sortBy === 'date'
                    ? "bg-blue-500 border-blue-500"
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                }`}
              >
                <Icon
                  name="calendar"
                  size={16}
                  color={sortBy === 'date' ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"}
                />
                <Text
                  className={`ml-2 text-sm ${
                    sortBy === 'date'
                      ? "text-white"
                      : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Date
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSortBy('city')}
                className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${
                  sortBy === 'city'
                    ? "bg-blue-500 border-blue-500"
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                }`}
              >
                <Icon
                  name="city"
                  size={16}
                  color={sortBy === 'city' ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"}
                />
                <Text
                  className={`ml-2 text-sm ${
                    sortBy === 'city'
                      ? "text-white"
                      : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  City
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSortBy('status')}
                className={`flex-row items-center px-4 py-2 rounded-full border ${
                  sortBy === 'status'
                    ? "bg-blue-500 border-blue-500"
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                }`}
              >
                <Icon
                  name="checkbox-marked-circle-outline"
                  size={16}
                  color={sortBy === 'status' ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"}
                />
                <Text
                  className={`ml-2 text-sm ${
                    sortBy === 'status'
                      ? "text-white"
                      : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  Status
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Store List */}
        <View className="flex-1 px-4 pb-4">
          <StoreList
            stores={stores}
            viewMode={viewMode}
            searchQuery={searchQuery}
            sortBy={sortBy}
            filters={activeFilters}
            onRefresh={onRefresh}
            onDelete={handleDeleteStore}
            loading={loading}
          />
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <StoreFilters
        visible={showFilters}
        onClose={handleFiltersClose}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={activeFilters}
      />
    </View>
  );
};

export default StoresScreen;