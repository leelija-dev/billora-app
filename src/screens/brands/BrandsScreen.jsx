// screens/brands/BrandsScreen.js - Fixed with proper delete functionality

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import BrandFilters from "../../components/brands/BrandFilters";
import BrandForm from "../../components/brands/BrandForm";
import BrandList from "../../components/brands/BrandList";
import Header from "../../components/common/Header";
import { getNavigationItemsWithBadges } from "../../constants/navigationItems";
import { useAuthStore } from "../../store/authStore";
import useBrandStore from "../../store/brandStore";
import { useThemeStore } from "../../store/themeStore";

const BrandsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  // Get brand store state and actions
  const {
    brands = [],
    totalBrands,
    loading,
    error,
    filters,
    fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    setFilters,
  } = useBrandStore();

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const searchTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Get current user ID
  const getUserId = useCallback(() => {
    if (user && user.id) {
      return user.id.toString();
    }
    return "1";
  }, [user]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log("🔄 Fetching brands for user:", getUserId());
        await fetchBrands();
        console.log("✅ Brands fetched successfully");
      } catch (error) {
        console.error("❌ Failed to fetch brands:", error);
      } finally {
        if (isMounted.current) {
          setInitialLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fetchBrands, getUserId]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters({ search: searchQuery });
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, setFilters]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      console.log("Brands screen focused - refreshing data");
      handleRefresh();
      return () => {};
    }, []),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBrands();
    setRefreshing(false);
  };

  const handleAddBrand = () => {
    setSelectedBrand(null);
    setShowAddForm(true);
    setShowEditForm(false);
  };

  const handleEditBrand = (brand) => {
    setSelectedBrand(brand);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedBrand(null);
  };

  const handleSubmitBrand = async (brandData) => {
    setFormSubmitting(true);
    try {
      const userId = getUserId();
      const payload = {
        ...brandData,
        userId: userId,
        createdBy: userId,
      };

      if (showEditForm && selectedBrand) {
        await updateBrand(selectedBrand.id, payload);
        Alert.alert("Success", "Brand updated successfully");
      } else {
        await createBrand(payload);
        Alert.alert("Success", "Brand created successfully");
      }

      handleCancelForm();
      await handleRefresh();
    } catch (error) {
      Alert.alert(
        "Error",
        error.message ||
          `Failed to ${showEditForm ? "update" : "create"} brand`,
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Fixed delete brand function
  const handleDeleteBrand = (brand) => {
    setBrandToDelete(brand);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!brandToDelete) return;
    
    setDeleting(true);
    try {
      await deleteBrand(brandToDelete.id);
      setShowDeleteConfirm(false);
      setBrandToDelete(null);
      // Refresh the list to remove the deleted brand
      await fetchBrands();
      // Show success message
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert("Error", error.message || "Failed to delete brand");
    } finally {
      setDeleting(false);
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setSortBy(newFilters.sortBy || "name");
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({ search: "", status: "all", sortBy: "name", sortOrder: "asc" });
    setSearchQuery("");
    setSortBy("name");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Calculate stats
  const safeBrands = Array.isArray(brands) ? brands : [];
  const totalBrandsCount = totalBrands || safeBrands.length;
  const activeBrands = safeBrands.filter(
    (b) => b.is_active === true || b.is_active === 1,
  ).length;

  const latestUpdate = useMemo(() => {
    if (safeBrands.length === 0) return "N/A";
    const dates = safeBrands.map((b) =>
      b.updated_at ? new Date(b.updated_at).getTime() : 0,
    );
    const maxDate = new Date(Math.max(...dates));
    return maxDate.toLocaleDateString();
  }, [safeBrands]);

  const uniqueCreators = useMemo(() => {
    const creators = new Set();
    safeBrands.forEach((b) => {
      if (b.created_by) creators.add(b.created_by);
      else if (b.user_id) creators.add(`User ${b.user_id}`);
    });
    return creators.size;
  }, [safeBrands]);

  const navigationItems = useMemo(() => {
    const badges = {
      brands: totalBrandsCount.toString(),
    };
    return getNavigationItemsWithBadges(badges);
  }, [totalBrandsCount]);

  if (initialLoading) {
    return (
      <View
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} items-center justify-center`}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text
          className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          Loading brands...
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} pb-16`}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#111827" : "#ffffff"}
      />

      <Header
        title="Brands"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Brands"
        navigationItems={navigationItems}
        rightComponent={
          <View className="flex-row items-center">
            {/* View Toggle */}
            <TouchableOpacity
              onPress={toggleViewMode}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon
                name={viewMode === "grid" ? "view-grid" : "view-list"}
                size={22}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>

            {/* Refresh Button */}
            <TouchableOpacity
              onPress={handleRefresh}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Icon
                name="refresh"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#4b5563"}
              />
            </TouchableOpacity>

            {/* Add Brand Button */}
            <TouchableOpacity
              onPress={handleAddBrand}
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30"
            >
              <Icon name="plus" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2">
        <View
          className={`flex-row items-center rounded-2xl px-4 h-14 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        >
          <Icon name="magnify" size={22} color="#9ca3af" />
          <TextInput
            className={`flex-1 ml-3 text-base ${isDarkMode ? "text-white" : "text-gray-800"}`}
            placeholder="Search brands by name, description..."
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
            <Text className="text-white/80 text-xs">Total Brands</Text>
            <Text className="text-white text-2xl font-bold">
              {totalBrandsCount}
            </Text>
            <View className="flex-row items-center mt-1">
              <Icon name="trademark" size={16} color="#86efac" />
              <Text className="text-white/80 text-xs ml-1">All brands</Text>
            </View>
          </LinearGradient>

          <View
            className={`rounded-xl p-4 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <Text
              className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Active Brands
            </Text>
            <Text
              className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              {activeBrands}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {totalBrandsCount > 0
                  ? ((activeBrands / totalBrandsCount) * 100).toFixed(0)
                  : 0}
                % active
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row px-4 mb-4">
          <View
            className={`rounded-xl p-3 flex-1 mr-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="flex-row items-center">
              <Icon name="account" size={20} color="#8b5cf6" />
              <Text
                className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Creators
              </Text>
            </View>
            <Text
              className={`text-xl font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              {uniqueCreators}
            </Text>
            <Text
              className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
            >
              Unique users
            </Text>
          </View>

          <View
            className={`rounded-xl p-3 flex-1 ml-2 shadow-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="flex-row items-center">
              <Icon name="calendar" size={20} color="#f97316" />
              <Text
                className={`ml-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Latest Update
              </Text>
            </View>
            <Text
              className={`text-sm font-bold mt-1 ${isDarkMode ? "text-white" : "text-gray-800"}`}
              numberOfLines={1}
            >
              {latestUpdate}
            </Text>
            <Text
              className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
            >
              Recent activity
            </Text>
          </View>
        </View>

        {/* Filter Chips */}
        {(filters.status !== "all" || filters.search) && (
          <View className="px-4 mb-3 flex-row flex-wrap">
            {filters.status !== "all" && (
              <View
                className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
              >
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Status: {filters.status}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, status: "all" })}
                  className="ml-2"
                >
                  <Icon
                    name="close"
                    size={16}
                    color={isDarkMode ? "#9CA3AF" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            )}
            {filters.search && (
              <View
                className={`flex-row items-center mr-2 mb-2 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}
              >
                <Text
                  className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Search: {filters.search}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setFilters({ ...filters, search: "" });
                  }}
                  className="ml-2"
                >
                  <Icon
                    name="close"
                    size={16}
                    color={isDarkMode ? "#9CA3AF" : "#6b7280"}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Sort Options */}
        <View className="flex-row px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {[
                {
                  id: "name",
                  label: "Name",
                  icon: "sort-alphabetical-ascending",
                },
                { id: "date", label: "Date", icon: "calendar" },
                {
                  id: "status",
                  label: "Status",
                  icon: "checkbox-marked-circle-outline",
                },
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setSortBy(option.id)}
                  className={`flex-row items-center mr-2 px-4 py-2 rounded-full border ${
                    sortBy === option.id
                      ? "bg-blue-500 border-blue-500"
                      : isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                  }`}
                >
                  <Icon
                    name={option.icon}
                    size={16}
                    color={
                      sortBy === option.id
                        ? "#ffffff"
                        : isDarkMode
                          ? "#9CA3AF"
                          : "#4b5563"
                    }
                  />
                  <Text
                    className={`ml-2 text-sm ${sortBy === option.id ? "text-white" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Brand List */}
        <View className="flex-1 px-4 pb-4">
          <BrandList
            brands={safeBrands}
            viewMode={viewMode}
            sortBy={sortBy}
            loading={loading}
            onEdit={handleEditBrand}
            onDelete={handleDeleteBrand}
          />
        </View>
      </ScrollView>

      {/* Add/Edit Brand Modal */}
      <Modal
        visible={showAddForm || showEditForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelForm}
      >
        <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <View
            className={`px-4 pt-12 pb-4 flex-row items-center border-b ${isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}
          >
            <TouchableOpacity onPress={handleCancelForm} className="p-2">
              <Icon
                name="arrow-left"
                size={24}
                color={isDarkMode ? "#FFFFFF" : "#1F2937"}
              />
            </TouchableOpacity>
            <Text
              className={`flex-1 text-center text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              {showEditForm ? "Edit Brand" : "Add New Brand"}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView className="flex-1 px-4 pt-4">
            <BrandForm
              initialData={selectedBrand}
              mode={showEditForm ? "edit" : "add"}
              onSubmit={handleSubmitBrand}
              onCancel={handleCancelForm}
              isSubmitting={formSubmitting}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <View className="flex-1 items-center justify-center px-4">
            <View
              className={`rounded-2xl p-6 w-full max-w-sm ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <View className="items-center mb-4">
                <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-3">
                  <Icon name="alert-circle" size={32} color="#ef4444" />
                </View>
                <Text
                  className={`text-lg font-semibold text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}
                >
                  Delete Brand
                </Text>
                <Text
                  className={`text-sm text-center mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  Are you sure you want to delete "{brandToDelete?.name}"? This
                  action cannot be undone.
                </Text>
              </View>

              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600"
                >
                  <Text
                    className={`text-center font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-red-500 flex-row items-center justify-center"
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text className="text-white text-center font-medium">Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setShowSuccessModal(false)}
        >
          <View className="flex-1 items-center justify-center px-4">
            <View
              className={`rounded-2xl p-6 w-full max-w-sm items-center ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            >
              <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-3">
                <Icon name="check-circle" size={32} color="#10b981" />
              </View>
              <Text
                className={`text-lg font-semibold text-center ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                Success!
              </Text>
              <Text
                className={`text-sm text-center mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Brand has been deleted successfully.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filters Modal */}
      <BrandFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={filters}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

export default BrandsScreen;