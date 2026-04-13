import { useNavigation, useFocusEffect } from "@react-navigation/native";
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { useUnits } from "../../hooks/useUnits";
import Header from "../../components/common/Header";
import UnitFilters from "../../components/units/UnitFilters";
import UnitList from "../../components/units/UnitList";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems"; // Import the helper

const UnitsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const {
    units = [],
    loading,
    error,
    refreshUnits,
    searchUnits,
    deleteUnit,
  } = useUnits() || {};

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("code");
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    sortBy: "code",
    sortOrder: "asc",
    dateRange: "all",
    createdBy: "",
  });

  // Use refs to track state without causing re-renders
  const lastRefreshTime = useRef(Date.now());
  const isRefreshing = useRef(false);
  const focusCount = useRef(0);
  const isMounted = useRef(true);

  // Stable refresh callback
  const stableRefresh = useCallback(async () => {
    if (isRefreshing.current || !isMounted.current) return;
    
    isRefreshing.current = true;
    setRefreshing(true);
    
    try {
      await refreshUnits();
      lastRefreshTime.current = Date.now();
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
        isRefreshing.current = false;
      }
    }
  }, [refreshUnits]);

  // Focus effect - refresh when screen comes into focus, but not too frequently
  useFocusEffect(
    useCallback(() => {
      focusCount.current += 1;
      console.log('Units screen focused - focus count:', focusCount.current);
      
      // Don't refresh if we're already refreshing
      if (isRefreshing.current) {
        console.log('Already refreshing, skipping...');
        return;
      }
      
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      // Only refresh if it's been more than 5 seconds
      if (timeSinceLastRefresh > 5000) {
        console.log('Refreshing units on focus...');
        stableRefresh();
      } else {
        console.log('Skipping refresh - last refresh was', Math.round(timeSinceLastRefresh / 1000), 'seconds ago');
      }

      return () => {
        console.log('Units screen unfocused');
      };
    }, [stableRefresh])
  );

  // Navigation listener - with proper cleanup
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const routes = navigation.getState()?.routes;
      const previousRoute = routes?.[routes.length - 2]?.name;
      
      // Refresh when coming back from add/edit/detail screens
      if (previousRoute === 'AddUnit' || previousRoute === 'UnitDetail') {
        console.log(`Returning from ${previousRoute} - refreshing units`);
        stableRefresh();
      }
    });

    return unsubscribe;
  }, [navigation, stableRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Calculate dynamic stats from real units
  const totalUnits = units?.length || 0;
  
  // Get latest update date
  const latestUpdate = useMemo(() => {
    if (!Array.isArray(units) || units.length === 0) return 'N/A';
    const dates = units.map(u => new Date(u.updated_at).getTime());
    return new Date(Math.max(...dates)).toLocaleDateString();
  }, [units]);

  // Get unique creators
  const uniqueCreators = useMemo(() => {
    if (!Array.isArray(units)) return [];
    const creators = new Set(units.map(u => u.created_by || `User ${u.user_id}`));
    return Array.from(creators);
  }, [units]);

  const handleAddUnit = () => {
    navigation.navigate("AddUnit");
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
      sortBy: "code",
      sortOrder: "asc",
      dateRange: "all",
      createdBy: "",
    });
    setSortBy("code");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchUnits(query);
    } else {
      stableRefresh();
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleDeleteUnit = async (unitId) => {
    Alert.alert(
      "Delete Unit",
      "Are you sure you want to delete this unit?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log('Deleting unit:', unitId);
            const result = await deleteUnit(unitId);
            console.log('Delete result:', result);
            
            if (result?.success) {
              Alert.alert("Success", "Unit deleted successfully");
              // Force refresh to get updated data from backend
              await stableRefresh();
              // Also reset last refresh time to ensure immediate refresh on focus
              lastRefreshTime.current = 0;
            } else {
              Alert.alert("Error", result?.error || "Failed to delete unit");
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    await stableRefresh();
  };

  // Navigation items for sidebar - Using centralized navigation items
  const navigationItems = useMemo(() => {
    // Create badges for this screen
    const badges = {
      units: totalUnits.toString(),
      // You can add other dynamic badges here if needed
    };
    
    // Get navigation items with badges
    return getNavigationItemsWithBadges(badges);
  }, [totalUnits]);

  // Show loading state
  if (loading && units.length === 0 && !refreshing) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <Icon name="ruler" size={32} color="#3b82f6" />
        </View>
        <Text className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Loading units...
        </Text>
        <Text className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Please wait a moment
        </Text>
      </View>
    );
  }

  // Show error state
  if (error && units.length === 0) {
    return (
      <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center px-6`}>
        <View className={`w-20 h-20 rounded-3xl items-center justify-center mb-4 ${
          isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
        }`}>
          <Icon name="alert-circle" size={40} color="#ef4444" />
        </View>
        <Text className={`text-lg font-semibold text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Failed to Load Units
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
        title="Units"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Units"
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
              onPress={handleAddUnit}
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
            placeholder="Search by code, name, or description..."
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
            <Text className="text-white/80 text-xs">Total Units</Text>
            <Text className="text-white text-2xl font-bold">{totalUnits}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="ruler" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">Measurement units</Text>
            </View>
          </LinearGradient>

          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Unique Codes
            </Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {totalUnits}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
              <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                All unique codes
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <View className="flex-row items-center">
              <Icon name="account" size={20} color="#8b5cf6" />
              <Text className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Creators
              </Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {uniqueCreators.length}
            </Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Unique users
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
        {activeFilters.dateRange !== 'all' && (
          <View className="px-4 mb-3 flex-row flex-wrap">
            {activeFilters.dateRange !== 'all' && (
              <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date: {activeFilters.dateRange}
                </Text>
                <TouchableOpacity 
                  onPress={() => setActiveFilters({...activeFilters, dateRange: 'all'})}
                  className="ml-2"
                >
                  <Icon name="close" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      {/* Filter Chips */}
      {activeFilters.dateRange !== 'all' && (
        <View className="px-4 mb-3 flex-row flex-wrap">
          {activeFilters.dateRange !== 'all' && (
            <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Text className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Date: {activeFilters.dateRange}
              </Text>
              <TouchableOpacity 
                onPress={() => setActiveFilters({...activeFilters, dateRange: 'all'})}
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
              onPress={() => setSortBy('code')}
              className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${
                sortBy === 'code'
                  ? "bg-blue-500 border-blue-500"
                  : isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-sm ${
                  sortBy === 'code'
                    ? "text-white"
                    : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Code
              </Text>
            </TouchableOpacity>

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
                name="sort-ascending"
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
              onPress={() => setSortBy('id')}
              className={`flex-row items-center px-4 py-2 rounded-full border ${
                sortBy === 'id'
                  ? "bg-blue-500 border-blue-500"
                  : isDarkMode
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`ml-2 text-sm ${
                  sortBy === 'id'
                    ? "text-white"
                    : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                ID
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

        {/* Unit List */}
        <View className="flex-1 px-4 pb-4">
          <UnitList
            units={units}
            viewMode={viewMode}
            searchQuery={searchQuery}
            sortBy={sortBy}
            filters={activeFilters}
            onRefresh={onRefresh}
            onDelete={handleDeleteUnit}
            loading={loading}
          />
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <UnitFilters
        visible={showFilters}
        onClose={handleFiltersClose}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={activeFilters}
      />
    </View>
  );
};

export default UnitsScreen;