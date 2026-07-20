// screens/social-link/SocialLinkScreen.jsx
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Ionicons } from "@expo/vector-icons";
import Header from "../../components/common/Header";
import { useAuthStore } from "../../store/authStore";
import useSocialStore from "../../store/socialStore";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import Toast from "react-native-toast-message";
import {
  SuccessModal,
  ErrorModal,
  ConfirmationModal,
} from "../../components/common/CustomModal";

const { width } = Dimensions.get("window");

const SocialLinkScreen = () => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();
  const {
    socialData,
    isConnected,
    loading,
    fetchSocialStatus,
    updateSocialStatus,
    reset,
  } = useSocialStore();

  const [isConnecting, setIsConnecting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Get filtered menu items from permission store
  const menuItems = getFilteredMenuItems().map((item) => ({
    id: item.id,
    title: item.name,
    screen: item.screen,
    icon: item.icon,
    iconActive: item.iconActive,
    badge: item.badge || null,
  }));

  // Get API base URL
  const API_BASE_URL = "https://api.thefastbill.com/api";

  // Fetch social status on mount
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadSocialStatus();
      }
      return () => {
        reset();
      };
    }, [user?.id])
  );

  const loadSocialStatus = async () => {
    try {
      setInitialLoading(true);
      await fetchSocialStatus(user.id);
    } catch (error) {
      console.error("Failed to fetch social status:", error);
      setErrorMessage("Failed to load social status");
      setErrorModalVisible(true);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const redirectUrl = `${API_BASE_URL}/social/facebook/redirect`;
      await Linking.openURL(redirectUrl);
    } catch (error) {
      console.error("Failed to connect Facebook:", error);
      setErrorMessage("Failed to connect Facebook");
      setErrorModalVisible(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!user?.id) {
      setErrorMessage("User ID not found");
      setErrorModalVisible(true);
      return;
    }

    setIsToggling(true);
    try {
      await updateSocialStatus(user.id, status);
      setSuccessMessage(
        status === 1 
          ? "Facebook connected successfully" 
          : "Facebook disconnected successfully"
      );
      setSuccessModalVisible(true);
    } catch (error) {
      console.error("Failed to update status:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to update status"
      );
      setErrorModalVisible(true);
    } finally {
      setIsToggling(false);
    }
  };

  const handleToggle = () => {
    if (!socialData) return;
    setConfirmationModalVisible(true);
  };

  const confirmToggle = async () => {
    setConfirmationModalVisible(false);
    const newStatus = isConnected ? 0 : 1;
    await handleStatusUpdate(newStatus);
  };

  const hasInstagram = socialData?.instagram_business_id && socialData.instagram_business_id !== 'N/A';
  const isInstagramConnected = hasInstagram && isConnected;

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSocialStatus();
    setRefreshing(false);
  }, []);

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <StatusBar 
          barStyle={isDarkMode ? "light-content" : "dark-content"} 
          backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"} 
        />
        <Header 
          title="Social Link" 
          userName={user?.name || "User"}
          userEmail={user?.email || "guest@example.com"}
          activeScreen="Social Link"
          navigationItems={menuItems}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Loading social status...
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
        title="Social Link"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Social Link"
        navigationItems={menuItems}
        rightComponent={
          <TouchableOpacity
            onPress={onRefresh}
            disabled={loading}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <Icon
              name="refresh"
              size={20}
              color={
                loading
                  ? isDarkMode ? "#4B5563" : "#9CA3AF"
                  : isDarkMode ? "#9CA3AF" : "#4b5563"
              }
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
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
        {/* Header Section */}
        <View className={`px-4 pt-6 pb-4 border-b ${
          isDarkMode ? "border-gray-800" : "border-gray-200"
        }`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                Social Media Management
              </Text>
              <Text className={`text-sm mt-1 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Connect and manage your social media accounts
              </Text>
            </View>
            <View className={`px-4 py-2 rounded-full ${
              isConnected 
                ? isDarkMode ? "bg-green-900/30" : "bg-green-100"
                : isDarkMode ? "bg-gray-800" : "bg-gray-100"
            }`}>
              <View className="flex-row items-center">
                <View className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? "bg-green-500" : "bg-gray-400"
                }`} />
                <Text className={`text-sm font-medium ${
                  isConnected 
                    ? isDarkMode ? "text-green-400" : "text-green-700"
                    : isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards Row */}
        <View className="px-4 py-4 flex-row flex-wrap">
          <View className={`w-[48%] mr-[2%] rounded-2xl p-4 shadow-sm ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className={`text-xs uppercase tracking-wider ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Status
                </Text>
                <Text className={`text-lg font-bold mt-1 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  {isConnected ? "Active" : "Inactive"}
                </Text>
              </View>
              <View className={`p-3 rounded-full ${
                isConnected 
                  ? isDarkMode ? "bg-green-900/30" : "bg-green-100"
                  : isDarkMode ? "bg-gray-700" : "bg-gray-100"
              }`}>
                <Icon 
                  name={isConnected ? "check-circle" : "circle-off"} 
                  size={24} 
                  color={isConnected ? "#10B981" : "#9CA3AF"} 
                />
              </View>
            </View>
          </View>

          <View className={`w-[48%] ml-[2%] rounded-2xl p-4 shadow-sm ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className={`text-xs uppercase tracking-wider ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Connected
                </Text>
                <Text className={`text-lg font-bold mt-1 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  {socialData ? "Facebook" : "None"}
                </Text>
              </View>
              <View className={`p-3 rounded-full ${
                isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
              }`}>
                <Icon name="link" size={24} color="#3B82F6" />
              </View>
            </View>
          </View>
        </View>

        {/* Facebook Main Card */}
        <View className={`mx-4 rounded-3xl shadow-sm overflow-hidden ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}>
          {/* Card Header */}
          <View className={`px-6 py-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`p-2 rounded-full ${
                  isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
                }`}>
                  <Icon name="facebook" size={28} color="#1877F2" />
                </View>
                <View className="ml-3">
                  <Text className={`font-bold text-lg ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Facebook Page
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {socialData ? "Connected" : "Not Connected"}
                  </Text>
                </View>
              </View>
              {socialData && (
                <View className={`px-3 py-1 rounded-full ${
                  isConnected 
                    ? isDarkMode ? "bg-green-900/30" : "bg-green-100"
                    : isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <Text className={`text-xs font-medium ${
                    isConnected 
                      ? isDarkMode ? "text-green-400" : "text-green-700"
                      : isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {isConnected ? "Active" : "Inactive"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Card Body */}
          <View className="p-6">
            {socialData ? (
              <>
                {/* Account Details */}
                <View className="mb-6">
                  <View className={`rounded-xl p-4 ${
                    isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                  }`}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className={`text-xs uppercase tracking-wider ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}>
                          Page Name
                        </Text>
                        <Text className={`text-base font-semibold mt-1 ${
                          isDarkMode ? "text-white" : "text-gray-900"
                        }`}>
                          {socialData.page_name || "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className={`w-2 h-2 rounded-full mr-2 ${
                          isConnected ? "bg-green-500" : "bg-red-500"
                        }`} />
                        <Text className={`text-sm font-medium ${
                          isConnected 
                            ? isDarkMode ? "text-green-400" : "text-green-700"
                            : isDarkMode ? "text-red-400" : "text-red-700"
                        }`}>
                          {isConnected ? "Active" : "Inactive"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Toggle Section */}
                <View className={`border-t pt-6 ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className={`text-base font-semibold ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}>
                        Auto-Posting
                      </Text>
                      <Text className={`text-sm mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        {isConnected 
                          ? "Auto-posting is currently enabled" 
                          : "Auto-posting is currently disabled"}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Text className={`text-xs font-medium mr-2 ${
                        !isConnected ? "text-gray-700" : "text-gray-400"
                      }`}>
                        OFF
                      </Text>
                      <Switch
                        value={isConnected}
                        onValueChange={handleToggle}
                        disabled={isToggling || !socialData}
                        trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                        thumbColor={isConnected ? "#FFFFFF" : "#FFFFFF"}
                        style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                      />
                      <Text className={`text-xs font-medium ml-2 ${
                        isConnected 
                          ? isDarkMode ? "text-blue-400" : "text-blue-600"
                          : "text-gray-400"
                      }`}>
                        ON
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4">
                    <View className={`flex-row items-center px-4 py-2 rounded-xl ${
                      isConnected 
                        ? isDarkMode ? "bg-green-900/30" : "bg-green-50" 
                        : isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                    }`}>
                      <Icon 
                        name={isConnected ? "check-circle" : "alert-circle"} 
                        size={20} 
                        color={isConnected ? "#10B981" : "#F59E0B"} 
                      />
                      <Text className={`ml-2 text-sm font-medium ${
                        isConnected 
                          ? isDarkMode ? "text-green-400" : "text-green-700"
                          : isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {isConnected 
                          ? "Auto-posting is ON for Facebook" 
                          : "Auto-posting is OFF for Facebook"}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              // Connect State
              <View className="items-center py-8">
                <View className={`p-4 rounded-full mb-4 ${
                  isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
                }`}>
                  <Icon name="facebook" size={48} color="#1877F2" />
                </View>
                <Text className={`text-lg font-bold text-center ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  Connect Your Facebook Page
                </Text>
                <Text className={`text-sm text-center mt-2 mb-6 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Link your Facebook page to enable auto-posting and manage your social presence
                </Text>
                <TouchableOpacity
                  onPress={handleConnect}
                  disabled={isConnecting}
                  className="bg-blue-600 px-8 py-4 rounded-2xl flex-row items-center shadow-lg"
                  style={{ shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
                >
                  {isConnecting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Icon name="link" size={24} color="#ffffff" />
                  )}
                  <Text className="text-white font-semibold text-base ml-3">
                    {isConnecting ? "Connecting..." : "Connect Facebook"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Instagram Card */}
        <View className={`mx-4 mt-4 rounded-3xl shadow-sm overflow-hidden ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <View className={`px-6 py-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className={`p-2 rounded-full ${
                  hasInstagram 
                    ? isDarkMode ? "bg-pink-900/30" : "bg-pink-50"
                    : isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <Icon name="instagram" size={28} color={hasInstagram ? "#E1306C" : "#9CA3AF"} />
                </View>
                <View className="ml-3">
                  <Text className={`font-bold text-lg ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    Instagram Business
                  </Text>
                  <Text className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {hasInstagram ? "Available" : "Not Available"}
                  </Text>
                </View>
              </View>
              {hasInstagram && (
                <View className={`px-3 py-1 rounded-full ${
                  isInstagramConnected 
                    ? isDarkMode ? "bg-green-900/30" : "bg-green-100"
                    : isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100"
                }`}>
                  <Text className={`text-xs font-medium ${
                    isInstagramConnected 
                      ? isDarkMode ? "text-green-400" : "text-green-700"
                      : isDarkMode ? "text-yellow-400" : "text-yellow-700"
                  }`}>
                    {isInstagramConnected ? "Connected" : "Pending"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="p-6">
            {hasInstagram ? (
              <>
                <View className={`rounded-xl p-4 mb-4 ${
                  isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className={`text-xs uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        Business Account
                      </Text>
                      <Text className={`text-base font-semibold mt-1 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}>
                        {socialData?.instagram_business_id || "N/A"}
                      </Text>
                    </View>
                    <View className={`flex-row items-center px-3 py-2 rounded-full ${
                      isInstagramConnected 
                        ? isDarkMode ? "bg-green-900/30" : "bg-green-100"
                        : isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100"
                    }`}>
                      <Icon 
                        name={isInstagramConnected ? "check-circle" : "alert"} 
                        size={16} 
                        color={isInstagramConnected ? "#10B981" : "#F59E0B"} 
                      />
                      <Text className={`ml-1.5 text-xs font-medium ${
                        isInstagramConnected 
                          ? isDarkMode ? "text-green-400" : "text-green-700"
                          : isDarkMode ? "text-yellow-400" : "text-yellow-700"
                      }`}>
                        {isInstagramConnected ? "Active" : "Waiting"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className={`rounded-xl p-4 ${
                  isDarkMode ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"
                }`}>
                  <View className="flex-row items-start">
                    <Icon name="information" size={20} color="#3B82F6" />
                    <View className="ml-3 flex-1">
                      <Text className={`text-sm font-medium ${
                        isDarkMode ? "text-blue-300" : "text-blue-800"
                      }`}>
                        Auto-Posting Status
                      </Text>
                      <Text className={`text-sm mt-1 ${
                        isDarkMode ? "text-blue-400" : "text-blue-700"
                      }`}>
                        {isConnected 
                          ? "✓ Instagram auto-posting is active and will work automatically" 
                          : "⚠️ Please connect Facebook to enable Instagram auto-posting"}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <View className="items-center py-6">
                <View className={`p-4 rounded-full mb-4 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <Icon name="instagram" size={40} color="#9CA3AF" />
                </View>
                <Text className={`text-base font-semibold text-center ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  No Instagram Business Account
                </Text>
                <Text className={`text-sm text-center mt-2 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Link an Instagram Business account to your Facebook page to enable Instagram auto-posting
                </Text>
              </View>
            )}
          </View>
        </View>

       
      </ScrollView>

      {/* Modals */}
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
        title={isConnected ? "Disable Auto-Posting" : "Enable Auto-Posting"}
        message={isConnected 
          ? "Are you sure you want to disable auto-posting? This will stop automatic posts to Facebook." 
          : "Are you sure you want to enable auto-posting? This will allow automatic posts to Facebook."}
        onConfirm={confirmToggle}
        onCancel={() => {
          setConfirmationModalVisible(false);
        }}
        confirmText={isConnected ? "Disable" : "Enable"}
        cancelText="Cancel"
        confirmButtonColor={isConnected ? "#EF4444" : "#3B82F6"}
        loading={isToggling}
      />
    </View>
  );
};

export default SocialLinkScreen;