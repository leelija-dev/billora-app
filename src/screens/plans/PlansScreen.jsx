// screens/plans/PlansScreen.jsx
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import PaymentHistory from "../../components/billing/PaymentHistory";
import SubscriptionCard from "../../components/billing/SubscriptionCard";
import {
  ConfirmationModal,
  ErrorModal,
  SuccessModal,
} from "../../components/common/CustomModal";
import Header from "../../components/common/Header";
import { useAuthStore } from "../../store/authStore";
import useBillingStore from "../../store/billingStore";
import { usePermissionStore } from "../../store/permissionStore";
import { useThemeStore } from "../../store/themeStore";

const { width } = Dimensions.get("window");

const PlansScreen = () => {
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { getFilteredMenuItems } = usePermissionStore();
  const {
    plans,
    subscription,
    payments,
    paymentsCount,
    recentPlanData,
    loading,
    fetchPlans,
    fetchPaymentHistory,
    fetchRecentPlan,
    fetchSubscription,
    reset,
  } = useBillingStore();

  const [initialLoading, setInitialLoading] = useState(true);
  const [planMode, setPlanMode] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelAction, setCancelAction] = useState(null);

  // Get filtered menu items
  const menuItems = getFilteredMenuItems().map((item) => ({
    id: item.id,
    title: item.name,
    screen: item.screen,
    icon: item.icon,
    iconActive: item.iconActive,
    badge: item.badge || null,
  }));

  // Get user ID
  const getUserId = useCallback(() => {
    if (user && user.id) return user.id.toString();
    return "1";
  }, [user?.id]);

  // Load data on mount
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadData();
      }
      return () => {
        reset();
      };
    }, [user?.id]),
  );

  const loadData = async () => {
    try {
      setInitialLoading(true);

      // Check plan mode from user
      if (user?.plan_mode) {
        setPlanMode(user.plan_mode);
      }

      if (user?.plan_mode === "paid") {
        await Promise.all([
          fetchPlans(),
          fetchPaymentHistory(getUserId(), 1, 10),
          fetchRecentPlan(getUserId()),
          fetchSubscription(getUserId()),
        ]);
      }
    } catch (error) {
      console.error("Failed to load plans data:", error);
      setErrorMessage("Failed to load billing information");
      setErrorModalVisible(true);
    } finally {
      setInitialLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Handle purchase plan
  const handlePurchasePlan = () => {
    const pricingUrl = "https://thefastbill.com/pricing";
    Linking.openURL(pricingUrl).catch((err) => {
      console.error("Failed to open pricing page:", err);
      setErrorMessage("Failed to open pricing page");
      setErrorModalVisible(true);
    });
  };

  // Handle view plans
  const handleViewPlans = () => {
    const pricingUrl = "https://thefastbill.com/pricing";
    Linking.openURL(pricingUrl).catch((err) => {
      console.error("Failed to open pricing page:", err);
      setErrorMessage("Failed to open pricing page");
      setErrorModalVisible(true);
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
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

  // Get current plan from subscription
  const currentPlan =
    subscription?.planDetails ||
    plans.find((p) => p.id === subscription?.planId);

  // Handle upgrade - redirect to website
  const handleUpgrade = () => {
    const pricingUrl = "https://thefastbill.com/pricing";
    Linking.openURL(pricingUrl).catch((err) => {
      console.error("Failed to open pricing page:", err);
      setErrorMessage("Failed to open pricing page");
      setErrorModalVisible(true);
    });
  };

  // Handle renew - redirect to website
  const handleRenew = () => {
    const pricingUrl = "https://thefastbill.com/pricing";
    Linking.openURL(pricingUrl).catch((err) => {
      console.error("Failed to open pricing page:", err);
      setErrorMessage("Failed to open pricing page");
      setErrorModalVisible(true);
    });
  };

  // Handle cancel confirmation
  const handleCancel = () => {
    setCancelAction("cancel");
    setConfirmationModalVisible(true);
  };

  const confirmCancel = async () => {
    setConfirmationModalVisible(false);
    setIsProcessing(true);

    try {
      // Simulate cancel API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccessMessage("Subscription cancelled successfully");
      setSuccessModalVisible(true);
      // Refresh data
      await loadData();
    } catch (error) {
      setErrorMessage("Failed to cancel subscription");
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get plan details
  const getPlanDetails = () => {
    if (!currentPlan) return null;

    const features = [];
    const planName = currentPlan.name || currentPlan.plan_name || "Basic";

    if (planName.toLowerCase().includes("pro")) {
      features.push(
        "Advanced Analytics",
        "Priority Support",
        "Unlimited Posts",
        "Team Collaboration",
      );
    } else if (planName.toLowerCase().includes("premium")) {
      features.push(
        "All Pro Features",
        "AI Content Generation",
        "Advanced Scheduling",
        "24/7 Support",
      );
    } else {
      features.push(
        "Social Media Management",
        "Analytics Dashboard",
        "Post Scheduling",
        "Basic Support",
      );
    }

    return {
      name: planName,
      price: currentPlan.price || currentPlan.amount || 0,
      features: features,
      status: subscription?.status || "active",
    };
  };

  // Render Stats Cards
  const renderStatsCards = () => {
    if (planMode !== "paid") return null;

    const planInfo = getPlanDetails();
    if (!planInfo) return null;

    const statsData = [
      {
        id: 1,
        title: "Plan Type",
        value: planInfo.name,
        icon: "crown",
        color: "#8B5CF6",
      },
      {
        id: 2,
        title: "Amount",
        value: formatCurrency(planInfo.price),
        icon: "currency-inr",
        color: "#10B981",
      },
      {
        id: 3,
        title: "Status",
        value: subscription?.status === "active" ? "Active" : "Inactive",
        icon: subscription?.status === "active" ? "check-circle" : "clock",
        color: subscription?.status === "active" ? "#10B981" : "#F59E0B",
      },
      {
        id: 4,
        title: "Posts Used",
        value: "45",
        icon: "post",
        color: "#3B82F6",
      },
    ];

    return (
      <View className="px-4 py-4">
        <Text
          className={`text-lg font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
        >
          Plan Overview
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {statsData.map((item) => (
            <View key={item.id} className="w-[48%] mb-3">
              <View
                className={`rounded-2xl p-4 shadow-sm ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-xs uppercase tracking-wider ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {item.title}
                    </Text>
                    <Text
                      className={`text-sm font-semibold mt-1 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                      numberOfLines={1}
                    >
                      {item.value}
                    </Text>
                  </View>
                  <View
                    className={`p-2 rounded-full ${
                      isDarkMode ? "bg-opacity-20" : "bg-opacity-10"
                    }`}
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon name={item.icon} size={20} color={item.color} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render Trial Banner
  const renderTrialBanner = () => {
    if (planMode !== "trial") return null;

    return (
      <View className="px-4 pt-6">
        <View
          className={`rounded-3xl p-6 border ${
            isDarkMode
              ? "bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-800"
              : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
          }`}
        >
          <View className="flex-row items-start">
            <View
              className={`p-3 rounded-full ${
                isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
              }`}
            >
              <Icon name="panda" size={28} color="#3B82F6" />
            </View>
            <View className="ml-4 flex-1">
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-lg font-bold ${
                    isDarkMode ? "text-blue-300" : "text-blue-800"
                  }`}
                >
                  Trial Mode Active
                </Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isDarkMode ? "text-yellow-400" : "text-yellow-700"
                    }`}
                  >
                    {recentPlanData?.days_left || 7} Days Left
                  </Text>
                </View>
              </View>
              <Text
                className={`text-sm mt-2 ${
                  isDarkMode ? "text-blue-400" : "text-blue-700"
                }`}
              >
                You're currently exploring the platform with a{" "}
                <Text className="font-bold">free trial</Text>. To continue
                enjoying all features without interruption, please upgrade to a
                paid plan.
              </Text>
              <View
                className={`rounded-xl p-3 mt-4 ${
                  isDarkMode ? "bg-blue-900/30" : "bg-sky-50"
                }`}
              >
                <View className="flex-row items-center">
                  <Icon name="alert" size={18} color="#0EA5E9" />
                  <Text
                    className={`text-sm ml-2 flex-1 ${
                      isDarkMode ? "text-blue-300" : "text-blue-800"
                    }`}
                  >
                    Your trial period will expire soon. Upgrade now to keep your
                    data and access.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handlePurchasePlan}
                className="bg-blue-600 px-6 py-3.5 rounded-xl flex-row items-center justify-center mt-4 shadow-lg"
                style={{
                  shadowColor: "#3B82F6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }}
              >
                <Icon name="credit-card" size={20} color="#ffffff" />
                <Text className="text-white font-semibold ml-2 text-base">
                  Purchase a Plan
                </Text>
                <Icon
                  name="arrow-right"
                  size={20}
                  color="#ffffff"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render No Plan Banner
  const renderNoPlanBanner = () => {
    if (planMode !== "free" && planMode !== null) return null;

    const features = [
      { icon: "check-circle", text: "Social Media Management" },
      { icon: "check-circle", text: "Analytics Dashboard" },
      { icon: "check-circle", text: "Post Scheduling" },
      { icon: "check-circle", text: "Basic Support" },
    ];

    return (
      <View className="px-4 pt-6">
        <View
          className={`rounded-3xl p-6 border ${
            isDarkMode
              ? "bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-800"
              : "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200"
          }`}
        >
          <View className="flex-row items-start">
            <View
              className={`p-3 rounded-full ${
                isDarkMode ? "bg-purple-900/30" : "bg-purple-100"
              }`}
            >
              <Icon name="crown" size={28} color="#8B5CF6" />
            </View>
            <View className="ml-4 flex-1">
              <Text
                className={`text-lg font-bold ${
                  isDarkMode ? "text-purple-300" : "text-purple-800"
                }`}
              >
                Choose Your Plan
              </Text>
              <Text
                className={`text-sm mt-2 ${
                  isDarkMode ? "text-purple-400" : "text-purple-700"
                }`}
              >
                Select a plan that best fits your needs and unlock all premium
                features to grow your business.
              </Text>

              {/* Features List */}
              <View className="mt-4 space-y-2">
                {features.map((feature, index) => (
                  <View key={index} className="flex-row items-center">
                    <Icon name={feature.icon} size={16} color="#8B5CF6" />
                    <Text
                      className={`text-sm ml-2 ${
                        isDarkMode ? "text-purple-300" : "text-purple-700"
                      }`}
                    >
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              <View
                className={`rounded-xl p-3 mt-4 ${
                  isDarkMode ? "bg-purple-900/30" : "bg-purple-50"
                }`}
              >
                <View className="flex-row items-center">
                  <Icon name="information" size={18} color="#8B5CF6" />
                  <Text
                    className={`text-sm ml-2 flex-1 ${
                      isDarkMode ? "text-purple-300" : "text-purple-800"
                    }`}
                  >
                    Get started with our flexible plans starting from just
                    ₹9/month.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleViewPlans}
                className="bg-purple-600 px-6 py-3.5 rounded-xl flex-row items-center justify-center mt-4 shadow-lg"
                style={{
                  shadowColor: "#8B5CF6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }}
              >
                <Icon name="credit-card" size={20} color="#ffffff" />
                <Text className="text-white font-semibold ml-2 text-base">
                  View Plans & Pricing
                </Text>
                <Icon
                  name="arrow-right"
                  size={20}
                  color="#ffffff"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render Subscription Features
  const renderSubscriptionFeatures = () => {
    if (planMode !== "paid" || !currentPlan) return null;

    const planInfo = getPlanDetails();
    if (!planInfo) return null;

    return (
      <View className="px-4 pt-6">
        <Text
          className={`text-lg font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
        >
          Plan Features
        </Text>
        <View
          className={`rounded-3xl p-6 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          {planInfo.features.map((feature, index) => (
            <View
              key={index}
              className={`flex-row items-center py-3 ${
                index < planInfo.features.length - 1
                  ? isDarkMode
                    ? "border-b border-gray-700"
                    : "border-b border-gray-100"
                  : ""
              }`}
            >
              <View
                className={`p-1.5 rounded-full mr-3 ${
                  isDarkMode ? "bg-green-900/30" : "bg-green-100"
                }`}
              >
                <Icon name="check" size={14} color="#10B981" />
              </View>
              <Text
                className={`flex-1 text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={isDarkMode ? "#111827" : "#F9FAFB"}
        />
        <Header
          title="Billing"
          userName={user?.name || "User"}
          userEmail={user?.email || "guest@example.com"}
          activeScreen="Billing"
          navigationItems={menuItems}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text
            className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
          >
            Loading billing information...
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
        title="Billing"
        userName={user?.name || "User"}
        userEmail={user?.email || "guest@example.com"}
        activeScreen="Billing"
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
                  ? isDarkMode
                    ? "#4B5563"
                    : "#9CA3AF"
                  : isDarkMode
                    ? "#9CA3AF"
                    : "#4b5563"
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
        {/* Banner Section */}
        {planMode === "paid" ? (
          <>
            {/* Current Plan Header */}
            <View className="px-4 pt-6 pb-2">
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  My Subscription
                </Text>
                <View
                  className={`px-3 py-1.5 rounded-full ${
                    isDarkMode ? "bg-green-900/30" : "bg-green-100"
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    <Text
                      className={`text-xs font-medium ${
                        isDarkMode ? "text-green-400" : "text-green-700"
                      }`}
                    >
                      Active
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Subscription Card */}
            <View className="px-3">
              <SubscriptionCard
                subscription={subscription}
                onUpgrade={handleUpgrade}
                onRenew={handleRenew}
                onCancel={handleCancel}
                loading={isProcessing}
              />
            </View>

            {/* Stats Cards */}
            {renderStatsCards()}

            {/* Plan Features */}
            {renderSubscriptionFeatures()}

            {/* Payment History Header */}
            <View className="px-4 pt-6 pb-2">
              <Text
                className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                Payment History
              </Text>
            </View>

            {/* Payment History */}
            <PaymentHistory
              payments={payments}
              loading={loading}
              onViewInvoice={(payment) => {
                console.log("View invoice:", payment);
              }}
              onDownloadInvoice={(payment) => {
                console.log("Download invoice:", payment);
              }}
            />
          </>
        ) : (
          <>
            {planMode === "trial" ? renderTrialBanner() : renderNoPlanBanner()}
          </>
        )}
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
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You will lose access to premium features and your data may be deleted after 30 days."
        onConfirm={confirmCancel}
        onCancel={() => {
          setConfirmationModalVisible(false);
          setCancelAction(null);
        }}
        confirmText="Yes, Cancel"
        cancelText="Keep Plan"
        confirmButtonColor="#EF4444"
        loading={isProcessing}
      />
    </View>
  );
};

export default PlansScreen;
