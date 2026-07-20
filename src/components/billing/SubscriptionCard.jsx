// components/billing/SubscriptionCard.jsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../store/themeStore";

const SubscriptionCard = ({
  subscription,
  onUpgrade,
  onRenew,
  onCancel,
  loading,
}) => {
  const { isDarkMode } = useThemeStore();

  // Helper function to calculate discounted price
  const calculateDiscountedPrice = (price, discountPercentage) => {
    const originalPrice = parseFloat(price) || 0;
    const discount = parseFloat(discountPercentage) || 0;
    const discountedPrice = originalPrice - (originalPrice * discount) / 100;
    return discountedPrice;
  };

  const getOriginalPrice = () => {
    return parseFloat(subscription?.planDetails?.price || 0);
  };

  const getDiscountPercentage = () => {
    return parseFloat(subscription?.planDetails?.discount) || 0;
  };

  const originalPrice = getOriginalPrice();
  const discountPercentage = getDiscountPercentage();
  const hasDiscount = discountPercentage > 0;
  const discountedPrice = calculateDiscountedPrice(originalPrice, discountPercentage);

  // Check if plan is near expiry (within 7 days)
  const isNearExpiry = () => {
    if (!subscription?.currentPeriodEnd) return false;
    const endDate = new Date(subscription.currentPeriodEnd);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 7 && daysRemaining > 0;
  };

  // Check if plan is expired
  const isExpired = () => {
    if (!subscription?.currentPeriodEnd) return false;
    const endDate = new Date(subscription.currentPeriodEnd);
    const today = new Date();
    return endDate < today;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  return (
    <View
      className={`rounded-3xl shadow-sm overflow-hidden ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      {/* Header */}
      <View className={`px-6 py-4 border-b ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      }`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className={`p-3 rounded-full ${
              isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
            }`}>
              <Icon name="credit-card" size={24} color="#3B82F6" />
            </View>
            <View className="ml-3">
              <Text className={`font-bold text-lg ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                Current Subscription
              </Text>
              <Text className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                Your active plan details
              </Text>
            </View>
          </View>
        </View>
      </View>

      {subscription ? (
        <View className="p-6 space-y-4">
          {/* Plan Name */}
          <View className="flex-row items-center justify-between pb-3 border-b">
            <Text className={`${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              Plan Name
            </Text>
            <Text className={`font-semibold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
              {subscription.plan || subscription.planDetails?.name || "N/A"}
            </Text>
          </View>

          {/* Price */}
          <View className="flex-row items-center justify-between pb-3 border-b">
            <Text className={`${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              Price
            </Text>
            <View className="items-end">
              {hasDiscount ? (
                <>
                  <View className="flex-row items-center">
                    <Text className={`font-bold text-lg ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}>
                      {formatCurrency(discountedPrice)}
                    </Text>
                    <Text className={`text-sm ml-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      /{subscription.planDetails?.duration_days || "month"} Days
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <Text className={`text-xs line-through ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}>
                      {formatCurrency(originalPrice)}
                    </Text>
                    <View className={`ml-2 px-2 py-0.5 rounded-full flex-row items-center ${
                      isDarkMode ? "bg-green-900/30" : "bg-green-100"
                    }`}>
                      <Icon name="tag" size={10} color="#10B981" />
                      <Text className={`text-xs font-medium ml-1 ${
                        isDarkMode ? "text-green-400" : "text-green-700"
                      }`}>
                        {discountPercentage}% OFF
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <View className="flex-row items-center">
                  <Text className={`font-bold text-lg ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}>
                    {formatCurrency(originalPrice)}
                  </Text>
                  <Text className={`text-sm ml-1 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    /{subscription.interval || "month"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status */}
          <View className="flex-row items-center justify-between pb-3 border-b">
            <Text className={`${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              Status
            </Text>
            <View className={`px-3 py-1 rounded-full ${
              subscription.status === "active"
                ? isDarkMode ? "bg-green-900/30" : "bg-green-100"
                : isDarkMode ? "bg-yellow-900/30" : "bg-yellow-100"
            }`}>
              <Text className={`text-xs font-medium ${
                subscription.status === "active"
                  ? isDarkMode ? "text-green-400" : "text-green-700"
                  : isDarkMode ? "text-yellow-400" : "text-yellow-700"
              }`}>
                {subscription.status === "active" ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>

          {/* Start Date */}
          {subscription.currentPeriodStart && (
            <View className="flex-row items-center justify-between pb-3 border-b">
              <Text className={`${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Start Date
              </Text>
              <Text className={`text-sm ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
                {formatDate(subscription.currentPeriodStart)}
              </Text>
            </View>
          )}

          {/* End Date */}
          {subscription.currentPeriodEnd && (
            <View className="flex-row items-center justify-between pb-3 border-b">
              <Text className={`${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                End Date
              </Text>
              <View className="items-end">
                <Text className={`text-sm ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  {formatDate(subscription.currentPeriodEnd)}
                </Text>
                {subscription.currentPeriodEnd && (
                  <Text className={`text-xs mt-1 ${
                    isExpired()
                      ? "text-red-500"
                      : isNearExpiry()
                      ? "text-yellow-500"
                      : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}>
                    {isExpired()
                      ? "Expired"
                      : isNearExpiry()
                      ? "Expiring soon"
                      : `${Math.ceil(
                          (new Date(subscription.currentPeriodEnd) - new Date()) /
                            (1000 * 60 * 60 * 24)
                        )} days remaining`}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Payment ID */}
          {subscription.paymentId && (
            <View className="flex-row items-center justify-between pb-3 border-b">
              <Text className={`${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Payment ID
              </Text>
              <Text className={`text-xs font-mono ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                {subscription.paymentId}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="pt-2 space-y-3">
            {/* Renew button */}
            {subscription.status === "active" && !isExpired() && (
              <TouchableOpacity
                onPress={onRenew}
                disabled={loading}
                className={`py-3 px-4 rounded-xl flex-row items-center justify-center ${
                  isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
                }`}
              >
                <Icon name="refresh" size={20} color="#3B82F6" />
                <Text className={`font-medium ml-2 ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}>
                  Renew Plan
                </Text>
              </TouchableOpacity>
            )}

            {subscription.status === "active" && !isExpired() && (
              <>
                <TouchableOpacity
                  onPress={onUpgrade}
                  disabled={loading}
                  className="bg-blue-600 py-3 px-4 rounded-xl flex-row items-center justify-center"
                >
                  <Icon name="trending-up" size={20} color="#ffffff" />
                  <Text className="font-medium text-white ml-2">
                    Upgrade Plan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onCancel}
                  disabled={loading}
                  className={`py-3 px-4 rounded-xl flex-row items-center justify-center border ${
                    isDarkMode ? "border-gray-600" : "border-gray-300"
                  }`}
                >
                  <Icon name="close-circle" size={20} color="#EF4444" />
                  <Text className={`font-medium ml-2 text-red-600`}>
                    Cancel Subscription
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Renew for expired plans */}
            {isExpired() && (
              <TouchableOpacity
                onPress={onRenew}
                disabled={loading}
                className="bg-blue-600 py-3 px-4 rounded-xl flex-row items-center justify-center"
              >
                <Icon name="refresh" size={20} color="#ffffff" />
                <Text className="font-medium text-white ml-2">
                  Renew Subscription
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View className="p-8 items-center">
          <Text className={`${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          }`}>
            No active subscription found
          </Text>
          <TouchableOpacity
            onPress={onUpgrade}
            className="bg-blue-600 py-3 px-6 rounded-xl mt-4"
          >
            <Text className="font-medium text-white">Choose a Plan</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default SubscriptionCard;
