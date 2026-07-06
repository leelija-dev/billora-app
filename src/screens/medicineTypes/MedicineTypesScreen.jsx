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
import useMedicineTypeStore from "../../store/medicineTypeStore";
import { useThemeStore } from "../../store/themeStore";

const { width } = Dimensions.get("window");

const MedicineTypesScreen = ({ navigation }) => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const {
    medicineTypes,
    totalMedicineTypes,
    loading,
    error,
    fetchMedicineTypes,
    createMedicineType,
    updateMedicineType,
    deleteMedicineType,
    setFilters,
    clearError,
  } = useMedicineTypeStore();

  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMedicineType, setSelectedMedicineType] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
    name: "",
    is_active: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load medicine types on mount
  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      if (user?.id) {
        fetchMedicineTypes(user.id).finally(() => {
          setInitialLoading(false);
        });
      }
      return () => {};
    }, [user?.id, fetchMedicineTypes])
  );

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchText !== "") {
        setFilters({ search: searchText });
        if (user?.id) {
          fetchMedicineTypes(user.id);
        }
      } else if (searchText === "") {
        setFilters({ search: "" });
        if (user?.id) {
          fetchMedicineTypes(user.id);
        }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, setFilters, fetchMedicineTypes, user?.id]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      await fetchMedicineTypes(user.id);
    }
    setRefreshing(false);
  }, [fetchMedicineTypes, user?.id]);

  // Navigate to create medicine type
  const handleCreateMedicineType = () => {
    setIsEditMode(false);
    setSelectedMedicineType(null);
    setFormData({ name: "", is_active: true });
    setModalVisible(true);
  };

  // Navigate to edit medicine type
  const handleEditMedicineType = (medicineType) => {
    setIsEditMode(true);
    setSelectedMedicineType(medicineType);
    setFormData({
      name: medicineType.name || "",
      is_active: medicineType.is_active === 1 || medicineType.is_active === true,
    });
    setModalVisible(true);
  };

  // Handle medicine type deletion with confirmation modal
  const handleDeleteMedicineType = (medicineTypeId) => {
    setDeleteConfirmId(medicineTypeId);
    setConfirmationModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    setIsDeleting(true);
    try {
      const result = await deleteMedicineType(deleteConfirmId);
      if (result.success) {
        setSuccessMessage("Medicine type deleted successfully");
        setSuccessModalVisible(true);
        if (user?.id) {
          await fetchMedicineTypes(user.id);
        }
      } else {
        setErrorMessage(result.error || "Failed to delete medicine type");
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
    if (!formData.name.trim()) {
      setErrorMessage("Please enter a medicine type name");
      setErrorModalVisible(true);
      return;
    }

    setFormSubmitting(true);
    try {
      const dataWithUser = {
        ...formData,
        user_id: user.id,
      };

      if (isEditMode && selectedMedicineType) {
        const result = await updateMedicineType(selectedMedicineType.id, dataWithUser);
        if (result) {
          setSuccessMessage("Medicine type updated successfully");
          setSuccessModalVisible(true);
        }
      } else {
        const result = await createMedicineType(dataWithUser);
        if (result) {
          setSuccessMessage("Medicine type created successfully");
          setSuccessModalVisible(true);
        }
      }

      setModalVisible(false);
      if (user?.id) {
        await fetchMedicineTypes(user.id);
      }
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
      await fetchMedicineTypes(user.id);
    }
    setRefreshing(false);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Loading state
  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"}
        />
        <Header title="Medicine Types" showBack={false} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text
            className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            Loading medicine types...
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
        title="Medicine Types"
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
              onPress={handleCreateMedicineType}
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
              placeholder="Search medicine types..."
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
          {totalMedicineTypes > 0
            ? `${totalMedicineTypes} medicine types`
            : `${medicineTypes.length} medicine types`}
        </Text>
      </View>

      {/* Medicine Types List with RefreshControl */}
      <ScrollView
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
        showsVerticalScrollIndicator={false}
      >
        {loading && medicineTypes.length === 0 ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text
              className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Loading medicine types...
            </Text>
          </View>
        ) : medicineTypes.length === 0 ? (
          <View className="py-20 items-center">
            <Icon
              name="medical-bag"
              size={80}
              color={isDarkMode ? "#334155" : "#D1D5DB"}
            />
            <Text
              className={`text-lg mt-4 text-center ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              No medicine types found
            </Text>
            <Text
              className={`text-sm mt-2 text-center ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {searchText
                ? "Try adjusting your search"
                : "Add your first medicine type"}
            </Text>
          </View>
        ) : (
          medicineTypes.map((medicineType) => (
            <TouchableOpacity
              key={medicineType.id}
              onPress={() => handleEditMedicineType(medicineType)}
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
                      {medicineType.name || "Unnamed"}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Created: {formatDate(medicineType.created_at)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => handleEditMedicineType(medicineType)}
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
                      onPress={() => handleDeleteMedicineType(medicineType.id)}
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

                {/* Status Badge */}
                <View className="mt-3">
                  <View
                    className={`px-3 py-1 rounded-full self-start ${
                      medicineType.is_active === 1 || medicineType.is_active === true
                        ? "bg-green-100 dark:bg-green-900/20"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        medicineType.is_active === 1 || medicineType.is_active === true
                          ? "text-green-700 dark:text-green-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {medicineType.is_active === 1 || medicineType.is_active === true
                        ? "Active"
                        : "Inactive"}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
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
              {isEditMode ? "Edit Medicine Type" : "Add Medicine Type"}
            </Text>

            {/* Name Input */}
            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Medicine Type Name *
              </Text>
              <TextInput
                className={`h-12 rounded-xl px-4 border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
                placeholder="Enter medicine type name"
                placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
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
        title="Delete Medicine Type"
        message="Are you sure you want to delete this medicine type? This action cannot be undone."
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

export default MedicineTypesScreen;
