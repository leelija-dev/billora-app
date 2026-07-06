import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import {
  ConfirmationModal,
  ErrorModal,
  SuccessModal,
} from "../../components/common/CustomModal";
import Header from "../../components/common/Header";
import { useAuthStore } from "../../store/authStore";
import { usePackageStore } from "../../store/packageStore";
import { useThemeStore } from "../../store/themeStore";

const { width } = Dimensions.get("window");

const PackagesScreen = ({ navigation }) => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const {
    packages,
    totalPackages,
    loading,
    loadingMore,
    hasMore,
    currentPage,
    lastPage,
    fetchPackages,
    loadMorePackages,
    createPackage,
    updatePackage,
    deletePackage,
    setFilters,
    clearError,
  } = usePackageStore();

  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasTriggeredLoadMore, setHasTriggeredLoadMore] = useState(false);

  // Modal states
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    package_name: "",
    package_price: "",
    package_size: "",
    is_active: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const scrollViewRef = useRef(null);

  // Load packages on mount
  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      if (user?.id) {
        fetchPackages(1, user.id, false).finally(() => {
          setInitialLoading(false);
        });
      }
      return () => {};
    }, [user?.id, fetchPackages])
  );

  // Reset trigger flag when loading more is complete
  useEffect(() => {
    if (!isLoadingMore && !loadingMore) {
      setHasTriggeredLoadMore(false);
    }
  }, [isLoadingMore, loadingMore]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText !== "") {
        setFilters({ search: searchText });
        if (user?.id) {
          fetchPackages(1, user.id, false);
        }
      } else if (searchText === "") {
        setFilters({ search: "" });
        if (user?.id) {
          fetchPackages(1, user.id, false);
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, setFilters, fetchPackages, user?.id]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchPackages(1, user.id, false);
    }
    setRefreshing(false);
  }, [fetchPackages, user?.id]);

  // Handle load more with proper conditions
  const handleLoadMore = useCallback(async () => {
    // Check conditions properly
    if (isLoadingMore || loadingMore || loading) {
      console.log('⏭️ Skipping - already loading');
      return;
    }
    
    if (!hasMore) {
      console.log('⏭️ Skipping - no more data');
      return;
    }

    if (currentPage >= lastPage) {
      console.log('⏭️ Skipping - reached last page');
      return;
    }

    console.log(`📜 Triggering loadMorePackages - currentPage: ${currentPage}, lastPage: ${lastPage}`);
    setIsLoadingMore(true);
    await loadMorePackages(user.id);
    setIsLoadingMore(false);
    setHasTriggeredLoadMore(false);
  }, [isLoadingMore, loadingMore, loading, hasMore, currentPage, lastPage, loadMorePackages, user?.id]);

  // Handle scroll for pagination
  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollPosition = contentOffset.y;
    const scrollViewHeight = layoutMeasurement.height;
    const totalContentHeight = contentSize.height;
    
    // Calculate scroll percentage
    const maxScroll = totalContentHeight - scrollViewHeight;
    const scrollPercentage = maxScroll > 0 ? (currentScrollPosition / maxScroll) * 100 : 0;
    
    // Check if user has scrolled 50% of the screen height
    const triggerThreshold = 50;
    const shouldLoadMore = scrollPercentage >= triggerThreshold;
    
    if (shouldLoadMore && !hasTriggeredLoadMore && !isLoadingMore && !loadingMore && hasMore && !loading) {
      console.log(`🎯 Triggering load more at ${Math.floor(scrollPercentage)}% scroll`);
      setHasTriggeredLoadMore(true);
      handleLoadMore();
    }
  }, [hasTriggeredLoadMore, isLoadingMore, loadingMore, hasMore, loading, handleLoadMore]);

  // Navigate to create package
  const handleCreatePackage = () => {
    setIsEditMode(false);
    setSelectedPackage(null);
    setFormData({ package_name: "", package_price: "", package_size: "", is_active: true });
    setModalVisible(true);
  };

  // Navigate to edit package
  const handleEditPackage = (pkg) => {
    setIsEditMode(true);
    setSelectedPackage(pkg);
    setFormData({
      package_name: pkg.package_name || "",
      package_price: pkg.package_price?.toString() || "",
      package_size: pkg.package_size || "",
      is_active: pkg.is_active === 1 || pkg.is_active === true,
    });
    setModalVisible(true);
  };

  // Handle package deletion with confirmation modal
  const handleDeletePackage = (packageId) => {
    setDeleteConfirmId(packageId);
    setConfirmationModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    setIsDeleting(true);
    try {
      const result = await deletePackage(deleteConfirmId);
      if (result.success) {
        setSuccessMessage("Package deleted successfully");
        setSuccessModalVisible(true);
      } else {
        setErrorMessage(result.error || "Failed to delete package");
        setErrorModalVisible(true);
      }
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred");
      setErrorModalVisible(true);
    } finally {
      setIsDeleting(false);
      setConfirmationModalVisible(false);
      setDeleteConfirmId(null);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.package_name.trim()) {
      setErrorMessage("Please enter a package name");
      setErrorModalVisible(true);
      return;
    }

    if (!formData.package_price.trim()) {
      setErrorMessage("Please enter a package price");
      setErrorModalVisible(true);
      return;
    }

    setFormSubmitting(true);
    try {
      const dataWithUser = {
        ...formData,
        package_price: parseFloat(formData.package_price),
      };

      if (isEditMode && selectedPackage) {
        const result = await updatePackage(selectedPackage.id, dataWithUser);
        if (result.success) {
          setSuccessMessage("Package updated successfully");
          setSuccessModalVisible(true);
        }
      } else {
        const result = await createPackage(user.id, dataWithUser);
        if (result.success) {
          setSuccessMessage("Package created successfully");
          setSuccessModalVisible(true);
        }
      }

      setModalVisible(false);
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred");
      setErrorModalVisible(true);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchPackages(1, user.id, false);
    }
    setRefreshing(false);
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return "₹0.00";
    return `₹${parseFloat(price).toFixed(2)}`;
  };

  // Loading state
  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"}
        />
        <Header title="Packages" showBack={false} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text
            className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            Loading packages...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"}
      />

      <Header
        title="Packages"
        showBack={false}
        rightComponent={
          <View className="flex-row items-center">
            {/* Refresh Button */}
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={loading}
              className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Icon
                name="refresh"
                size={20}
                color={
                  loading
                    ? isDarkMode
                      ? "#4B5563"
                      : "#9CA3AF"
                    : isDarkMode
                      ? "#9CA3AF"
                      : "#4b5563"
                }
              />
            </TouchableOpacity>

            {/* Add Button */}
            <TouchableOpacity
              onPress={handleCreatePackage}
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center shadow-md shadow-blue-500/30"
            >
              <Icon name="plus" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <View
        className={`px-4 py-3 border-b ${
          isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        }`}
      >
        <View className="flex-row items-center">
          <View
            className={`flex-1 flex-row items-center h-12 rounded-2xl px-4 border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={isDarkMode ? "#9CA3AF" : "#6B7280"}
            />

            <TextInput
              className={`flex-1 ml-3 text-[15px] ${
                isDarkMode ? "text-white" : "text-gray-800"
              }`}
              placeholder="Search packages..."
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={searchText}
              onChangeText={setSearchText}
              clearButtonMode="while-editing"
            />

            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Page Indicator */}
      <View
        className={`px-4 py-2 flex-row justify-between items-center border-b ${
          isDarkMode ? "border-gray-800" : "border-gray-100"
        }`}
      >
        <Text
          className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          {totalPackages > 0
            ? `Showing ${packages.length} of ${totalPackages} packages`
            : `${packages.length} packages`}
        </Text>
        <Text
          className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Page {currentPage}/{lastPage}
        </Text>
      </View>

      {/* Packages List with RefreshControl and Infinite Scroll */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor={isDarkMode ? "#F9FAFB" : "#3B82F6"}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {loading && packages.length === 0 ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text
              className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Loading packages...
            </Text>
          </View>
        ) : packages.length === 0 ? (
          <View className="py-20 items-center">
            <Icon
              name="package-variant"
              size={80}
              color={isDarkMode ? "#334155" : "#D1D5DB"}
            />
            <Text
              className={`text-lg mt-4 text-center ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              No packages found
            </Text>
            <Text
              className={`text-sm mt-2 text-center ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {searchText
                ? "Try adjusting your search"
                : "Add your first package"}
            </Text>
          </View>
        ) : (
          packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              onPress={() => handleEditPackage(pkg)}
              className={`rounded-2xl p-4 mb-3 border ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-base font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {pkg.package_name || "Unnamed Package"}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {pkg.package_size || "N/A"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => handleEditPackage(pkg)}
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: isDarkMode
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)",
                      }}
                    >
                      <Icon
                        name="pencil"
                        size={16}
                        color={isDarkMode ? "#94A3B8" : "#64748B"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePackage(pkg.id)}
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: isDarkMode
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)",
                      }}
                    >
                      <Icon
                        name="delete"
                        size={16}
                        color={isDarkMode ? "#EF4444" : "#DC2626"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Price */}
                <View className="mt-3">
                  <Text
                    className={`text-xl font-bold text-green-600 dark:text-green-400`}
                  >
                    {formatPrice(pkg.package_price)}
                  </Text>
                </View>

                {/* Status Badge */}
                <View className="mt-3">
                  <View
                    className={`px-3 py-1 rounded-full self-start ${
                      pkg.is_active === 1 || pkg.is_active === true
                        ? "bg-green-100 dark:bg-green-900/20"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        pkg.is_active === 1 || pkg.is_active === true
                          ? "text-green-700 dark:text-green-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {pkg.is_active === 1 || pkg.is_active === true
                        ? "Active"
                        : "Inactive"}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Loading More Indicator */}
        {(isLoadingMore || loadingMore) && (
          <View className="py-6 items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text
              className={`mt-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Loading more packages...
            </Text>
          </View>
        )}

        {/* No More Packages */}
        {!hasMore && packages.length > 0 && packages.length === totalPackages && (
          <View className="py-4 items-center">
            <Text
              className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              No more packages to load
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className={`rounded-t-3xl p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="items-center mb-4">
              <View
                className={`w-12 h-1 rounded-full ${
                  isDarkMode ? "bg-gray-600" : "bg-gray-300"
                }`}
              />
            </View>

            <Text
              className={`text-xl font-bold mb-6 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {isEditMode ? "Edit Package" : "Add Package"}
            </Text>

            {/* Package Name Input */}
            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Package Name *
              </Text>
              <TextInput
                className={`h-12 rounded-xl px-4 border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
                placeholder="Enter package name"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.package_name}
                onChangeText={(text) => setFormData({ ...formData, package_name: text })}
              />
            </View>

            {/* Package Price Input */}
            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Package Price *
              </Text>
              <TextInput
                className={`h-12 rounded-xl px-4 border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
                placeholder="Enter package price"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.package_price}
                onChangeText={(text) => setFormData({ ...formData, package_price: text })}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Package Size Input */}
            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Package Size
              </Text>
              <TextInput
                className={`h-12 rounded-xl px-4 border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
                placeholder="Enter package size (e.g., Small, Medium, Large)"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.package_size}
                onChangeText={(text) => setFormData({ ...formData, package_size: text })}
              />
            </View>

            {/* Active Toggle */}
            <TouchableOpacity
              onPress={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`flex-row items-center justify-between p-4 rounded-xl mb-6 border ${
                isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isDarkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Active Status
              </Text>
              <View
                className={`w-12 h-7 rounded-full p-1 ${
                  formData.is_active ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full bg-white shadow ${
                    formData.is_active ? "ml-auto" : ""
                  }`}
                />
              </View>
            </TouchableOpacity>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className={`flex-1 py-3 rounded-xl ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={formSubmitting}
                className="flex-1 bg-blue-500 py-3 rounded-xl"
              >
                {formSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-center text-white font-semibold">
                    {isEditMode ? "Update" : "Create"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Modals for Feedback */}
      <SuccessModal
        visible={successModalVisible}
        message={successMessage}
        onClose={() => setSuccessModalVisible(false)}
        autoClose={true}
        autoCloseDelay={2500}
      />

      <ErrorModal
        visible={errorModalVisible}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />

      <ConfirmationModal
        visible={confirmationModalVisible}
        title="Delete Package"
        message="Are you sure you want to delete this package? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmationModalVisible(false);
          setDeleteConfirmId(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
        loading={isDeleting}
      />
    </View>
  );
};

export default PackagesScreen;
