// screens/units/UnitsScreen.js
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../../components/common/Header";
import UnitList from "../../components/units/UnitList";
import UnitForm from "../../components/units/UnitForm";
import { SuccessModal } from "../../components/common/CustomModal";
import StatsCard from "../../components/dashboard/StatsCard";
import { useAuthStore } from "../../store/authStore";
import useUnitStore from "../../store/unitStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";

const UnitsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();

  // Get unit store state and actions
  const {
    units = [],
    totalUnits,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    lastPage,
    filters,
    fetchUnits,
    loadNextPage,
    createUnit,
    updateUnit,
    deleteUnit,
    setFilters,
  } = useUnitStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name"); // Default sort by name
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Infinite scroll states
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);
  const scrollViewRef = useRef(null);

  const searchTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Get safe units array
  const safeUnits = useMemo(() => Array.isArray(units) ? units : [], [units]);

  // Get filtered menu items from permission store
  const menuItems = useMemo(() => {
    const filtered = getFilteredMenuItems();
    return filtered.map(item => ({
      id: item.id,
      title: item.name,
      screen: item.screen,
      icon: item.icon,
      iconActive: item.iconActive,
      badge: item.badge || null,
    }));
  }, [getFilteredMenuItems]);

  // Get current user ID
  const getUserId = useCallback(() => {
    if (user && user.id) return user.id.toString();
    return "1";
  }, [user]);

  // Reset trigger flag when new data is loaded or when conditions change
  useEffect(() => {
    if (!isLoadingMore && !loadingMore) {
      setHasTriggeredLoadMore(false);
    }
  }, [isLoadingMore, loadingMore]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("🔄 Fetching units for user:", getUserId());
        await fetchUnits(1, false);
        console.log("✅ Units fetched successfully");
      } catch (error) {
        console.error("Failed to load units:", error);
      } finally {
        if (isMounted.current) setInitialLoading(false);
      }
    };
    loadInitialData();

    return () => {
      isMounted.current = false;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [fetchUnits, getUserId]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters({ search: searchQuery });
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, setFilters]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      console.log("Units screen focused - refreshing data");
      handleRefresh();
      return () => {};
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUnits(1, false);
    setRefreshing(false);
  };

  // ✅ Load more handler
  const handleLoadMore = useCallback(async () => {
    // Check if we have more data to load
    const hasMoreData = safeUnits.length < totalUnits;
    
    // Prevent loading if already loading
    if (isLoadingMore || loadingMore || loading) {
      console.log('⏭️ Skipping - already loading');
      return;
    }
    
    if (!hasMoreData || !hasMore) {
      console.log('⏭️ Skipping - no more data');
      return;
    }

    console.log(`📜 Triggering loadNextPage - current: ${safeUnits.length}/${totalUnits}, page: ${currentPage}/${lastPage}`);
    setIsLoadingMore(true);
    await loadNextPage();
    setIsLoadingMore(false);
    setHasTriggeredLoadMore(false);
  }, [isLoadingMore, loadingMore, loading, safeUnits.length, totalUnits, hasMore, currentPage, lastPage, loadNextPage]);

  // ✅ Scroll handler for infinite scroll
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollPosition = contentOffset.y;
    const scrollViewHeight = layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    
    // Calculate scroll percentage
    const maxScroll = totalContentHeight - scrollViewHeight;
    const scrollPercentage = maxScroll > 0 ? (currentScrollPosition / maxScroll) * 100 : 0;
    
    // Check distance from bottom
    const distanceFromBottom = totalContentHeight - currentScrollPosition - scrollViewHeight;
    const isNearBottom = distanceFromBottom < 300;
    
    // Check if we have more data
    const hasMoreData = safeUnits.length < totalUnits && hasMore;
    
    // Trigger when scrolled 50% or near bottom
    if ((scrollPercentage >= 50 || isNearBottom) && 
        !hasTriggeredLoadMore && 
        !isLoadingMore && 
        !loadingMore && 
        hasMoreData && 
        !loading) {
      console.log(`🎯 Triggering load more - scroll: ${Math.floor(scrollPercentage)}%, ${safeUnits.length}/${totalUnits}`);
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, loadingMore, loading, safeUnits.length, totalUnits, hasMore, handleLoadMore]);

  const handleAddUnit = () => {
    setSelectedUnit(null);
    setShowAddForm(true);
    setShowEditForm(false);
  };

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleDeleteUnit = async (unit) => {
    const result = await deleteUnit(unit.id);
    if (result.success) {
      setSuccessMessage("Unit deleted successfully");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
      await fetchUnits(1, false);
    }
    return result;
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedUnit(null);
  };

  const handleSubmitUnit = async (unitData) => {
    setFormSubmitting(true);
    try {
      const userId = getUserId();
      const payload = {
        ...unitData,
        user_id: userId,
        created_by: userId,
      };

      let result;
      if (showEditForm && selectedUnit) {
        result = await updateUnit(selectedUnit.id, payload);
        if (result.success) {
          setSuccessMessage("Unit updated successfully");
        }
      } else {
        result = await createUnit(payload);
        if (result.success) {
          setSuccessMessage("Unit created successfully");
        }
      }

      if (result?.success) {
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
        handleCancelForm();
        await fetchUnits(1, false);
      } else {
        setSuccessMessage(result?.error || "Operation failed");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSuccessMessage(error.message || "An error occurred");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // ✅ Handle sort - only apply when clicked
  const handleSort = (sortKey) => {
    setSortBy(sortKey);
    setFilters({ sortBy: sortKey });
  };

  // Calculate stats
  const safeUnitsList = safeUnits;
  const totalUnitsCount = totalUnits || safeUnitsList.length;
  const activeUnitsCount = safeUnitsList.filter(u => u.is_active === 1 || u.is_active === true).length;
  const inactiveUnitsCount = totalUnitsCount - activeUnitsCount;
  const activePercentage = totalUnitsCount > 0 ? (activeUnitsCount / totalUnitsCount) * 100 : 0;

  // Calculate unique creators
  const uniqueCreators = useMemo(() => {
    const creators = new Set();
    safeUnitsList.forEach(u => {
      if (u.created_by) creators.add(u.created_by);
      else if (u.user_id) creators.add(`User ${u.user_id}`);
    });
    return creators.size;
  }, [safeUnitsList]);

  // Get latest update date
  const latestUpdate = useMemo(() => {
    if (safeUnitsList.length === 0) return "N/A";
    const dates = safeUnitsList.map(u => u.updated_at ? new Date(u.updated_at).getTime() : 0);
    return new Date(Math.max(...dates)).toLocaleDateString();
  }, [safeUnitsList]);

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading units...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#111827" : "#ffffff"} />

      <Header
        title="Units"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Units"
        navigationItems={menuItems}
        rightComponent={
          <View className="flex-row items-center">
            <TouchableOpacity onPress={toggleViewMode} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name={viewMode === "grid" ? "view-grid" : "view-list"} size={22} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRefresh} className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Icon name="refresh" size={20} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddUnit} className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30">
              <Icon name="plus" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
            placeholder="Search units by code or name..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            colors={["#3b82f6"]} 
            tintColor={isDarkMode ? "#ffffff" : "#3b82f6"} 
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: 20,
          flexGrow: 1,
        }}
      >
        {/* Stats Cards - Brand Style */}
        <View className="flex-row flex-wrap px-4 py-3">
          <LinearGradient colors={["#3b82f6", "#2563eb"]} className="rounded-xl p-4 flex-1 mr-2" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text className="text-white/80 text-xs">Total Units</Text>
            <Text className="text-white text-2xl font-bold">{totalUnitsCount}</Text>
            <View className="flex-row items-center mt-1">
              <Icon name="ruler" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">Measurement units</Text>
            </View>
          </LinearGradient>

          <View className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Active Units</Text>
            <Text className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{activeUnitsCount}</Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {totalUnitsCount > 0 ? ((activeUnitsCount / totalUnitsCount) * 100).toFixed(0) : 0}% active
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center">
              <Icon name="account" size={20} color="#8b5cf6" />
              <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Creators</Text>
            </View>
            <Text className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}>{uniqueCreators}</Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Unique users</Text>
          </View>

          <View className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center">
              <Icon name="calendar" size={20} color="#f97316" />
              <Text className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Latest Update</Text>
            </View>
            <Text className={`text-sm font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`} numberOfLines={1}>
              {latestUpdate}
            </Text>
            <Text className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Recent activity</Text>
          </View>
        </View>

        {/* Filter Chips */}
        {filters.search && (
          <View className="px-4 mb-3 flex-row flex-wrap">
            <View className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Search: {filters.search}</Text>
              <TouchableOpacity onPress={() => { setSearchQuery(""); setFilters({ ...filters, search: "" }); }} className="ml-2">
                <Icon name="close" size={16} color={isDarkMode ? "#9CA3AF" : "#6b7280"} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sort Options - Only apply when clicked */}
        <View className="flex-row px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {[
                { id: "code", label: "Code", icon: "sort-alphabetical-ascending" },
                { id: "name", label: "Name", icon: "sort-alphabetical-ascending" },
                { id: "date", label: "Date", icon: "calendar" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => handleSort(option.id)}
                  className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${
                    sortBy === option.id
                      ? "bg-blue-500 border-blue-500"
                      : isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}
                >
                  <Icon name={option.icon} size={16} color={sortBy === option.id ? "#ffffff" : isDarkMode ? "#9CA3AF" : "#4b5563"} />
                  <Text className={`ml-2 text-sm ${sortBy === option.id ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Page Indicator */}
        <View className="px-4 py-2 flex-row justify-between items-center">
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {totalUnits > 0 ? `Showing ${safeUnits.length} of ${totalUnits} units` : `${safeUnits.length} units`}
          </Text>
          <Text className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Page {currentPage}/{lastPage}
          </Text>
        </View>

        {/* Unit List - Pass sortBy to apply sorting in the list */}
        <UnitList
          units={safeUnits}
          viewMode={viewMode}
          searchQuery={searchQuery}
          sortBy={sortBy}
          loading={loading && safeUnits.length === 0}
          onRefresh={handleRefresh}
          onEdit={handleEditUnit}
          onDelete={handleDeleteUnit}
        />

        {/* Loading More Indicator */}
        {(isLoadingMore || loadingMore) && (
          <View className="py-6 items-center">
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading more units...
            </Text>
          </View>
        )}

        {/* No More Units */}
        {!hasMore && safeUnits.length > 0 && safeUnits.length === totalUnits && (
          <View className="py-4 items-center">
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No more units to load
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Unit Modal */}
      <Modal visible={showAddForm || showEditForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancelForm}>
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <View className={`px-4 pt-12 pb-4 flex-row items-center border-b ${isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
            <TouchableOpacity onPress={handleCancelForm} className="p-2">
              <Icon name="arrow-left" size={24} color={isDarkMode ? "#FFFFFF" : "#1F2937"} />
            </TouchableOpacity>
            <Text className={`flex-1 text-center text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              {showEditForm ? "Edit Unit" : "Add New Unit"}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView className="flex-1 px-4 pt-4">
            <UnitForm
              initialData={selectedUnit}
              mode={showEditForm ? "edit" : "add"}
              onSubmit={handleSubmitUnit}
              onCancel={handleCancelForm}
              isSubmitting={formSubmitting}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Success Modal */}
      <SuccessModal visible={showSuccessModal} message={successMessage} onClose={() => setShowSuccessModal(false)} autoClose={true} autoCloseDelay={2000} />
    </View>
  );
};

export default UnitsScreen;