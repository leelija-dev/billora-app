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
    filters,
    fetchUnits,
    createUnit,
    updateUnit,
    deleteUnit,
    setFilters,
    setPage,
    currentPage,
    lastPage,
  } = useUnitStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  const searchTimeoutRef = useRef(null);
  const isMounted = useRef(true);

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

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchUnits();
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
  }, []);

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
      fetchUnits();
      return () => {};
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUnits();
    setRefreshing(false);
  };

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
      await fetchUnits();
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
        await fetchUnits();
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

  const handleSort = (sortKey) => {
    setSortBy(sortKey);
    setFilters({ sortBy: sortKey });
  };

  // Calculate stats
  const safeUnits = Array.isArray(units) ? units : [];
  const totalUnitsCount = totalUnits || safeUnits.length;
  const activeUnitsCount = safeUnits.filter(u => u.is_active === 1 || u.is_active === true).length;

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading units...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} pb-16`}>
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
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#3b82f6"]} tintColor={isDarkMode ? "#ffffff" : "#3b82f6"} />}
      >
        {/* Stats Cards */}
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
              <Icon name="check-circle" size={16} color="#10b981" />
              <Text className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} ml-1`}>Active units</Text>
            </View>
          </View>
        </View>

        {/* Sort Options */}
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

        {/* Unit List */}
        <UnitList
          units={units}
          viewMode={viewMode}
          searchQuery={searchQuery}
          sortBy={sortBy}
          loading={loading}
          onRefresh={handleRefresh}
          onEdit={handleEditUnit}
          onDelete={handleDeleteUnit}
        />

        {/* Pagination */}
        {lastPage > 1 && (
          <View className="flex-row items-center justify-center py-4 space-x-2">
            <TouchableOpacity
              onPress={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border ${currentPage === 1 ? "border-gray-200 dark:border-gray-700 opacity-40" : "border-gray-300 dark:border-gray-600"}`}
            >
              <Icon name="chevron-left" size={18} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
            <Text className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Page {currentPage} of {lastPage}
            </Text>
            <TouchableOpacity
              onPress={() => setPage(currentPage + 1)}
              disabled={currentPage === lastPage}
              className={`p-2 rounded-lg border ${currentPage === lastPage ? "border-gray-200 dark:border-gray-700 opacity-40" : "border-gray-300 dark:border-gray-600"}`}
            >
              <Icon name="chevron-right" size={18} color={isDarkMode ? "#9CA3AF" : "#4b5563"} />
            </TouchableOpacity>
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