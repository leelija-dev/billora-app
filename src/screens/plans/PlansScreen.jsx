// screens/plans/PlansScreen.jsx
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Header from "../../components/common/Header";
import { SuccessModal, ErrorModal, ConfirmationModal } from "../../components/common/CustomModal";
import SubscriptionCard from "../../components/billing/SubscriptionCard";
import PaymentHistory from "../../components/billing/PaymentHistory";
import SubscriptionForm from "../../components/billing/SubscriptionForm";
import { useAuthStore } from "../../store/authStore";
import useBillingStore from "../../store/billingStore";
import billingAPI from "../../api/billing";
import { useThemeStore } from "../../store/themeStore";
import { usePermissionStore } from "../../store/permissionStore";
import Toast from "react-native-toast-message";

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
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeData, setUpgradeData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    }, [user?.id])
  );

  const loadData = async () => {
    try {
      setInitialLoading(true);
      
      // Check plan mode from user
      if (user?.plan_mode) {
        setPlanMode(user.plan_mode);
      }

      if (user?.plan_mode === 'paid') {
        await Promise.all([
          fetchPlans(),
          fetchPaymentHistory(getUserId(), 1, 10),
          fetchRecentPlan(getUserId()),
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
  const currentPlan = subscription?.planDetails || plans.find(p => p.id === subscription?.planId);

  // Handle upgrade
  const handleUpgrade = () => {
    setShowSubscriptionForm(true);
  };

  // Handle renew
  const handleRenew = async () => {
    if (!currentPlan) {
      setErrorMessage("No plan found to renew");
      setErrorModalVisible(true);
      return;
    }

    const planPrice = parseFloat(currentPlan.price || currentPlan.amount || 0);
    const discountPercentage = parseFloat(currentPlan.discount) || 0;
    const gstPercentage = parseFloat(currentPlan.gst) || 18;

    const discountAmount = (planPrice * discountPercentage) / 100;
    const discountedPrice = planPrice - discountAmount;
    const gst = (discountedPrice * gstPercentage) / 100;
    const totalAmount = discountedPrice + gst;

    setUpgradeData({
      plan_id: currentPlan.id,
      plan_name: currentPlan.name,
      original_amount: planPrice,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      discounted_amount: discountedPrice,
      gst_percentage: gstPercentage,
      gst_amount: gst,
      total_amount: totalAmount,
      customer_id: getUserId(),
    });

    Alert.alert(
      "Renew Plan",
      `Renew ${currentPlan.name} for ${formatCurrency(totalAmount)}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Renew", onPress: processRenew },
      ]
    );
  };

  const processRenew = async () => {
    if (!upgradeData) return;

    setIsProcessing(true);
    try {
      const response = await billingAPI.renewPlan({
        plan_id: upgradeData.plan_id,
        customer_id: upgradeData.customer_id,
        amount: upgradeData.total_amount,
      });

      if (response?.data?.session_id) {
        setSuccessMessage("Renewal initiated! Redirecting to payment...");
        setSuccessModalVisible(true);
        // In a real app, you would open Cashfree payment here
        // For now, just redirect to pricing page
        setTimeout(() => {
          handlePurchasePlan();
        }, 2000);
      } else {
        setErrorMessage(response?.data?.message || "Failed to initiate renewal");
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error("Renewal error:", error);
      setErrorMessage(error.response?.data?.message || "Renewal failed");
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You will lose access to premium features.",
      [
        { text: "Keep Plan", style: "cancel" },
        { text: "Cancel", style: "destructive", onPress: () => {
          setSuccessMessage("Subscription cancelled successfully");
          setSuccessModalVisible(true);
        }},
      ]
    );
  };

  // Handle plan selection from form
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowSubscriptionForm(false);
    
    // Calculate upgrade pricing
    const newPlanPrice = parseFloat(plan.price || plan.amount || 0);
    const gstPercentage = parseFloat(plan.gst) || 18;
    const discountPercentage = parseFloat(plan.discount) || 0;
    
    const discountAmount = (newPlanPrice * discountPercentage) / 100;
    const discountedPrice = newPlanPrice - discountAmount;
    
    let upgradeAmount = discountedPrice;
    let currentPlanRemaining = 0;
    
    if (recentPlanData && recentPlanData.remainingAmount > 0) {
      currentPlanRemaining = parseFloat(recentPlanData.remainingAmount) || 0;
      upgradeAmount = Math.max(0, discountedPrice - currentPlanRemaining);
    }
    
    const gst = (upgradeAmount * gstPercentage) / 100;
    const totalAmount = upgradeAmount + gst;
    
    setUpgradeData({
      plan_id: plan.id,
      plan_name: plan.name,
      original_amount: newPlanPrice,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      discounted_amount: discountedPrice,
      current_plan_remaining: currentPlanRemaining,
      upgrade_amount: upgradeAmount,
      gst: gst,
      gst_percentage: gstPercentage,
      total_amount: totalAmount,
      customer_id: getUserId(),
    });
    
    setShowUpgradeForm(true);
  };

  // Process upgrade
  const processUpgrade = async () => {
    if (!upgradeData) return;

    setIsProcessing(true);
    try {
      const response = await billingAPI.upgradePlan({
        amount: upgradeData.total_amount,
        plan_id: upgradeData.plan_id,
        customer_id: upgradeData.customer_id,
        upgrade_amount: upgradeData.upgrade_amount,
        remaining_amount: upgradeData.current_plan_remaining,
      });

      if (response?.data?.session_id) {
        setSuccessMessage("Upgrade initiated! Redirecting to payment...");
        setSuccessModalVisible(true);
        setShowUpgradeForm(false);
        // In a real app, you would open Cashfree payment here
        setTimeout(() => {
          handlePurchasePlan();
        }, 2000);
      } else {
        setErrorMessage(response?.data?.message || "Failed to initiate upgrade");
        setErrorModalVisible(true);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      setErrorMessage(error.response?.data?.message || "Upgrade failed");
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
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
          <Text className={`mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
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
              color={loading ? (isDarkMode ? "#4B5563" : "#9CA3AF") : isDarkMode ? "#9CA3AF" : "#4b5563"}
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
        {planMode === 'paid' ? (
          // Paid User View
          <>
            {/* Current Plan Card */}
            <View className="px-4 pt-6 pb-4">
              <Text className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Current Plan
              </Text>
            </View>

            <SubscriptionCard
              subscription={subscription}
              onUpgrade={handleUpgrade}
              onRenew={handleRenew}
              onCancel={handleCancel}
              loading={isProcessing}
            />

            {/* Payment History */}
            <View className="px-4 pt-6 pb-4">
              <Text className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Payment History
              </Text>
            </View>

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
        ) : planMode === 'trial' ? (
          // Trial Mode View
          <View className="px-4 pt-6">
            <View className={`rounded-3xl p-6 border ${
              isDarkMode ? "bg-blue-900/20 border-blue-800" : "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200"
            }`}>
              <View className="flex-row items-start">
                <View className={`p-3 rounded-full ${
                  isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                }`}>
                  <Icon name="panda" size={24} color="#3B82F6" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className={`text-lg font-bold ${
                    isDarkMode ? "text-blue-300" : "text-blue-800"
                  }`}>
                    Trial Mode Active
                  </Text>
                  <Text className={`text-sm mt-2 ${
                    isDarkMode ? "text-blue-400" : "text-blue-700"
                  }`}>
                    You're currently exploring the platform with a <Text className="font-bold">free trial</Text>. 
                    To continue enjoying all features without interruption, please upgrade to a paid plan.
                  </Text>
                  <View className={`rounded-xl p-3 mt-4 ${
                    isDarkMode ? "bg-blue-900/30" : "bg-sky-50"
                  }`}>
                    <View className="flex-row items-center">
                      <Icon name="alert" size={16} color="#0EA5E9" />
                      <Text className={`text-sm ml-2 ${
                        isDarkMode ? "text-blue-300" : "text-blue-800"
                      }`}>
                        Your trial period will expire soon. Upgrade now to keep your data and access.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handlePurchasePlan}
                    className="bg-blue-600 px-6 py-3 rounded-xl flex-row items-center justify-center mt-4"
                  >
                    <Icon name="credit-card" size={20} color="#ffffff" />
                    <Text className="text-white font-semibold ml-2">
                      Purchase a Plan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          // No Plan View
          <View className="px-4 pt-6">
            <View className={`rounded-3xl p-6 border ${
              isDarkMode ? "bg-blue-900/20 border-blue-800" : "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200"
            }`}>
              <View className="flex-row items-start">
                <View className={`p-3 rounded-full ${
                  isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                }`}>
                  <Icon name="credit-card" size={24} color="#3B82F6" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className={`text-lg font-bold ${
                    isDarkMode ? "text-blue-300" : "text-blue-800"
                  }`}>
                    No Active Plan Found
                  </Text>
                  <Text className={`text-sm mt-2 ${
                    isDarkMode ? "text-blue-400" : "text-blue-700"
                  }`}>
                    It looks like you don't have an active subscription yet. 
                    Choose a plan that best fits your needs and unlock all premium features.
                  </Text>
                  <View className={`rounded-xl p-3 mt-4 ${
                    isDarkMode ? "bg-blue-900/30" : "bg-sky-50"
                  }`}>
                    <View className="flex-row items-center">
                      <Icon name="information" size={16} color="#0EA5E9" />
                      <Text className={`text-sm ml-2 ${
                        isDarkMode ? "text-blue-300" : "text-blue-800"
                      }`}>
                        Get started with our flexible plans starting from just ₹9/month.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleViewPlans}
                    className="bg-blue-600 px-6 py-3 rounded-xl flex-row items-center justify-center mt-4"
                  >
                    <Icon name="credit-card" size={20} color="#ffffff" />
                    <Text className="text-white font-semibold ml-2">
                      View Plans & Pricing
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
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

      {/* Subscription Form Modal */}
      {showSubscriptionForm && (
        <SubscriptionForm
          plans={plans}
          currentPlan={currentPlan}
          onSubmit={handlePlanSelect}
          onCancel={() => setShowSubscriptionForm(false)}
          isSubmitting={isProcessing}
        />
      )}

      {/* Upgrade Confirmation Modal */}
      {showUpgradeForm && upgradeData && (
        <ConfirmationModal
          visible={showUpgradeForm}
          title="Upgrade Plan"
          message={`Upgrade to ${upgradeData.plan_name} for ${formatCurrency(upgradeData.total_amount)}?\n\n${upgradeData.current_plan_remaining > 0 ? `Current plan remaining: ${formatCurrency(upgradeData.current_plan_remaining)}\n` : ""}Upgrade amount: ${formatCurrency(upgradeData.upgrade_amount)}\nGST (${upgradeData.gst_percentage}%): ${formatCurrency(upgradeData.gst)}`}
          onConfirm={processUpgrade}
          onCancel={() => {
            setShowUpgradeForm(false);
            setUpgradeData(null);
          }}
          confirmText="Upgrade"
          cancelText="Cancel"
          confirmButtonColor="#3B82F6"
          loading={isProcessing}
        />
      )}
    </View>
  );
};

export default PlansScreen;
