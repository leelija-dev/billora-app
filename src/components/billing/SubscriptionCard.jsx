// components/billing/SubscriptionCard.jsx
import { Text, TouchableOpacity, View } from "react-native";
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

  // Handle upgrade - redirect to website
  const handleUpgradePress = () => {
    if (onUpgrade) {
      onUpgrade();
    }
  };

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
  const discountedPrice = calculateDiscountedPrice(
    originalPrice,
    discountPercentage,
  );

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

  if (!subscription) {
    return (
      <View
        className={`rounded-2xl p-6 items-center ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <View
          className={`p-3 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}
        >
          <Icon name="crown" size={32} color="#8B5CF6" />
        </View>
        <Text
          className={`text-base font-bold mt-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
        >
          No Active Plan
        </Text>
        <Text
          className={`text-sm mt-1 text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
        >
          Choose a plan to unlock premium features
        </Text>
        <TouchableOpacity
          onPress={handleUpgradePress}
          className="bg-blue-600 px-6 py-2.5 rounded-xl mt-4"
        >
          <Text className="text-white font-semibold">View Plans</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isActive = subscription.status === "active" && !isExpired();

  return (
    <View
      className={`rounded-2xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
    >
      {/* Header */}
      <View
        className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className={`p-2 rounded-full ${isDarkMode ? "bg-blue-900/30" : "bg-blue-50"}`}
            >
              <Icon name="crown" size={20} color="#3B82F6" />
            </View>
            <View className="ml-3">
              <Text
                className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {subscription.plan || subscription.planDetails?.name || "Plan"}
              </Text>
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${isActive ? (isDarkMode ? "bg-green-900/30" : "bg-green-100") : isDarkMode ? "bg-red-900/30" : "bg-red-100"}`}
          >
            <Text
              className={`text-xs font-medium ${isActive ? (isDarkMode ? "text-green-400" : "text-green-700") : isDarkMode ? "text-red-400" : "text-red-700"}`}
            >
              {isActive ? "Active" : "Expired"}
            </Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <View className="p-4">
        {/* Price */}
        <View
          className={`rounded-xl p-3 mb-4 ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Monthly Price
              </Text>
              {hasDiscount ? (
                <View>
                  <View className="flex-row items-center">
                    <Text
                      className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {formatCurrency(discountedPrice)}
                    </Text>
                    <Text
                      className={`text-xs ml-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      /{subscription.interval || "month"}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text
                      className={`text-xs line-through ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                    >
                      {formatCurrency(originalPrice)}
                    </Text>
                    <View
                      className={`ml-2 px-2 py-0.5 rounded-full ${isDarkMode ? "bg-green-900/30" : "bg-green-100"}`}
                    >
                      <Text
                        className={`text-xs font-medium ${isDarkMode ? "text-green-400" : "text-green-700"}`}
                      >
                        {discountPercentage}% OFF
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="flex-row items-center">
                  <Text
                    className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {formatCurrency(originalPrice)}
                  </Text>
                  <Text
                    className={`text-xs ml-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    /{subscription.interval || "month"}
                  </Text>
                </View>
              )}
            </View>
            <Icon name="shield-check" size={28} color="#3B82F6" />
          </View>
        </View>

        {/* Subscription Dates */}
        <View
          className={`rounded-xl p-3 mb-4 ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Start Date
              </Text>
              <Text
                className={`text-sm font-medium mt-0.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {formatDate(subscription.currentPeriodStart)}
              </Text>
            </View>
            <View className="items-end">
              <Text
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                End Date
              </Text>
              <Text
                className={`text-sm font-medium mt-0.5 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {formatDate(subscription.currentPeriodEnd)}
              </Text>
              {subscription.currentPeriodEnd && (
                <Text
                  className={`text-xs mt-0.5 ${
                    isExpired()
                      ? "text-red-500"
                      : isNearExpiry()
                        ? "text-yellow-500"
                        : isDarkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                  }`}
                >
                  {isExpired()
                    ? "Expired"
                    : isNearExpiry()
                      ? "Expiring soon"
                      : `${Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))} days left`}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-2">
          {isActive ? (
            <>
              <TouchableOpacity
                onPress={handleUpgradePress}
                disabled={loading}
                className="bg-blue-600 py-2.5 rounded-xl flex-row items-center justify-center"
              >
                <Icon name="trending-up" size={18} color="#ffffff" />
                <Text className="font-semibold text-white ml-2">
                  Upgrade Plan
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onRenew}
                disabled={loading}
                className={`py-2.5 rounded-xl flex-row items-center justify-center border ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
              >
                <Icon
                  name="refresh"
                  size={18}
                  color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
                <Text
                  className={`font-semibold ml-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Renew
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onCancel}
                disabled={loading}
                className={`py-2.5 rounded-xl flex-row items-center justify-center ${isDarkMode ? "bg-red-900/20" : "bg-red-50"}`}
              >
                <Icon name="close-circle" size={18} color="#EF4444" />
                <Text className="font-semibold ml-2 text-red-600">Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={onRenew}
              disabled={loading}
              className="bg-blue-600 py-2.5 rounded-xl flex-row items-center justify-center"
            >
              <Icon name="refresh" size={18} color="#ffffff" />
              <Text className="font-semibold text-white ml-2">Renew Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default SubscriptionCard;
